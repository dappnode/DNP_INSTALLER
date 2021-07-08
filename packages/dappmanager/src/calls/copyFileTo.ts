import path from "path";
// Modules
import {
  dockerCopyFileTo,
  dockerGetContainerWorkingDir
} from "../modules/docker/cli";
// Utils
import shell from "../utils/shell";
import dataUriToFile from "../utils/dataUriToFile";
import params from "../params";

const tempTransferDir = params.TEMP_TRANSFER_DIR;

/**
 * Copy file to a DNP:
 *
 * @param containerName Name of a docker container
 * @param dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
 * @param filename name of the uploaded file.
 * - MUST NOT be a path: "/app", "app/", "app/file.txt"
 * @param toPath path to copy a file to
 * - If path = path to a file: "/usr/src/app/config.json".
 *   Copies the contents of dataUri to that file, overwritting it if necessary
 * - If path = path to a directory: "/usr/src/app".
 *   Copies the contents of dataUri to ${dir}/${filename}
 * - If path = relative path: "config.json".
 *   Path becomes $WORKDIR/config.json, then copies the contents of dataUri there
 *   Same for relative paths to directories.
 * - If empty, defaults to $WORKDIR
 */
export async function copyFileTo({
  containerName,
  dataUri,
  filename,
  toPath
}: {
  containerName: string;
  dataUri: string;
  filename: string;
  toPath: string;
}): Promise<void> {
  if (!containerName) throw Error("Argument containerName must be defined");
  if (!dataUri) throw Error("Argument dataUri must be defined");
  if (!filename) throw Error("Argument filename must be defined");
  // toPath is allowed to be empty, it will default to WORKDIR
  // if (!toPath) throw Error("Argument toPath must be defined")
  if (filename.includes("/"))
    throw Error(`filename must not be a path: ${filename}`);

  // Construct relative paths to container
  // Fetch the WORKDIR from a docker inspect
  if (!toPath || !path.isAbsolute(toPath)) {
    // workingDir = "/usr/src/app" (Must clean the double quotes)
    let workingDir = await dockerGetContainerWorkingDir(containerName);
    workingDir = (workingDir || "/").replace(/['"]+/g, "");
    toPath = path.join(workingDir, toPath);
  }

  // Intermediate step, the file is in local file system
  await shell(`mkdir -p ${tempTransferDir}`); // Never throws
  const fromPath = path.join(tempTransferDir, filename);
  await shell(`rm -rf ${fromPath}`); // Just to be sure it's clean

  /**
   * Convert dataUri to local file
   *
   * In this conversion direction MIME types don't matter
   * The extension is what decides the type and it's the user's
   * responsability to specify it correctly on the UI. The code will
   * not cause problems if the types are not setup corretly
   */
  dataUriToFile(dataUri, fromPath);

  // Copy file from local file system to container
  await dockerCopyFileTo(containerName, fromPath, toPath);

  // Clean intermediate file
  await shell(`rm -rf ${fromPath}`);
}
