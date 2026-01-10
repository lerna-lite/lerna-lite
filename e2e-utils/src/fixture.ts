import { exec } from 'node:child_process';
import { createWriteStream, type WriteStream } from 'node:fs';
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const REGISTRY = 'http://localhost:4873/';
const PNPM_STORE = 'pnpm.store';
const ORIGIN_GIT = 'origin.git';

type PackageManager = 'npm' | 'pnpm';

interface RunCommandOptions {
  silenceError?: boolean;
  env?: Record<string, string>;
  cwd?: string;
  silent?: boolean;
}

export interface FixtureCreateOptions {
  name: string;
  packageManager: PackageManager;
  lernaInit: boolean | { args?: string[] };
  initializeGit: boolean;
  installDependencies: boolean;
  e2eRoot: string;
  forceDeterministicTerminalOutput?: boolean;
}

export interface RunCommandResult {
  stdout: string;
  stderr: string;
  combinedOutput: string;
  exitCode?: number;
}

const noopWriteStream = {
  write(..._x: unknown[]) {
    return true;
  },
  end() {
    return this as unknown as WriteStream;
  },
} satisfies Partial<WriteStream> as WriteStream;

let fixtureCounter = 0;
function uniq(name: string): string {
  return `${name}-${Date.now()}-${fixtureCounter++}`;
}

/**
 * A initialized Fixture creates an entry within the e2e root for the given fixture name with the following structure:
 *
 * /{{ FIXTURE_NAME }}
 *   /origin.git (a bare git repo which acts as the git origin for the lerna workspace under test)
 *   /lerna-workspace (the lerna workspace under test, created using `lerna init`)
 *
 * This is heavily inspired by Lerna's e2e-utils but adapted for Vitest and lerna-lite
 */
export class Fixture {
  private readonly fixtureRootPath: string;
  private readonly fixtureWorkspacePath: string;
  private readonly fixtureOriginPath: string;
  private readonly fixturePnpmStorePath: string;
  debugWriteStream: WriteStream;

  constructor(
    private readonly e2eRoot: string,
    private readonly name: string,
    private readonly packageManager: PackageManager = 'npm',
    private readonly forceDeterministicTerminalOutput = false
  ) {
    this.fixtureRootPath = join(this.e2eRoot, this.name);
    this.fixtureWorkspacePath = join(this.fixtureRootPath, 'lerna-workspace');
    this.fixtureOriginPath = join(this.fixtureRootPath, ORIGIN_GIT);
    this.fixturePnpmStorePath = join(this.fixtureRootPath, PNPM_STORE);
    this.debugWriteStream =
      process.env.LERNA_E2E_DEBUG === 'true'
        ? createWriteStream(join(this.fixtureRootPath, 'debug.log'), { flags: 'a' })
        : noopWriteStream;
  }

  static async create({
    name,
    packageManager,
    lernaInit,
    initializeGit,
    installDependencies,
    e2eRoot,
    forceDeterministicTerminalOutput,
  }: FixtureCreateOptions): Promise<Fixture> {
    const fixture = new Fixture(
      e2eRoot,
      // Make the underlying name include the package manager and be globally unique
      uniq(`${name}-${packageManager}`),
      packageManager,
      forceDeterministicTerminalOutput || false
    );

    await fixture.createFixtureRoot();
    await fixture.createGitOrigin();

    if (initializeGit) {
      await fixture.gitCloneEmptyRemoteAsLernaWorkspace();
    } else {
      await fixture.createEmptyDirectoryForWorkspace();
    }

    await fixture.setNpmRegistry();

    if (lernaInit) {
      // Use custom lerna init args if provided
      await fixture.lernaInit(lernaInit === true ? '' : lernaInit.args?.join(' '));
    }

    await fixture.initializeNpmEnvironment();

    if (installDependencies) {
      await fixture.install();
    }

    return fixture;
  }

  static fromExisting(e2eRoot: string, fixtureRootPath: string, forceDeterministicTerminalOutput = false) {
    const fixtureName = fixtureRootPath.split(e2eRoot).pop();
    if (!fixtureName) {
      throw new Error(`Could not determine fixture name from path: ${fixtureRootPath}`);
    }
    const packageManager = Fixture.inferPackageManagerFromExistingFixture(fixtureRootPath);
    return new Fixture(e2eRoot, fixtureName, packageManager, forceDeterministicTerminalOutput);
  }

