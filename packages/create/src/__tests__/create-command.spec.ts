import { afterEach, describe, expect, it, vi } from 'vitest';
import { readJson, writeJson } from 'fs-extra/esm';
import { execa } from 'execa';
import slash from 'slash';
import { fileURLToPath } from 'node:url';
import { dirname, normalize, join as pathJoin } from 'node:path';
import yargParser from 'yargs-parser';
// import _pacote from 'pacote';

vi.mock('pacote');

vi.mock('@lerna-lite/core', async () => ({
  ...(await vi.importActual<any>('@lerna-lite/core')),
  Command: (await vi.importActual<any>('../../../core/src/command')).Command,
  conf: (await vi.importActual<any>('../../../core/src/command')).conf,
  logOutput: (await vi.importActual<any>('../../../core/src/__mocks__/output')).logOutput,
  collectUpdates: (await vi.importActual<any>('../../../core/src/__mocks__/collect-updates')).collectUpdates,
  spawn: vi.fn(),
}));

// also point to the local version command so that all mocks are properly used even by the command-runner
vi.mock('@lerna-lite/create', async () => await vi.importActual('../create-command'));

// mocked modules
// const pacote = vi.mocked(_pacote);
import pacote from 'pacote';

// helpers
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { commandRunner, initFixtureFactory } from '@lerna-test/helpers';
import { CreateCommand } from '../index';
import cliCreateCommand from '../../../cli/src/cli-commands/cli-create-command';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const lernaCreate = commandRunner(cliCreateCommand);
const initFixture = initFixtureFactory(__dirname);

const createArgv = (cwd: string, ...args: string[]) => {
  args.unshift('create');
  const parserArgs = args.map(String);
  const argv = yargParser(parserArgs, { array: [{ key: 'ignoreChanges' }] });
  argv['$0'] = cwd;
  argv['loglevel'] = 'silent';
  return argv as unknown as CreateCommandOption;
};

// stabilize commit SHA
import gitSHA from '@lerna-test/helpers/serializers/serialize-git-sha.js';
expect.addSnapshotSerializer(gitSHA);

// assertion helpers
const addRemote = (cwd, remote = 'origin', url = 'git@github.com:test/test.git') => execa('git', ['remote', 'add', remote, url], { cwd });
const diffStaged = (cwd, ...args) => execa('git', ['diff', '--cached', ...args], { cwd }).then((result) => result.stdout);
const initRemoteFixture = (fixtureName) => initFixture(fixtureName).then((cwd) => addRemote(cwd).then(() => cwd));
const gitLsOthers = (cwd, ...args) => execa('git', ['ls-files', '--others', '--exclude-standard', ...args], { cwd }).then((result) => result.stdout);
const listUntracked = async (cwd) => {
  const list = await gitLsOthers(cwd, '-z');
  return list.split.skip('\0').map((fp) => slash(fp));
};
const manifestCreated = async (cwd) => {
  const file = await gitLsOthers(cwd, '--', '**/package.json');
  return readJson(pathJoin(cwd, file));
};

