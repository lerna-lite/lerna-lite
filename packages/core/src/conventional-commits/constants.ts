export const EOL = '\n';
export const BLANK_LINE = EOL + EOL;
export const COMMIT_GUIDELINE =
  'See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.';
export const CHANGELOG_HEADER = [
  '# Change Log',
  '%s',
  'All notable changes to this project will be documented in this file.',
  COMMIT_GUIDELINE,
].join(EOL);
