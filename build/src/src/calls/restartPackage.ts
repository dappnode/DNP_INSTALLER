import fs from "fs";
import * as getPath from "../utils/getPath";
import restartPatch from "../modules/restartPatch";
import params from "../params";
import docker from "../modules/docker";
import { eventBus, eventBusTag } from "../eventBus";

/**
 * Calls docker rm and docker up on a package
 *
 * @param {string} id DNP .eth name
 */
export default async function restartPackage({ id }: { id: string }) {
  if (!id) throw Error("kwarg id must be defined");

  const dockerComposePath = getPath.dockerComposeSmart(id, params);
  if (!fs.existsSync(dockerComposePath)) {
    throw Error(`No docker-compose found: ${dockerComposePath}`);
  }

  if (id.includes("dappmanager.dnp.dappnode.eth")) {
    await restartPatch(id);
  } else {
    // Combining rm && up doesn't prevent the installer from crashing
    await docker.compose.rm(dockerComposePath);
    await docker.safe.compose.up(dockerComposePath);

    // Emit packages update
    eventBus.emit(eventBusTag.emitPackages);
  }

  return {
    message: `Restarted package: ${id}`,
    logMessage: true,
    userAction: true
  };
}