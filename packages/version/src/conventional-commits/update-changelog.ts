import { type GetCommitsParams, type GetSemverTagsParams, packagePrefix } from '@conventional-changelog/git-client';
import type { ChangelogPresetOptions, Package } from '@lerna-lite/core';
import { EOL } from '@lerna-lite/core';
import { log } from '@lerna-lite/npmlog';
import { ConventionalChangelog, type Options as ChangelogCoreOptions } from 'conventional-changelog';
import type { Context, Options as WriterOptions } from 'conventional-changelog-writer';
import { writeFile } from 'fs/promises';
import getStream from 'get-stream';

import type { ChangelogConfig, ChangelogType, UpdateChangelogOption } from '../interfaces.js';
import { BLANK_LINE, CHANGELOG_HEADER } from './constants.js';
import { GetChangelogConfig } from './get-changelog-config.js';
import { makeBumpOnlyFilter } from './make-bump-only-filter.js';
import { readExistingChangelog } from './read-existing-changelog.js';
import { setConfigChangelogCommitClientLogin, setConfigChangelogCommitGitAuthor } from './writer-opts-transform.js';

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
    commitsSinceLastRelease,
    rootPath,
    tagPrefix = 'v',
    version,
  } = updateOptions;

  const config = await GetChangelogConfig.getChangelogConfig(changelogPreset, rootPath);
  const genOptions = {} as ChangelogCoreOptions;
  const tagOptions = {} as GetSemverTagsParams;
  const context = {} as Context; // pass as positional because cc-core's merge-config is wack
  const writerOpts = {} as WriterOptions;
  let changelogConfig = {} as ChangelogConfig;

  // cc-core mutates input :P
  // "new" preset API
  changelogConfig = Object.assign({}, config) as ChangelogConfig;

  // NOTE: must pass as positional argument due to weird bug in merge-config
  const gitRawCommitsOpts: GetCommitsParams = {};

  // are we including commit author name/email or remote client login name
  if (changelogIncludeCommitsGitAuthor || changelogIncludeCommitsGitAuthor === '') {
    setConfigChangelogCommitGitAuthor(config, gitRawCommitsOpts, writerOpts, changelogIncludeCommitsGitAuthor);
  } else if ((changelogIncludeCommitsClientLogin || changelogIncludeCommitsClientLogin === '') && commitsSinceLastRelease) {
    // prettier-ignore
    setConfigChangelogCommitClientLogin(config, gitRawCommitsOpts, writerOpts, commitsSinceLastRelease, changelogIncludeCommitsClientLogin);
  }

  let pkgPath = '';
  if (type === 'root') {
    context.version = version;

    // preserve tagPrefix because cc-core can't find the currentTag otherwise
    // root changelogs are only enabled in fixed mode, and need the proper tag prefix
    tagOptions.prefix = tagPrefix;
  } else {
    // "fixed" or "independent"
    gitRawCommitsOpts.path = pkg.location;
    pkgPath = pkg.manifestLocation;

    if (type === 'independent') {
      tagOptions.prefix = packagePrefix(pkg.name);
    } else {
      // only fixed mode can have a custom tag prefix
      tagOptions.prefix = tagPrefix;

      // preserve tagPrefix because cc-core can't find the currentTag otherwise
      context.version = pkg.version;
    }
  }

  // generate the markdown for the upcoming release.
  const changelogStream = new ConventionalChangelog()
    .readPackage(pkgPath)
    .config(changelogConfig)
    .commits(gitRawCommitsOpts)
    .context(context)
    .options(genOptions)
    .tags(tagOptions)
    .writer(writerOpts)
    .write();

  return Promise.all([
    // prettier-ignore
    getStream(changelogStream).then(makeBumpOnlyFilter(pkg)),
    readExistingChangelog(pkg),
  ]).then(([inputEntry, [changelogFileLoc, changelogContents]]) => {
    const newEntry = inputEntry;

    log.silly(type, 'writing new entry: %j', newEntry);

    const changelogHeader =
      (changelogPreset as ChangelogPresetOptions)?.header ??
      CHANGELOG_HEADER.replace(/%s/g, changelogHeaderMessage?.length > 0 ? changelogHeaderMessage + EOL : '');

    const content = [changelogHeader, newEntry, changelogContents]
      .join(BLANK_LINE)
      .trim()
      .replace(/[\r\n]{2,}/gm, '\n\n'); // conventional-changelog adds way too many extra line breaks, let's remove a few of them

    return writeFile(changelogFileLoc, content + EOL).then(() => {
      log.verbose(type, 'wrote', changelogFileLoc);

      return {
        logPath: changelogFileLoc,
        content,
        newEntry,
      };
    });
  });
}
