// reimplement new-github-release-url to avoid adding it as a dependency
// https://github.com/sindresorhus/new-github-release-url
export interface NewGithubReleaseOptions {
  repoUrl?: string;
  user: string;
  repo: string;
  tag: string;
  target?: string;
  title: string;
  body: string;
  isPrerelease: boolean | string | number;
}

export default function newGithubReleaseUrl(options: NewGithubReleaseOptions): string {
  const repoUrl = options.repoUrl ?? `https://github.com/${options.user}/${options.repo}`;
  const url = new URL(`${repoUrl.replace(/\/$/, '')}/releases/new`);
  const keys = ['tag', 'target', 'title', 'body', 'isPrerelease'] as const;

  for (const key of keys) {
    const val = (options as any)[key];
    if (val === undefined) {
      continue;
    }
    const param = key === 'isPrerelease' ? 'prerelease' : key;
    url.searchParams.set(param, String(val));
  }

  return url.toString();
}
