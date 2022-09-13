import { GitRawCommitsOptions, ParserOptions } from 'conventional-changelog-core';
import { Options as WriterOptions } from 'conventional-changelog-writer';
import { Options as RecommendedBumpOptions } from 'conventional-recommended-bump';
import log from 'npmlog';
import npa from 'npm-package-arg';

import { Package } from '../package';
import { InitCommandOption, PublishCommandOption, RunCommandOption, VersionCommandOption } from './command-options';

export type VersioningStrategy = 'fixed' | 'independent';
export type ChangelogType = 'fixed' | 'independent' | 'root';
export type ChangelogPresetConfig = string | { name: string; [key: string]: unknown };

export interface BaseChangelogOptions {
  changelogPreset?: ChangelogPresetConfig;
  rootPath?: string;
  tagPrefix?: string;
}

export interface ChangelogConfig {
  conventionalChangelog: { parserOpts: ParserOptions; writerOpts: WriterOptions };
  gitRawCommitsOpts: GitRawCommitsOptions & { path: string };
  key?: string;
  parserOpts: ParserOptions;
  recommendedBumpOpts: RecommendedBumpOptions;
  writerOpts: WriterOptions;
}

export interface CommandOptions {
  rollPublish?: boolean;
  rollVersion?: boolean;
}

export type CommandType = '' | 'changed' | 'exec' | 'info' | 'init' | 'list' | 'publish' | 'run' | 'version';

export interface DescribeRefOptions {
  /* Defaults to `process.cwd()` */
  cwd?: string;

  /* Glob passed to `--match` flag */
  match?: string;
}

/* When annotated release tags are missing */
export interface DescribeRefFallbackResult {
  isDirty: boolean;
  lastVersion?: string;
  lastTagName?: string;
  refCount: number | string;
  sha: string;
}

/* When annotated release tags are present */
export interface DescribeRefDetailedResult {
  lastTagName: string;
  lastVersion: string;
  isDirty: boolean;
  refCount: number | string;
  sha: string;
}

/** Provided to any execa-based call */
export interface ExecOpts {
  cwd: string;
  maxBuffer?: number;
}

export interface LifecycleConfig {
  access?: 'public' | 'restricted';
  defaultTag?: string;
  ignorePrepublish?: boolean;
  ignoreScripts?: boolean;
  log: log.Logger;
  lernaCommand?: string;
  nodeOptions?: string;
  projectScope?: string | null;
  scriptShell?: string;
  scriptsPrependNodePath?: boolean;
  snapshot?: any;
  stdio?: string;
  tag?: string;
  unsafePerm?: boolean;
}

export interface Manifest {
  name: string;
  location: string;
  manifest: Package;
  version: string;
}

export interface UpdateChangelogOption {
  changelogHeaderMessage?: string;
  changelogVersionMessage?: string;
  changelogPreset?: string;
  changelogIncludeCommitsGitAuthor?: boolean | string;
  changelogIncludeCommitsClientLogin?: boolean | string;
  commitsSinceLastRelease?: RemoteCommit[];
  rootPath?: string;
  tagPrefix?: string;
  version?: string;

  /** @deprecated this option was renamed to `changelogIncludeCommitsGitAuthor` */
  changelogIncludeCommitAuthorFullname?: boolean | string;
}

export interface FetchConfig {
  fetchRetries: number;
  log: log.Logger;
  registry: string;
  username: string;
}

export interface PackConfig {
  log: log.Logger;

  /* If "publish", run "prepublishOnly" lifecycle */
  lernaCommand?: string;
  ignorePrepublish?: boolean;
}

export interface ProfileData {
  tfa: { pending: boolean; mode: 'auth-and-writes' | 'auth-only' };
  name: string;
  /* legacy field alias of `name` */
  username: string;
  email: string;
  email_verified: boolean;
  created: string;
  updated: string;
  fullname?: string;
  twitter?: string;
  github?: string;
}

export interface QueryGraphConfig {
  /** "dependencies" excludes devDependencies from graph */
  graphType?: 'all' | 'allDependencies' | 'dependencies';

  /** Treatment of local sibling dependencies, default "auto" */
  localDependencies?: 'auto' | 'force' | 'explicit';

  /** Whether or not to reject dependency cycles */
  rejectCycles?: boolean;
}

export interface TopologicalConfig extends QueryGraphConfig {
  concurrency?: number;
}

export interface GitClientRelease {
  owner: string;
  repo: string;
  tag_name: string;
  name: string;
  body: string;
  draft?: boolean;
  prerelease?: boolean;
}

