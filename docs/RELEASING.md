# Releasing Lerna-Lite

The GitHub **Release to NPM** workflow builds the workspace, versions packages, and publishes missing package versions. A non-dry-run publish writes a release plan and its tarballs to the runner's temporary directory. The workflow uploads them as the `lerna-release-recovery` artifact even if the publish step fails. Artifact retention follows the repository's GitHub Actions settings.

To recover a failed publish:

1. Fix the underlying problem, such as a missing npm trusted-publisher configuration.
2. Start **Release to NPM** again, selecting a tag or branch that points to the release commit recorded in the plan. The workflow checks that this commit matches the triggering SHA used for npm provenance.
3. Enter the original workflow run ID in `release_plan_run_id`. This skips versioning, downloads the original plan and tarballs, and resumes that release. The old `skip_version_retry_publish` option remains available for releases that did not create a plan, but it cannot recover that plan's exact selection or pending tag operations.
4. If you manually published a package with different tarball bytes, inspect its published contents first. Then enter its exact `package@version` in `resume_allow_existing`. Separate multiple entries with commas. This explicitly skips the published-byte comparison for those entries only.

For local releases, `pnpm new-publish` prints a unique plan path under `.release-recovery/`. Preserve both the `.json` file and its `.json.artifacts/` directory after a failure. In a clean checkout of the release commit, rebuild with the original options and run `pnpm run local-lerna publish --resume <plan-file>`. Add `--resume-allow-existing <package@version>` only after inspecting a manually published package.

The plan does not roll back Git commits, Git tags, or published packages. It is created after versioning; a failure before the plan is written requires manual investigation. Registry tag checks and updates are not atomic, so do not run concurrent releases for the same packages.

The normal workflow builds and versions in the same run. npm provenance uses GitHub's triggering SHA, which can precede the release commit created by the version step. The exact-SHA check above applies to resumed runs; it does not change that existing behavior for a new release.
