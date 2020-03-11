import fs from "fs";
import { listContainerNoThrow } from "../../modules/docker/listContainers";
import { dockerVolumesList, dockerDf } from "../../modules/docker/dockerApi";
import { dockerRm } from "../../modules/docker/dockerCommands";
import { changeEthMultiClient } from ".";
import { migrateVolume } from "../../modules/hostScripts";
import { getUserSettingsSafe } from "../../utils/dockerComposeFile";
import * as getPath from "../../utils/getPath";
import Logs from "../../logs";
import shell from "../../utils/shell";
const logs = Logs(module);

const ethchainDnpName = "ethchain.dnp.dappnode.eth";

const ethchainVolumes = {
  data: "dncore_ethchaindnpdappnodeeth_data",
  geth: "dncore_ethchaindnpdappnodeeth_geth",
  identity: "dncore_ethchaindnpdappnodeeth_identity"
};
const openEthereumVolumes = {
  data: "openethereumdnpdappnodeeth_data",
  identity: "openethereumdnpdappnodeeth_identity"
};
const gethVolumes = {
  data: "gethdnpdappnodeeth_data",
  identity: "gethdnpdappnodeeth_identity"
};

/**
 * Migrate old core package DNP_ETHCHAIN to the new format
 * 1. Get ETHCHAIN config and which client. Then delete configs
 * 2. Move volumes in the host
 * 3. Install new package with existing settings
 */
export default async function migrateEthchain(): Promise<void> {
  const ethchain = await listContainerNoThrow(ethchainDnpName);
  const volumes = await dockerVolumesList();
  // If ethchain compose does not exist, returns {}
  const userSettings = getUserSettingsSafe(ethchainDnpName, true);
  const envs: {
    EXTRA_OPTS?: string; // --warp-barrier 9530000
    EXTRA_OPTS_GETH?: string; // --syncmode light
    DEFAULT_CLIENT?: string; // PARITY
  } = (ethchain || {}).envs || userSettings.environment || {};
  const isNextOpenEthereum = /parity/i.test(envs.DEFAULT_CLIENT || "");

  // Non-blocking step of uninstalling the DNP_ETHCHAIN
  if (ethchain)
    try {
      await dockerRm(ethchain.id);
      logs.info("Removed ETHCHAIN package");

      // Clean manifest and docker-compose
      for (const filepath of [
        getPath.dockerCompose(ethchainDnpName, true),
        getPath.manifest(ethchainDnpName, true)
      ])
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    } catch (e) {
      logs.error(`Error removing ETHCHAIN package: ${e.stack}`);
    }

  // Non-blocking step of migrating old volumes with a host script
  const migrations = [
    {
      id: "OpenEthereum data volume",
      from: ethchainVolumes.data,
      to: openEthereumVolumes.data
    },
    {
      id: "Geth data volume",
      from: ethchainVolumes.geth,
      to: openEthereumVolumes.data
    },
    {
      id: "Identity volume",
      from: ethchainVolumes.identity,
      to: isNextOpenEthereum
        ? gethVolumes.identity
        : openEthereumVolumes.identity
    }
  ]
    // Only migrate volumes that exists and their target does not
    .filter(
      ({ from, to }) =>
        volumes.find(vol => vol.Name === from) &&
        !volumes.find(vol => vol.Name === to)
    );

  for (const { id, from, to } of migrations) {
    try {
      // Remove all packages that are using the volume to safely move it
      const idsToRemove = await shell(`docker ps -aq --filter volume=${from}`);
      if (idsToRemove) await shell(`docker rm -f ${idsToRemove}`);
      // mv the docker var lib folder in the host context
      await migrateVolume(from, to);
      logs.info(`Migrated ETHCHAIN ${id} from ${from} to ${to}`);
    } catch (e) {
      logs.error(`Error migrating ETHCHAIN ${id}: ${e.stack}`);
    }
  }
  // Optimization to only run `docker system df -v` once, can run for +15s
  if (migrations.length > 0)
    try {
      // Make sure the volume was migrated successfully before removing it
      const { Volumes } = await dockerDf({ noCache: true });
      for (const { id, from } of migrations) {
        const fromVol = Volumes.find(vol => vol.Name === from);
        if (!fromVol)
          logs.warning(`Did not delete ETHCHAIN ${id} ${from}, not found`);
        else if (fromVol.UsageData.Size > 0)
          logs.warning(`Did not delete ETHCHAIN ${id} ${from}, not empty`);
        else
          try {
            await shell(`docker volume rm -f ${from}`);
            logs.info(`Deleted ETHCHAIN ${id} ${from}`);
          } catch (e) {
            logs.error(`Error deleting ETHCHAIN ${id} ${from}: ${e.stack}`);
          }
      }
    } catch (e) {
      logs.error(`Error deleting ETHCHAIN volumes: ${e.stack}`);
    }

  // Install new package. fullnode.dappnode is assigned after install
  if (ethchain) {
    const target = isNextOpenEthereum ? "parity" : "geth";
    const EXTRA_OPTS = isNextOpenEthereum
      ? envs.EXTRA_OPTS
      : envs.EXTRA_OPTS_GETH;

    await changeEthMultiClient(target, false, {
      portMappings: userSettings.portMappings,
      environment: EXTRA_OPTS ? { EXTRA_OPTS } : undefined
    });
  }
}