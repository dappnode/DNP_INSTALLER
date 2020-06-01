import fs from "fs";
import params from "../../params";
import { dockerComposeRm } from "../docker/dockerCommands";
import { dockerComposeUpSafe } from "../docker/dockerSafe";
import { Log } from "../../utils/logUi";
import { InstallPackageDataPaths } from "../../types";
import Logs from "../../logs";
const logs = Logs(module);

/**
 * [Rollback] Stop all new packages with the new compose
 * Up the old packages with the previous compose
 * @param packagesData
 * @param log
 */
export async function rollbackPackages(
  packagesData: InstallPackageDataPaths[],
  log: Log
): Promise<void> {
  // Restore all backup composes. Do it first to make sure the next version compose is not
  // used unintentionally if the installed package is restored
  for (const {
    name,
    composePath,
    composeBackupPath,
    manifestPath,
    manifestBackupPath,
    isUpdate
  } of packagesData)
    for (const { from, to } of [
      { from: composeBackupPath, to: composePath },
      { from: manifestBackupPath, to: manifestPath }
    ])
      try {
        // Don't use rename as it fails if paths are in different file systems (docker volume / docker container)
        fs.copyFileSync(from, to);
        fs.unlinkSync(from);
      } catch (e) {
        if (e.code !== "ENOENT" || isUpdate)
          logs.error(`Rollback error restoring ${name} ${from}: ${e.stack}`);
      }

  // Delete image files
  for (const { name, imagePath } of packagesData)
    try {
      fs.unlinkSync(imagePath);
    } catch (e) {
      logs.error(`Rollback error removing ${name} image: ${e.stack}`);
    }

  // Restore backup versions
  for (const { name, composePath, isUpdate } of packagesData)
    try {
      log(name, "Aborting and rolling back...");

      if (name === params.dappmanagerDnpName) {
        // The DAPPMANAGER cannot be rolled back here. If the restartPatch has already
        // stopped the original container this line will never be reached. If the
        // restartPatch failed before stopping the original container there's no need
        // to roll back, since the current container has the original version.
      } else if (isUpdate) {
        await dockerComposeUpSafe(composePath);
      } else {
        // Remove new containers that were NOT installed before this install call
        await dockerComposeRm(composePath);
      }

      log(name, "Aborted and rolled back...");
    } catch (e) {
      logs.error(`Rollback error rolling starting ${name}: ${e.stack}`);
    }
}