import semver from "semver";
import listContainers from "../../modules/listContainers";
import * as parse from "../../utils/parse";
import * as apm from "../../modules/apm";
import { eventBus, eventBusTag } from "../../eventBus";
import params from "../../params";
// Utils
import computeSemverUpdateType from "../../utils/computeSemverUpdateType";
import {
  isDnpUpdateEnabled,
  isUpdateDelayCompleted,
  flagCompletedUpdate,
  flagErrorUpdate
} from "../../utils/autoUpdateHelper";
// External calls
import installPackage from "../../calls/installPackage";
import Logs from "../../logs";
const logs = Logs(module);

/**
 * Only `minor` and `patch` updates are allowed
 */

async function updateMyPackage(name: string, version: string) {
  // Check if this specific dnp has auto-updates enabled
  if (!isDnpUpdateEnabled(name)) return;

  const latestVersion = await apm.getLatestSemver(parse.packageReq(name));

  // Compute if the update type is "patch"/"minor" = is allowed
  // If release is not allowed, abort
  const updateType = computeSemverUpdateType(version, latestVersion);
  if (updateType !== "minor" && updateType !== "patch") return;

  // Enforce a 24h delay before performing an auto-update
  // Also records the remaining time in the db for the UI
  if (!isUpdateDelayCompleted(name, latestVersion)) return;

  logs.info(`Auto-updating ${name} to ${latestVersion}...`);

  try {
    await installPackage({ id: name });

    flagCompletedUpdate(name, latestVersion);
    logs.info(`Successfully auto-updated system packages`);
    eventBus.emit(eventBusTag.emitPackages);
  } catch (e) {
    flagErrorUpdate(name, e.message);
    throw e;
  }
}

export default async function updateMyPackages() {
  const dnpList = await listContainers();

  const dnps = dnpList.filter(
    dnp =>
      dnp.name &&
      // Ignore core DNPs
      dnp.isDnp &&
      // Ignore wierd versions
      semver.valid(dnp.version) &&
      // MUST come from the APM
      (!dnp.origin || params.AUTO_UPDATE_INCLUDE_IPFS_VERSIONS)
  );

  for (const { name, version } of dnps) {
    try {
      await updateMyPackage(name, version);
    } catch (e) {
      logs.error(`Error auto-updating ${name}: ${e.stack}`);
    }
  }
}