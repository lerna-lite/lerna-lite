import type { GetCommitsParams, GetSemverTagsParams } from '@conventional-changelog/git-client';
import type { ChangelogPresetOptions, ExecOpts, Package } from '@lerna-lite/core';
import { type Logger } from '@lerna-lite/npmlog';
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

export interface RemoteCommit {
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
}

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
  compareCommits?: (opts: { owner: string; repo: string; base: string; head: string }) => Promise<{ data: CommitData }>;
}

export interface OctokitClientOutput {
  issues?: {
    createComment: (options: { owner: string; repo: string; issue_number: number; body: string }) => Promise<any>;
  };
  repos: GitClient;
  search?: {
    issuesAndPullRequests: (options: {
      q: string;
      advanced_search?: boolean;
      per_page?: number;
      page?: number;
    }) => Promise<{ data: { items: any[] } }>;
  };
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

export interface ClientCommit {
  sha: string;
  node_id: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    comment_count: number;
    verification: {
      verified: boolean;
      reason: string;
      signature: any;
      payload: any;
      verified_at: any;
    };
  };
  url: string;
  html_url: string;
  comments_url: string;
  author: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    user_view_type: string;
    site_admin: boolean;
  };
  committer: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    user_view_type: string;
    site_admin: boolean;
  };
  parents: [
    {
      sha: string;
      url: string;
      html_url: string;
    },
  ];
}

export interface CommitData {
  ahead_by: number;
  base_commit: ClientCommit;
  behind_by: number;
  commits: ClientCommit[];
  diff_url: string;
  files: any[];
  html_url: string;
  merge_base_commit: ClientCommit;
  patch_url: string;
  permalink_url: string;
  status: string;
  total_commits: number;
  url: string;
}

export interface CommentResolvedOptions {
  client: OctokitClientOutput;
  commentFilterKeywords: string[];
  currentBranch: string;
  dryRun?: boolean;
  execOpts: ExecOpts;
  gitRemote: string;
  logger: Logger;
  prevTagDate?: string;
  version: string;
  tag: string;
  templates: {
    issue?: string;
    pullRequest?: string;
  };
}
