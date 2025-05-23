import type { GetCommitsParams, GetSemverTagsParams } from '@conventional-changelog/git-client';
import type { ChangelogPresetOptions, ExecOpts, Package } from '@lerna-lite/core';
import type { Options as WriterOptions } from 'conventional-changelog-writer';
import type { Commit, ParserOptions, ParserStreamOptions } from 'conventional-commits-parser';
import type { BumperRecommendation } from 'conventional-recommended-bump';

export interface GitCommitOption {
  amend: boolean;
  commitHooks: boolean;
  overrideMessage?: boolean;
  signGitCommit: boolean;
  signoffGitCommit: boolean;
}

export interface GitTagOption {
  amend?: boolean;
  commitHooks?: boolean;
  granularPathspec?: boolean;
  signGitCommit?: boolean;
  signoffGitCommit?: boolean;
  overrideMessage?: boolean;
  forceGitTag?: boolean;
  signGitTag?: boolean;
}

export type VersioningStrategy = 'fixed' | 'independent';
export type ChangelogType = 'fixed' | 'independent' | 'root';
export type ChangelogPresetConfig = string | ChangelogPresetOptions;

export interface BaseChangelogOptions {
  changelogPreset?: ChangelogPresetConfig;
  rootPath?: string;
  tagPrefix?: string;
}

/** @deprecated @use ChangelogBumperOption interface */
export interface OldChangelogBumperOption {
  parserOpts: ParserOptions;
  writerOpts: WriterOptions;
  whatBump: (commits: Commit[]) => Promise<BumperRecommendation | null | undefined>;
}

export interface ChangelogBumperOption {
  parser: ParserOptions;
  writer: WriterOptions;
  whatBump: (commits: Commit[]) => Promise<BumperRecommendation | null | undefined>;
}

export interface ChangelogConfig {
  /** @deprecated to be removed in next major */
  conventionalChangelog?: ChangelogBumperOption | OldChangelogBumperOption;
  name?: string;
  key?: string;
  tags?: GetSemverTagsParams;
  commits?: GetCommitsParams;
  parser?: ParserStreamOptions;
  writer?: WriterOptions;
  whatBump: (commits: Commit[]) => Promise<BumperRecommendation | null | undefined>;
}

export interface ReleaseNote {
  name: string;
  notes?: string;
  pkg?: Package;
}

export type RemoteCommit = {
  /** git commit author name */
  authorName: string;

  /** remote client login (ie github login) */
  login: string;

  /** commit message headling (50 chars maxlen) */
  message: string;

  /** commit hash */
  hash: string;

  /** short commit hash (7 chars long) */
  shortHash: string;
};

export interface UpdateChangelogOption {
  changelogHeaderMessage?: string;
  changelogPreset?: ChangelogPresetConfig;
  changelogIncludeCommitsGitAuthor?: boolean | string;
  changelogIncludeCommitsClientLogin?: boolean | string;
  commitsSinceLastRelease?: RemoteCommit[];
  rootPath?: string;
  tagPrefix?: string;
  version?: string;
}

export interface GitClientReleaseOption {
  owner: string;
  repo: string;
  tag_name: string;
  name?: string;
  body?: string;
  draft?: boolean;
  prerelease?: boolean;
  generate_release_notes?: boolean;
  discussion_category_name?: string;
}

export type GitCreateReleaseFn = (options: GitClientReleaseOption) => Promise<{
  ok: boolean;
  status: string;
  statusText: string;
}>;

export interface GitClient {
  createRelease: (opts: GitClientReleaseOption) => Promise<void>;
}

export interface GitCreateReleaseClientOutput {
  repos: GitClient;
}

/** Passed between concurrent executions */
export interface OneTimePasswordCache {
  /* The one-time password, passed as an option or received via prompt */
  otp?: string | number;
}

export interface ReleaseClient {
  repos: {
    createRelease: GitCreateReleaseFn;
  };
}

export interface ReleaseCommandProps {
  tags: string[];
  tagVersionSeparator: string;
  releaseNotes: ReleaseNote[];
}

export interface ReleaseOptions {
  gitRemote: string;
  execOpts: ExecOpts;
  skipBumpOnlyReleases?: boolean;
}
