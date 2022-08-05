import conventionalChangelogCore, { Context } from 'conventional-changelog-core';
import { Options as WriterOptions } from 'conventional-changelog-writer';
import fs from 'fs-extra';
import getStream from 'get-stream';
import log from 'npmlog';

import { BLANK_LINE, CHANGELOG_HEADER, EOL } from './constants';
import { GetChangelogConfig } from './get-changelog-config';
import { makeBumpOnlyFilter } from './make-bump-only-filter';
import { readExistingChangelog } from './read-existing-changelog';
import { ChangelogConfig, ChangelogType, UpdateChangelogOption } from '../models';
import { Package } from '../package';
import { setConfigChangelogCommitClientLogin, setConfigChangelogCommitGitAuthor } from './writer-opts-transform';

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
  const options = {} as { config: ChangelogConfig; lernaPackage: string; tagPrefix: string; pkg: { path: string } };
  const context = {} as Context; // pass as positional because cc-core's merge-config is wack
  const writerOpts = {} as WriterOptions;

  // cc-core mutates input :P
  if (config.conventionalChangelog) {
    // "new" preset API
    options.config = Object.assign({}, config.conventionalChangelog) as ChangelogConfig;
  } else {
    // "old" preset API
    options.config = Object.assign({}, config) as ChangelogConfig;
  }

  // NOTE: must pass as positional argument due to weird bug in merge-config
  const gitRawCommitsOpts = Object.assign({}, options.config.gitRawCommitsOpts);

  // are we including commit author name/email or remote client login name
  if (changelogIncludeCommitsGitAuthor) {
    setConfigChangelogCommitGitAuthor(config, gitRawCommitsOpts, writerOpts, changelogIncludeCommitsGitAuthor);
  } else if (changelogIncludeCommitsClientLogin && commitsSinceLastRelease) {
    // prettier-ignore
    setConfigChangelogCommitClientLogin(config, gitRawCommitsOpts, writerOpts, commitsSinceLastRelease, changelogIncludeCommitsClientLogin);
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
  const changelogStream = conventionalChangelogCore(options, context, gitRawCommitsOpts, undefined, writerOpts);

  return Promise.all([
    // prettier-ignore
    getStream(changelogStream).then(makeBumpOnlyFilter(pkg)),
    readExistingChangelog(pkg),
  ]).then(([inputEntry, [changelogFileLoc, changelogContents]]) => {
    let newEntry = inputEntry;

    log.silly(type, 'writing new entry: %j', newEntry);

    const changelogVersion = type === 'root' ? changelogVersionMessage : '';
    const changelogHeader = CHANGELOG_HEADER.replace(
      /%s/g,
      type === 'root' ? (changelogHeaderMessage?.length > 0 ? changelogHeaderMessage + EOL : '') : ''
    );

    const content = [changelogHeader, changelogVersion, newEntry, changelogContents]
      .join(BLANK_LINE)
      .trim()
      .replace(/[\r\n]{2,}/gm, '\n\n'); // conventional-changelog adds way too many extra line breaks, let's remove a few of them

    return fs.writeFile(changelogFileLoc, content + EOL).then(() => {
      log.verbose(type, 'wrote', changelogFileLoc);

      return {
        logPath: changelogFileLoc,
        newEntry,
      };
    });
  });
}
