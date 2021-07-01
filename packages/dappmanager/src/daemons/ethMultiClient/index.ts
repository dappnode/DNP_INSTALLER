import merge from "deepmerge";
import { AbortSignal } from "abort-controller";
import * as db from "../../db";
import { eventBus } from "../../eventBus";
import params, { ethClientData } from "../../params";
import { packageInstall } from "../../calls";
import { listPackageNoThrow } from "../../modules/docker/list";
import { runOnlyOneSequentially } from "../../utils/asyncFlows";
import { runAtMostEvery } from "../../utils/asyncFlows";
import {
  EthClientInstallStatus,
  serializeError
} from "../../modules/ethClient/types";
import { logs } from "../../logs";
import { EthClientTarget } from "../../types";
import {
  EthProviderError,
  getLocalFallbackContentHash,
  setDefaultEthClientFullNode
} from "../../modules/ethClient";

/**
 * Check status of the Ethereum client and do next actions
 * This function should be run:
 * - every interval
 * - after changing the client
 * - after completing a run if the status has changed
 *
 * This architecture is used for debuggability and to be fail-safe
 * At any point the client can query the DB and see clear status
 * It makes it easier to know what will happen next given a status
 * It also retries each step automatically without added logic
 */
export async function runEthClientInstaller(
  target: EthClientTarget,
  status: EthClientInstallStatus | undefined
): Promise<EthClientInstallStatus | null> {
  // Re-check just in case, on run the installer for local target clients
  if (target === "remote") return null;

  const clientData = ethClientData[target];
  if (!clientData) throw Error(`No client data for target: ${target}`);
  const { dnpName, version, userSettings } = clientData;
  const dnp = await listPackageNoThrow({ dnpName });

  if (dnp) {
    // OK: Client is already installed
    return { status: "INSTALLED" };
  } else {
    // Client is not installed

    switch (status?.status || "TO_INSTALL") {
      case "INSTALLING":
        // NOTE: This status has to be verified on DAPPMANAGER startup. Otherwise it can
        // stay in installing state forever if the dappmanager resets during the installation
        return null;

      case "TO_INSTALL":
      case "INSTALLING_ERROR":
        // OK: Expected state, run / retry installation

        try {
          db.ethClientInstallStatus.set(target, { status: "INSTALLING" });

          const installOptions: Parameters<typeof packageInstall>[0] = {
            name: dnpName,
            version,
            userSettings: {
              [dnpName]: merge(
                // Merge the default user settings with any customization from the user
                userSettings || {},
                db.ethClientUserSettings.get(target) || {}
              )
            }
          };

          try {
            await packageInstall(installOptions);
          } catch (e) {
            // When installing DAppNode for the first time, if the user selects a
            // non-remote target and disabled fallback, there must be a way to
            // install the client package without access to an Eth node. This try / catch
            // covers this case by re-trying the installation with a locally available
            // IPFS content hash for all target packages
            if (e instanceof EthProviderError) {
              const contentHash = getLocalFallbackContentHash(dnpName);
              if (!contentHash) throw Error(`No local version for ${dnpName}`);
              await packageInstall({ ...installOptions, version: contentHash });
            } else {
              throw e;
            }
          }

          return { status: "INSTALLED" };
        } catch (e) {
          return { status: "INSTALLING_ERROR", error: serializeError(e) };
        }

      case "INSTALLED":
        // NOT-OK: Client should be installed
        // Something or someone removed the client, re-install?
        return null;

      case "UNINSTALLED":
        // OK: Client should be un-installed and is uninstalled
        return null;
    }
  }
}

/**
 * Reset status if == INSTALLING, it has to be verified
 * Otherwise it can stay in installing state forever if the dappmanager
 * resets during an installation of the client
 */
function verifyInitialStatusIsNotInstalling(): void {
  const target = db.ethClientTarget.get();
  if (target) {
    const status = db.ethClientInstallStatus.get(target);
    if (status && status.status === "INSTALLING") {
      db.ethClientInstallStatus.set(target, { status: "TO_INSTALL" });
    }
  }
}

/**
 * Eth multi-client daemon. Handles ETH client switching logic
 * Must run:
 * - every interval
 * - after changing the client
 * - after completing a run if the status has changed
 */
export function startEthMultiClientDaemon(signal: AbortSignal): void {
  verifyInitialStatusIsNotInstalling();

  const runEthMultiClientTaskMemo = runOnlyOneSequentially(async () => {
    try {
      const target = db.ethClientTarget.get();
      if (!target || target === "remote") return; // Nothing to install

      const prev = db.ethClientInstallStatus.get(target);
      const next = await runEthClientInstaller(target, prev);
      if (!next) return; // Package is uninstalled

      db.ethClientInstallStatus.set(target, next);

      if (!prev || prev.status !== next.status) {
        // Next run MUST be defered to next event loop for prevStatus to refresh
        setTimeout(eventBus.runEthClientInstaller.emit, 1000);

        if (next.status === "INSTALLED") {
          // If status switched to "INSTALLED", map to fullnode.dappnode
          // Must be done here in case the package is already installed
          // 1. Domain for BIND package
          db.fullnodeDomainTarget.set(ethClientData[target].dnpName);
          // 2. Add network alias for docker DNS
          await setDefaultEthClientFullNode(ethClientData[target].dnpName);
        }
      }
    } catch (e) {
      logs.error("Error on eth client installer daemon", e);
    }
  });

  // Subscribe with a throttle to run only one time at once
  eventBus.runEthClientInstaller.on(runEthMultiClientTaskMemo);

  runAtMostEvery(
    async () => runEthMultiClientTaskMemo(),
    params.AUTO_UPDATE_DAEMON_INTERVAL,
    signal
  );
}
