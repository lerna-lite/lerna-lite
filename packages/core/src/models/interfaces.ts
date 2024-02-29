import log from 'npmlog';
import npa from 'npm-package-arg';

import { Package } from '../package.js';
import { InitCommandOption, PublishCommandOption, RunCommandOption, VersionCommandOption } from './command-options.js';

/* eslint-disable no-use-before-define */
export type JsonObject = { [Key in string]: JsonValue } & { [Key in string]?: JsonValue | undefined };
export type JsonArray = JsonValue[];
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
/* eslint-enable no-use-before-define */

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

  /** Separator used within independent version tags, defaults to @ */
  separator?: string;
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

export interface FetchConfig {
  [key: string]: unknown;
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
  graphType?: 'all' | 'allDependencies' | 'allPlusPeerDependencies' | 'dependencies';

  /** Treatment of local sibling dependencies, default "auto" */
  localDependencies?: 'auto' | 'force' | 'explicit';

  /** Whether or not to reject dependency cycles */
  rejectCycles?: boolean;
  premajorVersionBump?: 'default' | 'force-patch';
}

export interface TopologicalConfig extends QueryGraphConfig {
  concurrency?: number;
}

export type NpaResolveResult = (npa.FileResult | npa.HostedGitResult | npa.URLResult | npa.AliasResult | npa.RegistryResult) & {
  /** the specifier part used when deailing with a `workspace:` protocol resource */
  workspaceSpec?: string;
};

export interface LernaConfig {
  command?: {
    init?: InitCommandOption;
    publish?: PublishCommandOption;
    version?: VersionCommandOption;
    run?: RunCommandOption;
  };
  /** custom tag pattern, default is `*@*` (independent mode) or `""` (non-independent mode) */
  describeTag?: string;

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
  composed?: boolean | string;

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

  /** When useNx is true, show verbose output from dependent tasks. */
  verbose?: boolean;

  /** callback to execute when Promise rejected */
  onRejected?: (result: any) => void;

  /** callback to execute when Promise resolved */
  onResolved?: (result: any) => void;

  /** custom tag pattern, default is `*@*` (independent mode) or `""` (non-independent mode) */
  describeTag?: string;
}

/** The subset of package.json properties that Lerna-Lite uses */
export interface RawManifest extends Package {
  publishConfig?: Record<'directory' | 'registry' | 'tag', string>;
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
  forcePublish?: boolean | string | string[];

  /** Ref to use when querying git, defaults to most recent annotated tag */
  since?: string;

  /** are we using Lerna independent mode? */
  isIndependent?: boolean;
  /** custom describe tag */
  describeTag?: string;

  /** are we using conventional commits? */
  conventionalCommits?: boolean;
  conventionalGraduate?: boolean | string;

  /** Forces all packages specified by --conventional-graduate to bump their version whether or not they are a prerelease or have changes since the previous version. */
  forceConventionalGraduate?: boolean;

  excludeDependents?: boolean;

  // Separator used within independent version tags, defaults to @
  tagVersionSeparator?: string;

  /** optionally exclude sub-packages when versioning */
  independentSubpackages?: boolean;
}

export type RemoteClientType = 'gitlab' | 'github';