describe('Create Command', () => {
  pacote.manifest.mockImplementation(() => {
    return Promise.resolve({ version: '1.0.0-mocked' });
  });

  // preserve value from @lerna-test/helpers/npm/set-npm-userconfig
  const userconfig = process.env.npm_config_userconfig;

  afterEach(() => {
    // some tests delete or mangle this
    if (process.env.npm_config_userconfig !== userconfig) {
      process.env.npm_config_userconfig = userconfig;
    }
  });

  it.skip('requires a name argument', async () => {
    const cwd = await initFixture('basic');
    const command = lernaCreate(cwd)();

    await expect(command).rejects.toThrow('Not enough non-option arguments: got 0, need at least 1');
  });

  it.skip('throws when adding a git dependency', async () => {
    const cwd = await initRemoteFixture('basic');
    const command = lernaCreate(cwd)('git-pkg', '--dependencies', 'git+ssh://git@notgithub.com/user/foo#semver:^1.2.3');

    await expect(command).rejects.toThrow('Do not use git dependencies');
  });

  it.skip('creates a stub package', async () => {
    const cwd = await initRemoteFixture('basic');

    // await new CreateCommand(createArgv(cwd, 'my-pkg'));
    await lernaCreate(cwd)('my-pkg');
    await gitAdd(cwd, '.');

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it('creates a stub package with a scoped name', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('@my-org/my-pkg');

    const result = await listUntracked(cwd);
    expect(result).toContain('packages/my-pkg/lib/my-pkg.js');
  });

  it.skip('creates a stub package with transpiled output', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('my-pkg', '--es-module');
    await gitAdd(cwd, '.');

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it.skip('creates a stub cli', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('my-cli', '--bin');
    await gitAdd(cwd, '.');

    if (process.platform === 'win32') {
      // windows sucks at file permissions
      await gitAdd(cwd, '--chmod', '+x', '--', normalize('packages/my-cli/bin/my-cli'));
    }

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();

    // yargs is automatically added when CLI is stubbed
    expect(pacote.manifest).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: 'yargs',
        type: 'tag',
        fetchSpec: 'latest',
      }),
      expect.objectContaining({
        // an npm-conf snapshot
        registry: 'https://registry.npmjs.org/',
      })
    );
  });

  it.skip('creates a stub cli with a custom name', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('my-cli', '--bin', 'yay');

    const result = await listUntracked(cwd);
    expect(result).toContain('packages/my-cli/bin/yay');
  });

  it.skip('creates a stub cli with transpiled output', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('my-es-cli', '--bin', '--es-module');
    await gitAdd(cwd, '.');

    if (process.platform === 'win32') {
      // windows sucks at file permissions
      await gitAdd(cwd, '--chmod', '+x', '--', normalize('packages/my-es-cli/bin/my-es-cli'));
    }

    const result = await diffStaged(cwd);
    expect(result).toMatchSnapshot();
  });

  it.skip('defaults user name and email to git config', async () => {
    const cwd = await initRemoteFixture('basic');
    const name = 'Git McGitterson';
    const email = 'test@git-fallback.com';

    // overwrite test defaults so it's really obvious
    await execa('git', ['config', 'user.name', name], { cwd });
    await execa('git', ['config', 'user.email', email], { cwd });

    // ignore test defaults as well as ~/.npmrc
    process.env.npm_config_userconfig = '/dev/null';

    await lernaCreate(cwd)('git-fallback');

    expect(await manifestCreated(cwd)).toHaveProperty('author', `${name} <${email}>`);
  });

  it.skip('overrides init-license with --license', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('license-override', '--license', 'MIT');

    expect(await manifestCreated(cwd)).toHaveProperty('license', 'MIT');
  });

  it.skip('sets private:true with --private', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('private-pkg', '--private');

    expect(await manifestCreated(cwd)).toHaveProperty('private', true);
  });

  it.skip('defaults to npm_config_init_version when independent', async () => {
    const cwd = await initRemoteFixture('independent');

    process.env.npm_config_init_version = '100.0.0';

    await lernaCreate(cwd)('indy-pkg');

    delete process.env.npm_config_init_version;

    expect(await manifestCreated(cwd)).toHaveProperty('version', '100.0.0');
  });

  it.skip('allows choice of package location', async () => {
    const cwd = await initRemoteFixture('custom-location');

    await lernaCreate(cwd)('custom-pkg', 'modules');

    const result = await listUntracked(cwd);
    expect(result).toContain('modules/custom-pkg/package.json');
  });

  it.skip('adds local dependencies', async () => {
    const cwd = await initRemoteFixture('independent');

    await lernaCreate(cwd)('foo-pkg', '--dependencies', 'sibling-pkg');

    expect(await manifestCreated(cwd)).toHaveProperty('dependencies', {
      'sibling-pkg': '^2.0.0',
    });
  });

  it.skip('adds local dependency as relative file specifier when others exist', async () => {
    const cwd = await initRemoteFixture('relative-file-spec');

    await lernaCreate(cwd)('foo-pkg', '--dependencies', 'sibling-pkg');

    expect(await manifestCreated(cwd)).toHaveProperty('dependencies', {
      'sibling-pkg': 'file:../sibling-pkg',
    });
  });

  it.skip('reuses existing external dependency version', async () => {
    const cwd = await initRemoteFixture('independent');

    await lernaCreate(cwd)('foo-pkg', '--dependencies', 'pify');

    expect(await manifestCreated(cwd)).toHaveProperty('dependencies', {
      pify: '^2.3.0',
    });
  });

  it.skip('supports external dependency version specifier', async () => {
    const cwd = await initRemoteFixture('independent');

    await lernaCreate(cwd)('foo-pkg', '--dependencies', 'bar@1.0.0', 'baz@^2.0.0', 'qux@~3.0.0');

    expect(await manifestCreated(cwd)).toHaveProperty('dependencies', {
      bar: '1.0.0',
      baz: '^2.0.0',
      qux: '~3.0.0',
    });
  });

  it.skip('respects npm_config_save_exact', async () => {
    const cwd = await initRemoteFixture('independent');

    process.env.npm_config_save_exact = 'true';

    await lernaCreate(cwd)('foo-pkg', '--dependencies', 'sibling-pkg');

    delete process.env.npm_config_save_exact;

    expect(await manifestCreated(cwd)).toHaveProperty('dependencies', {
      'sibling-pkg': '2.0.0',
    });
  });

  it.skip('defaults homepage to a subpath of root homepage when it exists', async () => {
    const cwd = await initRemoteFixture('independent');
    const rootManifest = pathJoin(cwd, 'package.json');
    const json = await readJson(rootManifest);

    json.homepage = 'https://github.com/test/test';
    await writeJson(rootManifest, json);

    await lernaCreate(cwd)('foo-pkg');

    expect(await manifestCreated(cwd)).toHaveProperty('homepage', 'https://github.com/test/test/tree/main/packages/foo-pkg#readme');
  });

  it.skip('appends to pathname of non-github root homepage', async () => {
    const cwd = await initRemoteFixture('independent');
    const rootManifest = pathJoin(cwd, 'package.json');
    const json = await readJson(rootManifest);

    json.homepage = 'https://bitbucket.com/test/test';
    await writeJson(rootManifest, json);

    await lernaCreate(cwd)('foo-pkg');

    expect(await manifestCreated(cwd)).toHaveProperty(
      'homepage',
      // no doubt wrong, but just illustrative of condition
      'https://bitbucket.com/test/test/packages/foo-pkg'
    );
  });

  it.skip('does not mutate explicit --homepage pathname', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('foo-pkg', '--homepage', 'http://google.com/');

    expect(await manifestCreated(cwd)).toHaveProperty('homepage', 'http://google.com/');
  });

  it.skip('defaults schemeless homepage to http://', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('foo-pkg', '--homepage', 'google.com');

    expect(await manifestCreated(cwd)).toHaveProperty('homepage', 'http://google.com/');
  });

  it.skip('overrides default publishConfig.access with --access=restricted', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('@foo/pkg', '--access', 'restricted');

    expect(await manifestCreated(cwd)).toHaveProperty('publishConfig', {
      access: 'restricted',
    });
  });

  it.skip('sets non-public publishConfig.registry with --registry', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('@foo/pkg', '--registry', 'http://my-private-registry.com/');

    expect(await manifestCreated(cwd)).toHaveProperty('publishConfig', {
      registry: 'http://my-private-registry.com/',
    });
  });

  it.skip('sets publishConfig.tag with --tag', async () => {
    const cwd = await initRemoteFixture('basic');

    await lernaCreate(cwd)('@foo/pkg', '--tag', 'next');

    expect(await manifestCreated(cwd)).toHaveProperty('publishConfig', {
      access: 'public',
      tag: 'next',
    });
  });

  it.skip('skips repository field when git remote is missing', async () => {
    const cwd = await initFixture('basic');

    await lernaCreate(cwd)('a-pkg');

    expect(await manifestCreated(cwd)).not.toHaveProperty('repository');
  });

  it.skip('adds type field when using esModule', async () => {
    const cwd = await initFixture('basic');

    await lernaCreate(cwd)('a-pkg', '--es-module');

    expect(await manifestCreated(cwd)).toHaveProperty('type', 'module');
  });

  it.skip('skips type field when not using esModule', async () => {
    const cwd = await initFixture('basic');

    await lernaCreate(cwd)('a-pkg');

    expect(await manifestCreated(cwd)).not.toHaveProperty('type');
  });
});
