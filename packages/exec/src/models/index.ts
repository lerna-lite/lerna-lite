import { Package } from '@lerna-lite/core';

export interface ExecScriptOption {
  args?: any;
  cwd: string;
  pkg: Package;
  shell: boolean;
  extendEnv: boolean;
  env: any;
  reject: boolean;
}
export interface ExecStreamingOption extends ExecScriptOption {
  prefix?: boolean;
}
