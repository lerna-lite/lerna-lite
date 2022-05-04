import fetch from 'npm-registry-fetch';

export interface DistTagOptions extends fetch.FetchOptions {
  defaultTag?: string;
  dryRun?: boolean;
  tag: string;
}

/** LibNpmPublishOptions -  https://github.com/npm/libnpmpublish#opts */
export interface LibNpmPublishOptions extends fetch.FetchOptions {
  access?: 'public' | 'restricted';
  defaultTag?: string;
  dryRun?: boolean;
  /* Passed to libnpmpublish as `opts.defaultTag` to preserve npm v6 back-compat */
  tag?: string;
}

export interface PackagePublishConfig {
  access?: 'public' | 'restricted';
  defaultTag?: string;
  registry?: string;
  tag?: string;
}