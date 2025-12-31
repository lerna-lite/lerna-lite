/**
 * The purpose of this function is to determine whether the error object passed in
 * represents a version conflict when publishing a package to the npm registry.
 *
 * An example of a version conflict error is:
 * ```json
 * {
 *   "name": "HttpErrorGeneral",
 *   "headers": {
 *   },
 *   "statusCode": 403,
 *   "code": "E403",
 *   "method": "PUT",
 *   "uri": "https://registry.npmjs.org/@hyperledger%2fcactus-cmd-api-server",
 *   "body": {
 *       "success": false,
 *       "error": "You cannot publish over the previously published versions: 2.0.0-alpha.2."
 *   },
 *   "pkgid": "@hyperledger/cactus-cmd-api-server@2.0.0-alpha.2",
 *   "message": "403 Forbidden - PUT https://registry.npmjs.org/@hyperledger%2fcactus-cmd-api-server - You cannot publish over the previously published versions: 2.0.0-alpha.2."
 * }
 * ```
 *
 * @param ex The exception object to check for a version conflict error.
 * @returns {boolean} true if the error represents a version conflict, false otherwise
 */
export function isNpmJsPublishVersionConflict(ex: unknown): boolean {
  if (!ex || typeof ex !== 'object' || !(ex instanceof Error)) {
    return false;
  } else if ('code' in ex && ex.code === 'EPUBLISHCONFLICT') {
    return true;
  } else if (
    'code' in ex &&
    ((ex.code === 'E409' && ex.message?.includes('Failed to save packument')) ||
      (ex.code === 'E403' && ex.message?.includes('You cannot publish over the previously published versions')))
  ) {
    return true;
  }
  return false;
}
