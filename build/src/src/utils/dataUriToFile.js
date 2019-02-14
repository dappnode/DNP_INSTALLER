const dataUriToBuffer = require('data-uri-to-buffer');
const fs = require('fs');

/**
 * Converts a data URI feeded from the server to a downloadable blob
 *
 * @param {String} dataUri = data:application/zip;base64,UEsDBBQAAAg...
 * @param {String} pathTo = DNCORE/tempfile
 */
function dataUriToFile(dataUri, pathTo) {
  const decodedBuffer = dataUriToBuffer(dataUri);
  fs.writeFileSync(pathTo, decodedBuffer);
}

module.exports = dataUriToFile;
