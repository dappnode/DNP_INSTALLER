import semver from "semver";

/**
 * Must accept regular semvers and "*"
 * @param {string} version
 */
export default function isSemver(version: string) {
  return Boolean(semver.validRange(version));
}