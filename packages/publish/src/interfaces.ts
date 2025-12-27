import type fetch from 'npm-registry-fetch';

export interface DistTagOptions extends fetch.FetchOptions {
  defaultTag?: string;
  dryRun?: boolean;
  tag: string;
}

export type KebabCase<S> = S extends `${infer C}${infer T}`
  ? KebabCase<T> extends infer U
    ? U extends string
      ? T extends Uncapitalize<T>
        ? `${Uncapitalize<C>}${U}`
        : `${Uncapitalize<C>}-${U}`
      : never
    : never
  : S;

/** LibNpmPublishOptions -  https://github.com/npm/libnpmpublish#opts */
export interface LibNpmPublishOptions extends KebabCase<fetch.FetchOptions> {
  access?: 'public' | 'restricted';
  defaultTag: string;
  dryRun?: boolean;
  // libnpmpublish / npm-registry-fetch check strictSSL rather than strict-ssl
  strictSSL?: boolean | 'true' | 'false';
  /* Passed to libnpmpublish as `opts.defaultTag` to preserve npm v6 back-compat */
  tag?: string;
  registry?: string;
}

export interface PackagePublishConfig {
  access?: 'public' | 'restricted';
  defaultTag?: string;
  registry?: string;
  tag?: string;
}

export interface Tarball {
  name: string;
  version: string;
  files: any[];
  bundled: any[];
  filename: string;
  size: number;
  unpackedSize: number;
  shasum: string;
  integrity: boolean;
  entryCount: number;
  tarFilePath: string;
}