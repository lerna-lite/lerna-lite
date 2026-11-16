import { describe, expect, it, vi } from 'vitest';

// Render the help output of a command exactly the way `lerna <command> --help` does.
// Each test imports the command modules freshly because their builders mutate
// module-level state (`addBumpPositional`) that a single CLI process never reuses.
async function renderCommandHelp(command: 'version' | 'publish'): Promise<string> {
  vi.resetModules();

  const { default: versionCmd } = await import('../cli-commands/cli-version-commands.js');
  const { default: publishCmd } = await import('../cli-commands/cli-publish-commands.js');
  const { default: cli } = await import('../lerna-cli.js');
  const { globalOptions } = await import('../global-options.js');

  return new Promise((resolve, reject) => {
    const yargs = globalOptions(cli())
      .command(versionCmd as any)
      .command(publishCmd as any);

    void yargs.parse(`${command} --help`, (err: Error | undefined, _argv: unknown, output: string) => {
      if (err) {
        reject(err);
      } else {
        resolve(output ?? '');
      }
    });
  });
}

describe('cli-version-commands', () => {
  describe('builder', () => {
    it('should show version options (including --no-private) in `lerna version --help`', async () => {
      const help = await renderCommandHelp('version');

      // yargs >=17 passes a boolean (not undefined) as the second builder argument,
      // which used to be mistaken for the "composed" marker and hid every option.
      expect(help).toContain('Command Options:');
      expect(help).toContain('--no-private');
      expect(help).toContain('--allow-branch');
      expect(help).toContain('--amend');
    });

    it('should still hide version-only options when composed by `lerna publish`', async () => {
      const help = await renderCommandHelp('publish');

      // the composed builder is expected to keep version-only options hidden
      expect(help).not.toContain('--allow-branch');
      expect(help).not.toContain('--amend');
    });
  });
});
