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
export async function updateChangelog(pkg: Package, type: 'root' | 'independent' | 'fixed', updateOptions: UpdateChangelogOption) {
  log.silly(type, 'for %s at %s', pkg.name, pkg.location);

  const {
    changelogPreset,
    rootPath,
    tagPrefix = 'v',
    version = undefined,
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
    (getStream as any)(changelogStream).then(makeBumpOnlyFilter(pkg)),
    readExistingChangelog(pkg),
  ]).then(([newEntry, [changelogFileLoc, changelogContents]]) => {
    log.silly(type, 'writing new entry: %j', newEntry);

    const changelogVersion = type === 'root' ? changelogVersionMessage : '';
    const changelogHeader = CHANGELOG_HEADER.replace(/%s/g, type === 'root'
      ? changelogHeaderMessage?.length > 0 ? changelogHeaderMessage + EOL : ''
      : ''
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
