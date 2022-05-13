import log from 'npmlog';
import npa from 'npm-package-arg';

import { Package } from '../package';

export type VersioningStrategy = 'fixed' | 'independent';
export type ChangelogType = 'fixed' | 'independent' | 'root';
export type ChangelogPresetConfig = string | { name: string;[key: string]: unknown };

export interface BaseChangelogOptions {
  changelogPreset?: ChangelogPresetConfig;
  rootPath?: string;
  tagPrefix?: string;
}

export interface CommandOptions {
  rollPublish?: boolean;
  rollVersion?: boolean;
}

export type CommandType = '' | 'exec' | 'info' | 'init' | 'publish' | 'version' | 'run';

export interface DescribeRefOptions {
  /* Defaults to `process.cwd()` */
  cwd?: string;

  /* Glob passed to `--match` flag */
  match?: string;
}

/* When annotated release tags are missing */
export interface DescribeRefFallbackResult {
  isDirty: boolean;
  refCount: string;
  sha: string;
}

/* When annotated release tags are present */
export interface DescribeRefDetailedResult {
  lastTagName: string;
  lastVersion: string;
  isDirty: boolean;
  refCount: string;
  sha: string;
}

/** Provided to any execa-based call */
export interface ExecOpts {
  cwd: string;
  maxBuffer?: number;
}

export interface LifecycleConfig {
  log?: typeof log;
  ignorePrepublish?: boolean;
  ignoreScripts?: boolean;
  nodeOptions?: string;
  scriptShell?: string;
  scriptsPrependNodePath?: boolean;
  snapshot?: any;
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
  rootPath?: string;
  tagPrefix?: string;
  version?: string;
}

export interface FetchConfig {
  fetchRetries: number;
  log: typeof log;
  registry: string;
  username: string;
}

export interface PackConfig {
  log: typeof log;

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
  graphType?: 'allDependencies' | 'dependencies';

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

export type NpaResolveResult = (npa.FileResult | npa.HostedGitResult | npa.URLResult | npa.AliasResult | npa.RegistryResult) & {
  explicitWorkspace?: boolean;
  workspaceTarget?: string;
}

/** Passed between concurrent executions */
export interface OneTimePasswordCache {
  /* The one-time password, passed as an option or received via prompt */
  otp?: string;
}

export interface ProjectConfig {
  command?: string;
  packages: string[];
  useWorkspaces: boolean;
  version: string;
}

/** The subset of package.json properties that Lerna-Lite uses */
export interface RawManifest {
  name: string;
  location: string;
  version: string;
  private?: boolean;
  bin?: Record<string, string> | string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  publishConfig?: Record<'directory' | 'registry' | 'tag', string>;
  workspaces?: string[] | { packages: string[] };
  get: (str: string) => { packages?: string[] } | string[];
}

export interface ReleaseClient {
  repos: {
    createRelease: GitCreateReleaseFn;
  }
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
  forcePublish?: boolean | string[];

  /** Ref to use when querying git, defaults to most recent annotated tag */
  since?: string;

  conventionalCommits?: boolean;
  conventionalGraduate?: boolean;
  excludeDependents?: boolean;
}
