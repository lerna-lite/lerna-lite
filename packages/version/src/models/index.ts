export interface GitCommitOption {
  amend: boolean;
  commitHooks: boolean;
  signGitCommit: boolean;
  signoffGitCommit: boolean;
}

export interface GitTagOption {
  forceGitTag?: boolean;
  signGitTag?: boolean;
}
