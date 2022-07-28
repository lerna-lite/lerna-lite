import conventionalChangelogCore from 'conventional-changelog-core';
import fs from 'fs-extra';
import getStream from 'get-stream';
import log from 'npmlog';

import { BLANK_LINE, CHANGELOG_HEADER, EOL } from './constants';
import { GetChangelogConfig } from './get-changelog-config';
import { makeBumpOnlyFilter } from './make-bump-only-filter';
import { readExistingChangelog } from './read-existing-changelog';
import { ChangelogType, RemoteCommit, UpdateChangelogOption } from '../models';
import { Package } from '../package';

/**
 * Update changelog with the commits of the new release
 * @param {Package} pkg
 * @param {ChangelogType} type
 * @param {UpdateChangelogOption} commandOptions
 */
export async function updateChangelog(pkg: Package, type: ChangelogType, updateOptions: UpdateChangelogOption) {
  log.silly(type, 'for %s at %s', pkg.name, pkg.location);

  const {
    changelogPreset,
    changelogIncludeCommitsGitAuthor,
    changelogIncludeCommitsClientLogin,
    changelogHeaderMessage = '',
    changelogVersionMessage = '',
    commitsSinceLastRelease,
    rootPath,
    tagPrefix = 'v',
    version,
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
  // **deps:** update all non-major dependencies ([ed1db35](https://github.com/.../ed1db35)) (@Renovate-Bot)
  if (changelogIncludeCommitsGitAuthor) {
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
    let newEntry = inputEntry;

    // include commit author name or commit client login name
    if (changelogIncludeCommitsGitAuthor) {
      newEntry = parseChangelogCommitAuthorFullName(inputEntry, changelogIncludeCommitsGitAuthor);
    } else if (changelogIncludeCommitsClientLogin && commitsSinceLastRelease) {
      newEntry = parseChangelogCommitClientLogin(
        inputEntry,
        commitsSinceLastRelease,
        changelogIncludeCommitsClientLogin
      );
    }

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
 *   "deps: update all non-major dependencies ([ed1db35](https://github.com/.../ed1db35>>author=Whitesource Renovate<<))"
 * then extract the commit author's name and transform it into a new string that will look like below
 *   "deps: update all non-major dependencies ([ed1db35](https://github.com/.../ed1db35)) (Whitesource Whitesource)"
 * @param {String} changelogEntry - changelog entry of a version being released which can contain multiple line entries
 * @param {String | Boolean} [commitCustomFormat]
 * @returns
 */
function parseChangelogCommitAuthorFullName(changelogEntry: string, commitCustomFormat?: string | boolean) {
  // to transform the string into what we want, we need to move the substring outside of the url and remove extra search tokens
  // from this:
  //   "...ed1db35>>author=Whitesource Renovate<<))"
  // into this:
  //   "...ed1db35)) (Whitesource Renovate)"
  // or as a custom message like this " by **%a**" into this:
  //   "...ed1db35)) by **Whitesource Renovate**"
  return changelogEntry.replace(
    /(.*)(>>author=)(.*)(<<)(.*)/g,
    (_: string, lineStart: string, _tokenStart?: string, authorName?: string, _tokenEnd?: string, lineEnd?: string) => {
      // rebuild the commit line entry string
      const commitMsg = `${lineStart}${lineEnd || ''}`;
      const authorMsg =
        typeof commitCustomFormat === 'string'
          ? commitCustomFormat.replace(/%a/g, authorName || '')
          : ` (${authorName})`;
      return commitMsg + authorMsg;
    }
  );
}

/**
 * For each commit line entry, we will append the remote client login username for the first commit entry found, for example:
 * "commit message ([ed1db35](https://github.com/.../ed1db35)) (@renovate-bot)"
 * @param {String} changelogEntry - changelog entry of a version being released which can contain multiple line entries
 * @param {Array<RemoteCommit>} commitsSinceLastRelease
 * @param {String | Boolean} [commitCustomFormat]
 * @returns
 */
function parseChangelogCommitClientLogin(
  changelogEntry: string,
  commitsSinceLastRelease: RemoteCommit[],
  commitCustomFormat?: string | boolean
) {
  const entriesOutput: string[] = [];

  for (const lineEntry of changelogEntry.split('\n')) {
    let lineEntryOutput = lineEntry;
    const [_, __, shortSha] = lineEntry.match(/(\[([0-9a-f]{7})\])/) || []; // pull first commit match only

    if (shortSha) {
      const remoteCommit = commitsSinceLastRelease.find((c) => c.shortHash === shortSha);
      if (remoteCommit) {
        const clientLogin =
          typeof commitCustomFormat === 'string'
            ? commitCustomFormat.replace(/%l/g, remoteCommit.login || '').replace(/%a/g, remoteCommit.authorName || '')
            : ` (@${remoteCommit.login})`;

        // when we have a match, we need to remove any line breaks at the line ending only,
        // then add our user info and finally add back a single line break
        lineEntryOutput = lineEntry.replace(/\n*$/, '') + clientLogin;
      }
    }
    entriesOutput.push(lineEntryOutput);
  }

  return entriesOutput.join('\n');
}
