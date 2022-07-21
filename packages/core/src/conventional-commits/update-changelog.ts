import conventionalChangelogCore from 'conventional-changelog-core';
import fs from 'fs-extra';
import getStream from 'get-stream';
import log from 'npmlog';

import { BLANK_LINE, CHANGELOG_HEADER, EOL } from './constants';
import { GetChangelogConfig } from './get-changelog-config';
import { makeBumpOnlyFilter } from './make-bump-only-filter';
import { readExistingChangelog } from './read-existing-changelog';
import { UpdateChangelogOption } from '../models';
import { Package } from '../package';

/**
 * @param {import("@lerna/package").Package} pkg
 * @param {import("..").ChangelogType} type
 * @param {import("..").BaseChangelogOptions & { version?: string }} commandOptions
 */
export async function updateChangelog(
  pkg: Package,
  type: 'root' | 'independent' | 'fixed',
  updateOptions: UpdateChangelogOption
) {
  log.silly(type, 'for %s at %s', pkg.name, pkg.location);

  const {
    changelogPreset,
    rootPath,
    tagPrefix = 'v',
    version,
    changelogIncludeCommitAuthorFullname,
    changelogHeaderMessage = '',
    changelogVersionMessage = '',
  } = updateOptions;

  const config = await GetChangelogConfig.getChangelogConfig(changelogPreset, rootPath);
  const options: any = {};
  const context: any = {}; // pass as positional because cc-core's merge-config is wack

  // cc-core mutates input :P
  if (config.conventionalChangelog) {
    // "new" preset API
    options.config = Object.assign({}, config.conventionalChangelog);
  } else {
    // "old" preset API
    options.config = Object.assign({}, config);
  }

  // NOTE: must pass as positional argument due to weird bug in merge-config
  const gitRawCommitsOpts = Object.assign({}, options.config.gitRawCommitsOpts);

  // when including commit author's name, we need to change the conventional commit format
  // available formats can be found at Git's url: https://git-scm.com/docs/git-log#_pretty_formats
  // we will later extract a defined token from the string, of ">>author=%an<<",
  // and reformat the string to get a commit string that would add (@authorName) to the end of the commit string, ie:
  // **deps:** update all non-major dependencies ([ed1db35](https://github.com/ghiscoding/lerna-lite/commit/ed1db35)) (@Renovate-Bot)
  if (changelogIncludeCommitAuthorFullname) {
    gitRawCommitsOpts.format = '%B%n-hash-%n%H>>author=%an<<';
  }

  if (type === 'root') {
    context.version = version;

    // preserve tagPrefix because cc-core can't find the currentTag otherwise
    context.currentTag = `${tagPrefix}${version}`;

    // root changelogs are only enabled in fixed mode, and need the proper tag prefix
    options.tagPrefix = tagPrefix;
  } else {
    // "fixed" or "independent"
    gitRawCommitsOpts.path = pkg.location;
    options.pkg = { path: pkg.manifestLocation };

    if (type === 'independent') {
      options.lernaPackage = pkg.name;
    } else {
      // only fixed mode can have a custom tag prefix
      options.tagPrefix = tagPrefix;

      // preserve tagPrefix because cc-core can't find the currentTag otherwise
      context.currentTag = `${tagPrefix}${pkg.version}`;
      context.version = pkg.version; // TODO investigate why Lerna doesn't have this line
    }
  }

  // generate the markdown for the upcoming release.
  const changelogStream = conventionalChangelogCore(options, context, gitRawCommitsOpts);

  return Promise.all([
    // prettier-ignore
    getStream(changelogStream).then(makeBumpOnlyFilter(pkg)),
    readExistingChangelog(pkg),
  ]).then(([inputEntry, [changelogFileLoc, changelogContents]]) => {
    // are we including commit author's name in changelog?
    const newEntry = changelogIncludeCommitAuthorFullname
      ? parseChangelogCommitAuthorFullName(inputEntry, changelogIncludeCommitAuthorFullname)
      : inputEntry;

    log.silly(type, 'writing new entry: %j', newEntry);

    const changelogVersion = type === 'root' ? changelogVersionMessage : '';
    const changelogHeader = CHANGELOG_HEADER.replace(
      /%s/g,
      type === 'root' ? (changelogHeaderMessage?.length > 0 ? changelogHeaderMessage + EOL : '') : ''
    );

    const content = [changelogHeader, changelogVersion, newEntry, changelogContents]
      .join(BLANK_LINE)
      .trim()
      .replace(/[\r\n]{2,}/gm, '\n\n');

    return fs.writeFile(changelogFileLoc, content + EOL).then(() => {
      log.verbose(type, 'wrote', changelogFileLoc);

      return {
        logPath: changelogFileLoc,
        newEntry,
      };
    });
  });
}

/**
 * From an input entry string that most often, not always, include commit author's name within defined tokens ">>author=AUTHOR_NAME<<"
 * We will want to extract the author's name from the commit url and recreate the commit url string and add its author to the end of the string.
 * You might be wondering, WHY is the commit author part of the commit url?
 * Mainly because it seems that adding a `format` to the `conventional-changelog-core` of `gitRawCommitsOpts`
 * will always include it as part of the final commit url because of this line where it parses the template and always seems to include whatever we add into the commit url
 * https://github.com/conventional-changelog/conventional-changelog/blob/master/packages/git-raw-commits/index.js#L27
 *
 * We will transform a string that looks like this:
 *   "deps: update all non-major dependencies ([ed1db35](https://github.com/ghiscoding/lerna-lite/commit/ed1db35>>author=Renovate Bot<<))"
 * then extract the commit author's name and transform it into a new string that will look like below
 *   "deps: update all non-major dependencies ([ed1db35](https://github.com/ghiscoding/lerna-lite/commit/ed1db35)) (@Renovate-Bot)"
 * @param changelogEntry - changelog entry of a version being released which can contain multiple line entries
 * @returns
 */
function parseChangelogCommitAuthorFullName(changelogEntry: string, commitAuthorFullnameMessage?: string | boolean) {
  // to transform the string into what we want, we need to move the substring outside of the url and remove extra search tokens
  // from this:
  //   "...ed1db35>>author=Renovate Bot<<))"
  // into this:
  //   "...ed1db35)) (Renovate-Bot)"
  // or as a custom message like this " by **%a**" into this:
  //   "...ed1db35)) by **Renovate-Bot**"
  return changelogEntry.replace(
    /(.*)(>>author=)(.*)(<<)(.*)/g,
    (_: string, lineStart: string, _tokenStart?: string, authorName?: string, _tokenEnd?: string, lineEnd?: string) => {
      // rebuild the commit string, we'll also replace any whitespaces to hypen in author's name to make it a valid "@" user ref
      const commitMsg = `${lineStart}${lineEnd || ''}`;
      const authorMsg =
        typeof commitAuthorFullnameMessage === 'string'
          ? commitAuthorFullnameMessage.replace(/%a/g, authorName || '')
          : ` (${authorName})`;
      return commitMsg + authorMsg;
    }
  );
}
