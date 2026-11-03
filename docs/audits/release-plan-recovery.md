# Release plan recovery experiment

Status: shelved on `archive/release-plan-recovery`, based on main at `4c51e3652`. This is an experiment, not a recommendation to merge or use it for a release.

## Motivation and scope

[tRPC's release work](https://github.com/trpc/trpc/pull/7832) highlighted the difficulty of recovering from a partial publish after the release commit and tags have been pushed. A separate example involved a new npm package without a configured trusted publisher: earlier packages could be published before authentication failed for that package.

The experiment records the release commit, package versions, registries, tags and content hashes, archives tarballs, and adds options to resume a release from that plan. It also changes this repository's release workflow and local scripts to save and reuse plans. An explicit exception allows a maintainer to accept a manually published package with different bytes.

## Assessment

The plan can make a retry more reproducible, particularly from a fresh checkout, and lets it verify package content and expected tag state. It does not prevent an OIDC failure, configure trusted publishers, undo published versions, roll back pushed commits or tags, or guarantee atomic tag updates. It introduces substantial code, a new artifact-retention requirement and additional release workflow complexity. Its benefit over the existing retry flow has not been demonstrated for tRPC's actual failures or the missing trusted publisher example.

The self-release workflow requires a resumed GitHub Actions run to target the recorded release commit for provenance. The existing initial release workflow creates its release commit after the workflow starts, so its `GITHUB_SHA` may still point at the triggering commit. The experiment does not resolve that initial-run provenance concern.

## Verification and open questions

Focused unit tests, dry-run e2e tests, the TypeScript build, lint and formatting checks passed during development; lint reported an unrelated existing warning. The workflow YAML and shell syntax and selected argument and commit checks were inspected locally. The full non-dry-run recovery e2e test and the GitHub artifact upload/download workflow were not run locally. CI on supported Node versions and a realistic recovery exercise are needed before considering the implementation production-ready.

Before revisiting, reproduce an interrupted publish with the existing retry behavior, including a missing trusted publisher, partial uploads and temporary-tag promotion. Identify a concrete failure that a smaller fix cannot address. If retaining this approach, review the registry and tag race windows, artifact integrity and retention, auth isolation, lifecycle behavior, provenance, manual exception safety and failure handling against real workflows. Registry tag operations are not atomic; releases must be serialized.