  private static inferPackageManagerFromExistingFixture(fixtureRootPath: string): PackageManager {
    // Check for pnpm-workspace.yaml
    try {
      const pnpmWorkspace = join(fixtureRootPath, 'lerna-workspace', 'pnpm-workspace.yaml');
      if (require('fs').existsSync(pnpmWorkspace)) {
        return 'pnpm';
      }
    } catch {
      // ignore
    }
    return 'npm';
  }

  async destroy(): Promise<void> {
    this.debugWriteStream.write(`\n> Fixture.destroy()\n`);
    this.debugWriteStream.end();
    await rm(this.fixtureRootPath, { recursive: true, force: true });
  }

  getWorkspacePath(path = ''): string {
    return join(this.fixtureWorkspacePath, path);
  }

  private async createFixtureRoot(): Promise<void> {
    this.debugWriteStream.write(`\n> Fixture.createFixtureRoot()\n`);
    await mkdir(this.fixtureRootPath, { recursive: true });
  }

  private async createGitOrigin(): Promise<void> {
    this.debugWriteStream.write(`\n> Fixture.createGitOrigin()\n`);
    await mkdir(this.fixtureOriginPath, { recursive: true });
    await this.exec('git init --bare', { cwd: this.fixtureOriginPath });
    await this.exec('git config uploadpack.allowReachableSHA1InWant true', { cwd: this.fixtureOriginPath });
  }

  private async gitCloneEmptyRemoteAsLernaWorkspace(): Promise<void> {
    this.debugWriteStream.write(`\n> Fixture.gitCloneEmptyRemoteAsLernaWorkspace()\n`);
    await this.exec(`git clone ${this.fixtureOriginPath} lerna-workspace`, {
      cwd: this.fixtureRootPath,
    });
    await this.exec('git config user.email "lerna-e2e@example.com"', { cwd: this.fixtureWorkspacePath });
    await this.exec('git config user.name "Lerna E2E"', { cwd: this.fixtureWorkspacePath });
    await this.exec('git config commit.gpgsign false', { cwd: this.fixtureWorkspacePath });
  }

  private async createEmptyDirectoryForWorkspace(): Promise<void> {
    this.debugWriteStream.write(`\n> Fixture.createEmptyDirectoryForWorkspace()\n`);
    await mkdir(this.fixtureWorkspacePath, { recursive: true });
  }

  private async setNpmRegistry(): Promise<void> {
    if (this.packageManager === 'pnpm') {
      await this.exec(`mkdir ${this.fixturePnpmStorePath}`);
      await this.exec(
        `echo "registry=${REGISTRY}\nstore-dir=${this.fixturePnpmStorePath}\nverify-store-integrity=false" > .npmrc`
      );
    }
  }

