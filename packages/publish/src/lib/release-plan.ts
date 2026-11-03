import { createHash } from 'node:crypto';
import { createReadStream, constants } from 'node:fs';
import { chmod, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { ValidationError } from '@lerna-lite/core';
import npa from 'npm-package-arg';
import npmFetch from 'npm-registry-fetch';
import ssri from 'ssri';

export interface ReleasePlanPackage {
  name: string;
  version: string;
  registry: string;
  tag: string;
  previousTag: string | null;
  previousTemporaryTag: string | null;
  sha256: string;
  manifestSha256: string;
}

export interface ReleasePlan {
  schemaVersion: 1;
  gitHead: string;
  tempTag: boolean;
  packages: ReleasePlanPackage[];
}

export function recoveryError(message: string): never {
  throw new ValidationError('ERESUME', message);
}

export function registryUrl(value: string): string {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    recoveryError('Release plans require a registry URL without embedded credentials, query parameters, or fragments.');
  }
  return url.href.endsWith('/') ? url.href : `${url.href}/`;
}

export async function tarballHash(path: string): Promise<string> {
  const hash = createHash('sha256');
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk);
  }
  return hash.digest('hex');
}

export function archivedTarballPath(planPath: string, sha256: string): string {
  if (!/^[a-f0-9]{64}$/.test(sha256)) {
    recoveryError('Invalid tarball hash in release plan.');
  }
  return join(`${planPath}.artifacts`, `${sha256}.tgz`);
}

export async function archiveTarball(planPath: string, sha256: string, source: string): Promise<void> {
  const directory = `${planPath}.artifacts`;
  await mkdir(directory, { recursive: true });
  const destination = archivedTarballPath(planPath, sha256);
  try {
    await copyFile(source, destination, constants.COPYFILE_EXCL);
    await chmod(destination, 0o600);
  } catch (error: any) {
    if (error.code !== 'EEXIST' || (await tarballHash(destination)) !== sha256) {
      throw error;
    }
  }
  if ((await tarballHash(destination)) !== sha256) {
    recoveryError('Archived release tarball does not match the release plan.');
  }
}

export function manifestHash(manifest: unknown): string {
  return createHash('sha256').update(JSON.stringify(manifest)).digest('hex');
}

export async function readReleasePlan(path: string): Promise<ReleasePlan> {
  const plan = JSON.parse(await readFile(path, 'utf8'));
  if (
    plan?.schemaVersion !== 1 ||
    !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(plan.gitHead ?? '') ||
    typeof plan.tempTag !== 'boolean' ||
    !Array.isArray(plan.packages) ||
    !plan.packages.length
  ) {
    recoveryError('Invalid or unsupported release plan.');
  }
  const names = new Set<string>();
  for (const pkg of plan.packages) {
    if (
      !pkg ||
      typeof pkg.name !== 'string' ||
      typeof pkg.version !== 'string' ||
      typeof pkg.registry !== 'string' ||
      typeof pkg.tag !== 'string' ||
      !pkg.tag.trim() ||
      !/^[a-f0-9]{64}$/.test(pkg.sha256 ?? '') ||
      !/^[a-f0-9]{64}$/.test(pkg.manifestSha256 ?? '') ||
      !(pkg.previousTag === null || typeof pkg.previousTag === 'string') ||
      !(pkg.previousTemporaryTag === null || typeof pkg.previousTemporaryTag === 'string') ||
      names.has(pkg.name) ||
      npa.resolve(pkg.name, pkg.version).type !== 'version'
    ) {
      recoveryError('Invalid or duplicate package in release plan.');
    }
    registryUrl(pkg.registry);
    names.add(pkg.name);
  }
  return plan;
}

export async function writeReleasePlan(path: string, plan: ReleasePlan): Promise<void> {
  // Never replace an earlier release's recovery information.
  await writeFile(path, `${JSON.stringify(plan, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
}

export async function readRegistryState(
  pkg: Pick<ReleasePlanPackage, 'name' | 'version' | 'registry'>,
  options: Record<string, any>,
  artifactPath?: string
) {
  const spec = npa.resolve(pkg.name, pkg.version);
  try {
    const data: any = await npmFetch.json(new URL(spec.escapedName, registryUrl(pkg.registry)).href, {
      ...options,
      spec,
      registry: pkg.registry,
      method: 'GET',
      body: undefined,
      cache: false,
      offline: false,
      preferOffline: false,
      preferOnline: true,
    });
    if (!data || typeof data !== 'object' || !data.versions || typeof data.versions !== 'object') {
      recoveryError(`Invalid registry metadata for ${pkg.name}.`);
    }
    const published = data.versions[pkg.version];
    if (published && (published.name !== pkg.name || published.version !== pkg.version)) {
      recoveryError(`Registry metadata does not identify ${pkg.name}@${pkg.version}.`);
    }
    if (published && artifactPath) {
      const integrity =
        published.dist?.integrity ||
        (published.dist?.shasum && `sha1-${Buffer.from(published.dist.shasum, 'hex').toString('base64')}`);
      if (!integrity || !ssri.checkData(await readFile(artifactPath), integrity)) {
        recoveryError(`Published artifact does not match the release plan for ${pkg.name}@${pkg.version}.`);
      }
    }
    const tags = data['dist-tags'] ?? {};
    if (typeof tags !== 'object' || Array.isArray(tags) || Object.values(tags).some((version) => typeof version !== 'string')) {
      recoveryError(`Invalid registry dist-tags for ${pkg.name}.`);
    }
    return { published: Boolean(published), tags: tags as Record<string, string> };
  } catch (error: any) {
    if (error.code === 'E404') {
      return { published: false, tags: {} as Record<string, string> };
    }
    throw error;
  }
}

export function assertReleaseTags(pkg: ReleasePlanPackage, tags: Record<string, string>, tempTag: boolean) {
  const expected: Array<[string, string | null]> = [[pkg.tag, pkg.previousTag]];
  if (tempTag && pkg.tag !== 'lerna-temp') {
    expected.push(['lerna-temp', pkg.previousTemporaryTag]);
  }
  for (const [tag, previous] of expected) {
    const current = tags[tag] ?? null;
    // Completed cleanup can leave no temporary tag, even if one existed before this release.
    if (tag === 'lerna-temp' && tag !== pkg.tag && current === null) {
      continue;
    }
    if (current !== previous && current !== pkg.version) {
      recoveryError(`Dist-tag ${pkg.name}@${tag} changed since the release plan was created. Refusing to overwrite it.`);
    }
  }
}
