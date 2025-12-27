import type { Package } from '@lerna-lite/core';

export interface ExecScriptOption {
  args?: string[];
  cwd: string;
  pkg: Package;
  shell: boolean;
  extendEnv: boolean;
  env: { [key: string]: string | undefined };
  reject: boolean;
}
export interface ExecStreamingOption extends ExecScriptOption {
  prefix?: boolean;
}