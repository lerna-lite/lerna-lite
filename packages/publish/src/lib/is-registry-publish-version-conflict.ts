import npa from 'npm-package-arg';
import npmFetch from 'npm-registry-fetch';

/** Confirm a registry publish conflict without depending on registry-specific error messages. */
export async function isRegistryPublishVersionConflict(
  error: unknown,
  manifest: { name?: string; version?: string },
  options: Record<string, unknown>
): Promise<boolean> {
  if (
    !(error instanceof Error) ||
    !('code' in error) ||
    error.code !== 'E409' ||
    ('method' in error && error.method !== 'PUT') ||
    options.stage === true ||
    !manifest.name ||
    !manifest.version
  ) {
    return false;
  }

  try {
    const spec = npa.resolve(manifest.name, manifest.version);
    const registry = npmFetch.pickRegistry(spec, options);
    const packument = (await npmFetch.json(spec.escapedName, {
      ...options,
      spec,
      registry,
      method: 'GET',
      body: undefined,
      // Check the registry itself: a cached version is not proof that it is still present.
      cache: false,
      offline: false,
      preferOffline: false,
      preferOnline: true,
    })) as { versions?: Record<string, { name?: string; version?: string }> } | null;
    const published = packument?.versions?.[manifest.version];
    return published?.name === manifest.name && published.version === manifest.version;
  } catch {
    // Preserve the original publish error if the version cannot be verified.
    return false;
  }
}
