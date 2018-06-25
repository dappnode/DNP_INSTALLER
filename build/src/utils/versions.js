const semver = require('semver');

function highestVersion(v1, v2) {
  // If no version is passed return the other
  if (!v1 && v2) return v2;
  if (!v2 && v1) return v1;
  if (!v1 && !v2) throw Error('Comparing two undefined versions, version1: '+v1+' version2: '+v2);

  // If any version is latest return latest
  if (v1 == 'latest' || v2 == 'latest') return 'latest';

  // Compare semantic versions
  if (!semver.valid(v1) || !semver.valid(v2)) {
    throw new Error('Attempting to compare invalid versions, version1: '+v1+' version2: '+v2);
  }
  if (semver.gt(v1, v2)) {
    return v1;
  } else {
    return v2;
  }
}


module.exports = {
  highestVersion,
};
