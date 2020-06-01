import path from "path";
import params from "../../params";
import { dockerComposeUpSafe } from "../docker/dockerSafe";
import { restartDappmanagerPatch } from "./restartPatch";
import { Log } from "../../utils/logUi";
import { copyFileTo } from "../../calls/copyFileTo";
import { InstallPackageData } from "../../types";
import Logs from "../../logs";
const logs = Logs(module);

/**
 * Create and run each package container in series
 * The order is extremely important and should be guaranteed by `orderInstallPackages`
 */
export async function runPackages(
  packagesData: InstallPackageData[],
  log: Log
): Promise<void> {
  for (const { name, composePath, fileUploads, ...pkg } of packagesData) {
    // patch to prevent installer from crashing
    if (name == params.dappmanagerDnpName) {
      log(name, "Reseting DAppNode... ");
      await restartDappmanagerPatch({
        composePath,
        composeBackupPath: pkg.composeBackupPath,
        restartCommand: pkg.metadata.restartCommand,
        restartLaunchCommand: pkg.metadata.restartLaunchCommand,
        packagesData
      });
      // This line should never be reached, because restartDappmanagerPatch() should
      // either throw, or never resolve because the main process is killed by docker
    } else {
      // Copy fileUploads if any to the container before up-ing
      if (fileUploads) {
        log(name, "Copying file uploads...");
        logs.debug(`${name} fileUploads: ${JSON.stringify(fileUploads)}`);

        await dockerComposeUpSafe(composePath, { noStart: true });
        for (const [containerPath, dataUri] of Object.entries(fileUploads)) {
          const { dir: toPath, base: filename } = path.parse(containerPath);
          await copyFileTo({ id: name, dataUri, filename, toPath });
        }
      }

      log(name, "Starting package... ");
      await dockerComposeUpSafe(composePath);
    }

    log(name, "Package started");
  }
}