/**
 * The purpose of this function is to determine whether the exception object
 * passed in represents a version conflict when publishing a package to the
 * GitHub npm registry.
 *
 * An example of a version conflict error is pasted below:
 *
 * ```json
 * {
 *     "name": "HttpErrorGeneral",
 *     "headers": {
 *     },
 *     "statusCode": 409,
 *     "code": "E409",
 *     "method": "PUT",
 *     "uri": "https://npm.pkg.github.com/hyperledger/@hyperledger%2fcacti-cactus-cmd-api-server",
 *     "body": {
 *         "error": "Cannot publish over existing version"
 *     },
 *     "pkgid": "@hyperledger/cacti-cactus-cmd-api-server@2.0.0-alpha.2",
 *     "message": "409 Conflict - PUT https://npm.pkg.github.com/hyperledger/@hyperledger%2fcacti-cactus-cmd-api-server - Cannot publish over existing version"
 * }
 * ```
 * @param ex The exception object to check for a version conflict error.
 * @returns {boolean} true if the error represents a version conflict, false otherwise.
 */
export function isNpmPkgGitHubPublishVersionConflict(ex: unknown): boolean {
  if (!ex || typeof ex !== 'object' || !(ex instanceof Error)) {
    return false;
  } else if ('code' in ex && ex.code === 'E409') {
    return true;
  } else if (
    'body' in ex &&
    typeof ex.body === 'object' &&
    (ex.body as Record<string, unknown>).error === 'Cannot publish over existing version'
  ) {
    return true;
  } else {
    return ex.message.startsWith('409 Conflict - PUT https://npm.pkg.github.com');
  }
}