export type GitCreateReleaseFn = () => Promise<{
  ok: boolean;
  status: string;
  statusText: string;
}>;

export interface GitClient {
  createRelease: (opts: GitClientRelease) => Promise<void>;
}

export type NpaResolveResult = (
  | npa.FileResult
  | npa.HostedGitResult
  | npa.URLResult
  | npa.AliasResult
  | npa.RegistryResult
) & {
  explicitWorkspace?: boolean;
  workspaceTarget?: string;
};

/** Passed between concurrent executions */
export interface OneTimePasswordCache {
  /* The one-time password, passed as an option or received via prompt */
  otp?: string | number;
}

export interface LernaConfig {
  command?: {
    init?: InitCommandOption;
    publish?: PublishCommandOption;
    version?: VersionCommandOption;
    run?: RunCommandOption;
  };
  packages?: string[];
  loglevel?: 'silent' | 'error' | 'warn' | 'notice' | 'http' | 'timing' | 'info' | 'verbose' | 'silly';

  /** executable used to install dependencies (npm, yarn, pnpm, ...) */
  npmClient?: 'npm' | 'pnpm' | 'yarn';

  /** enables integration with Yarn or other package manager that use `workspaces` property in `package.json` */
  useWorkspaces?: boolean;
  version: string;
}

export interface ProjectConfig extends LernaConfig, QueryGraphConfig {
  /** Lerna JSON Schema https://json-schema.org/ */
  $schema: string;

  /** enabled when running in CI (Continuous Integration). */
  ci?: boolean;

  /** how many threads to use when Lerna parallelizes the tasks (defaults to count of logical CPU cores) */
  concurrency: number | string;

  /** current working directory */
  cwd: string;

  /** Composed commands are called from other commands, like publish -> version */
  composed?: boolean;

  /** Lerna CLI version */
  lernaVersion: string;

  /** show progress bars. */
  progress?: boolean;

  /** Only include packages that have been changed since the specified [ref]. */
  since?: string;

  /** When true, Lerna will sort the packages topologically (dependencies before dependents). */
  sort?: boolean;

  /** During `lerna exec` and `lerna run`, stream output with lines prefixed by originating package name. */
  stream?: boolean;

  /** Enables integration with [Nx](https://nx.dev). */
  useNx?: boolean;

  /** When useNx is true, show verbose output from dependent tasks. */
  verbose?: boolean;

  /** callback to execute when Promise rejected */
  onRejected?: (result: any) => void;

  /** callback to execute when Promise resolved */
  onResolved?: (result: any) => void;
}

/** The subset of package.json properties that Lerna-Lite uses */
export interface RawManifest extends Package {
  publishConfig?: Record<'directory' | 'registry' | 'tag', string>;
}

export interface ReleaseClient {
  repos: {
    createRelease: GitCreateReleaseFn;
  };
}

export interface ReleaseCommandProps {
  tags: string[];
  releaseNotes: ReleaseNote[];
}

export interface ReleaseOptions {
  gitRemote: string;
  execOpts: ExecOpts;
}

export interface ReleaseNote {
  name: string;
  notes?: string;
}

export type RemoteClientType = 'gitlab' | 'github';

export type RemoteCommit = {
  /** git commit author name */
  authorName: string;

  /** remote client login (ie github login) */
  login: string;

  /** commit message headling (50 chars maxlen) */
  message: string;

  /** short commit hash (7 chars long) */
  shortHash: string;
};

export interface UpdateCollectorOptions {
  /** The semver bump keyword (patch/minor/major) or explicit version used */
  bump?: string;
  /** Whether or not to use a "nightly" range (`ref^..ref`) for commits */
  canary?: boolean;

  /** A list of globs that match files/directories whose changes should not be considered when identifying changed packages */
  ignoreChanges?: string[];

  /** Whether or not to include the --first-parent flag when calling `git describe` (awkwardly, pass `true` to _omit_ the flag, the default is to include it) */
  includeMergedTags?: boolean;

  /** Which packages, if any, to always include. Force all packages to be versioned with `true`, or pass a list of globs that match package names */
  forcePublish?: boolean | string | string[];

  /** Ref to use when querying git, defaults to most recent annotated tag */
  since?: string;

  /** are we using Lerna independent mode? */
  isIndependent?: boolean;

  /** are we using conventional commits? */
  conventionalCommits?: boolean;
  conventionalGraduate?: boolean | string;
  excludeDependents?: boolean;
}