  private async initializeNpmEnvironment(): Promise<void> {
    if (this.packageManager !== 'npm' && (await this.fileExists(join(this.fixtureWorkspacePath, 'lerna.json')))) {
      await this.overrideLernaConfig({ npmClient: this.packageManager });
    }
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Resolve the locally published version of lerna and run the `init` command
   */
  async lernaInit(args?: string): Promise<RunCommandResult> {
    // For lerna-lite, we'll use the local CLI directly
    const lernaPath = join(process.cwd(), 'packages', 'cli', 'dist', 'cli.js');
    return this.exec(`node ${lernaPath} init ${args || ''}`);
  }

  async overrideLernaConfig(lernaConfig: Record<string, unknown>): Promise<void> {
    this.debugWriteStream.write(`\n> Fixture.overrideLernaConfig() -> ${JSON.stringify(lernaConfig)}\n`);
    await this.updateJson('lerna.json', (json) => ({
      ...json,
      ...lernaConfig,
    }));
  }

  /**
   * Execute the install command of the configured package manager
   */
  async install(args?: string): Promise<RunCommandResult> {
    switch (this.packageManager) {
      case 'npm':
        return this.exec(`npm --registry=${REGISTRY} install${args ? ` ${args}` : ''}`);
      case 'pnpm':
        return this.exec(`pnpm install${args ? ` ${args}` : ''}`);
      default:
        throw new Error(`Unsupported package manager: ${this.packageManager}`);
    }
  }

  /**
   * Execute a command using the locally built lerna CLI
   */
  async lerna(args: string, opts: { silenceError?: true; allowNetworkRequests?: true } = {}): Promise<RunCommandResult> {
    this.debugWriteStream.write(`\n> Fixture.lerna("${args}")\n`);
    const lernaPath = join(process.cwd(), 'packages', 'cli', 'dist', 'cli.js');
    return this.exec(`node ${lernaPath} ${args}`, opts);
  }

  /**
   * Execute a generic command within the fixture workspace
   */
  async exec(command: string, opts: RunCommandOptions = {}): Promise<RunCommandResult> {
    this.debugWriteStream.write(`\n> Fixture.exec("${command}")\n`);

    const cwd = opts.cwd || this.fixtureWorkspacePath;
    const env = {
      ...process.env,
      ...opts.env,
      // Disable npm update check for tests
      NO_UPDATE_NOTIFIER: '1',
      npm_config_update_notifier: 'false',
    };

    try {
      const result = await execAsync(command, {
        cwd,
        env,
        maxBuffer: 50 * 1024 * 1024, // 50MB
      });

      const combinedOutput = this.forceDeterministicTerminalOutput
        ? result.stdout + result.stderr
        : result.stdout + '\n' + result.stderr;

      if (!opts.silent) {
        this.debugWriteStream.write(`stdout: ${result.stdout}\n`);
        this.debugWriteStream.write(`stderr: ${result.stderr}\n`);
      }

      return {
        stdout: result.stdout,
        stderr: result.stderr,
        combinedOutput: combinedOutput.trim(),
        exitCode: 0,
      };
    } catch (error: any) {
      const stdout = error.stdout || '';
      const stderr = error.stderr || '';
      const combinedOutput = this.forceDeterministicTerminalOutput ? stdout + stderr : stdout + '\n' + stderr;

      this.debugWriteStream.write(`Error executing command: ${error.message}\n`);
      this.debugWriteStream.write(`stdout: ${stdout}\n`);
      this.debugWriteStream.write(`stderr: ${stderr}\n`);

      if (!opts.silenceError) {
        throw new Error(`Command failed: ${command}\nExit code: ${error.code || 'unknown'}\n${combinedOutput}`);
      }

      return {
        stdout,
        stderr,
        combinedOutput: combinedOutput.trim(),
        exitCode: error.code || 1,
      };
    }
  }

  async readWorkspaceFile(relativePath: string): Promise<string> {
    return readFile(join(this.fixtureWorkspacePath, relativePath), 'utf8');
  }

  async updateJson(relativePath: string, updateFn: (json: any) => any): Promise<void> {
    const filePath = join(this.fixtureWorkspacePath, relativePath);
    const content = await readFile(filePath, 'utf8');
    const json = JSON.parse(content);
    const updated = updateFn(json);
    await writeFile(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf8');
  }

  async createInitialGitCommit(): Promise<void> {
    await this.exec('git add .');
    await this.exec('git commit -m "initial commit"');
  }

  async addScriptsToPackage({ packagePath, scripts }: { packagePath: string; scripts: Record<string, string> }): Promise<void> {
    await this.updateJson(`${packagePath}/package.json`, (json) => ({
      ...json,
      scripts: {
        ...json.scripts,
        ...scripts,
      },
    }));
  }

  async updatePackageVersion({ packagePath, newVersion }: { packagePath: string; newVersion: string }): Promise<void> {
    await this.updateJson(`${packagePath}/package.json`, (json) => ({
      ...json,
      version: newVersion,
    }));
  }

  async addDependencyToPackage({
    packagePath,
    dependencyName,
    version,
  }: {
    packagePath: string;
    dependencyName: string;
    version: string;
  }): Promise<void> {
    await this.updateJson(`${packagePath}/package.json`, (json) => ({
      ...json,
      dependencies: {
        ...json.dependencies,
        [dependencyName]: version,
      },
    }));
  }

  async addPackagesDirectory(path: string): Promise<void> {
    await mkdir(join(this.fixtureWorkspacePath, path), { recursive: true });
    await this.updateJson('lerna.json', (json) => ({
      ...json,
      packages: [...(json.packages || []), `${path}/*`],
    }));
  }

  /**
   * Read output files written during test execution (similar to Lerna's approach)
   */
  async readOutput(fileName: string): Promise<string> {
    return readFile(join(this.fixtureWorkspacePath, 'node_modules/.lerna-test-outputs', `${fileName}.txt`), 'utf8');
  }

  /**
   * Create a basic package with package.json
   */
  async createPackage({
    name,
    version = '1.0.0',
    private: isPrivate,
    dependencies,
  }: {
    name: string;
    version?: string;
    private?: boolean;
    dependencies?: Record<string, string>;
  }): Promise<void> {
    const packagePath = join(this.fixtureWorkspacePath, 'packages', name);
    await mkdir(packagePath, { recursive: true });

    const packageJson: any = {
      name,
      version,
    };

    if (isPrivate) {
      packageJson.private = true;
    }

    if (dependencies) {
      packageJson.dependencies = dependencies;
    }

    await writeFile(join(packagePath, 'package.json'), JSON.stringify(packageJson, null, 2) + '\n', 'utf8');
  }

  /**
   * Execute lerna watch command and return a function to get results after a timeout
   * Since watch runs indefinitely, this spawns the process in the background
   * and returns a function that kills it and returns the captured output.
   */
  async lernaWatch(args: string): Promise<(timeoutMs?: number) => Promise<RunCommandResult>> {
    this.debugWriteStream.write(`\n> Fixture.lernaWatch("${args}")\n`);

    return new Promise((resolve, reject) => {
      const lernaPath = join(process.cwd(), 'packages', 'cli', 'dist', 'cli.js');

      let stdout = '';
      let stderr = '';
      let combinedOutput = '';
      let error: Error | null = null;
      let processKilled = false;

      const env = {
        ...process.env,
        NO_UPDATE_NOTIFIER: '1',
        npm_config_update_notifier: 'false',
      };

      const createResult = (): RunCommandResult => ({
        stdout: this.stripConsoleColors(stdout),
        stderr: this.stripConsoleColors(stderr),
        combinedOutput: this.stripConsoleColors(combinedOutput),
      });

      // Use spawn instead of exec to handle long-running process
      const { spawn } = require('node:child_process');
      const childProcess = spawn('node', [lernaPath, 'watch', ...args.split(' ')], {
        cwd: this.fixtureWorkspacePath,
        env,
        shell: process.platform === 'win32',
        detached: false,
      });

      childProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        combinedOutput += output;
        this.debugWriteStream.write(`[watch stdout] ${output}`);
      });

      childProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        combinedOutput += output;
        this.debugWriteStream.write(`[watch stderr] ${output}`);
      });

      childProcess.on('error', (err) => {
        error = err;
        this.debugWriteStream.write(`[watch error] ${err.message}\n`);
      });

      // Give the watch process a moment to start up
      setTimeout(() => {
        resolve(async (timeoutMs = 1000) => {
          return new Promise((resolveInner) => {
            setTimeout(() => {
              if (!processKilled) {
                processKilled = true;

                // Force kill on Windows due to shell spawning issues
                if (process.platform === 'win32') {
                  try {
                    // Use taskkill to forcefully terminate on Windows
                    const { execSync } = require('node:child_process');
                    execSync(`taskkill /pid ${childProcess.pid} /T /F`, { stdio: 'ignore' });
                  } catch (killError: any) {
                    // Process might already be dead
                    this.debugWriteStream.write(`[watch] Kill error (expected): ${killError.message}\n`);
                  }
                } else {
                  childProcess.kill('SIGTERM');
                }

                // Give it more time to flush output and clean up
                setTimeout(() => {
                  if (error) {
                    this.debugWriteStream.write(`[watch] Error occurred: ${error.message}\n`);
                  }
                  resolveInner(createResult());
                }, 500);
              }
            }, timeoutMs);
          });
        });
      }, 1000);

      childProcess.on('close', (code) => {
        this.debugWriteStream.write(`[watch] Process exited with code ${code}\n`);
        if (!processKilled && error) {
          reject(error);
        } else if (!processKilled && stderr.includes('lerna ERR!')) {
          reject(new Error(stderr));
        }
      });
    });
  }

  /**
   * Strip ANSI color codes from output for cleaner test comparisons
   */
  private stripConsoleColors(str: string): string {
    // eslint-disable-next-line no-control-regex
    return str.replace(/\x1B\[[0-9;]*m/g, '');
  }
}
