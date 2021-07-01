import * as db from "../../db";
import { eventBus } from "../../eventBus";
import params, { ethClientData } from "../../params";
import { packageRemove, packageGet } from "../../calls";
import { EthClientTarget, UserSettings } from "../../types";
import { logs } from "../../logs";
import { ComposeFileEditor } from "../compose/editor";
import { parseServiceNetworks } from "../compose/networks";
import { dockerNetworkDisconnect, dockerNetworkConnect } from "../docker";
import { getEndpointConfig } from "../https-portal/migration";
import Dockerode from "dockerode";

// Types

/**
 * Changes the ethereum client used to fetch package data
 * Callable by the client
 * @param nextTarget Ethereum client to change to
 * @param deletePrevEthClient If set delete previous eth1 client
 */
export async function changeEthMultiClient(
  nextTarget: EthClientTarget,
  deletePrevEthClient?: boolean,
  userSettings?: UserSettings
): Promise<void> {
  const prevTarget = db.ethClientTarget.get();

  // Set user settings of next target if any
  if (userSettings) db.ethClientUserSettings.set(nextTarget, userSettings);

  // Delete previous ETH client on demmand by the user
  if (prevTarget !== nextTarget && prevTarget && prevTarget !== "remote") {
    const clientData = ethClientData[prevTarget];
    if (deletePrevEthClient) {
      try {
        clientData && (await packageRemove({ dnpName: clientData.dnpName }));
        // Must await uninstall because geth -> light, light -> geth
        // will create conflicts since it's the same DNP
      } catch (e) {
        logs.error("Error removing previous ETH multi-client", e);
      }
    } else {
      // Remove alias fullnode.dappnode from the eth client if not removed by the user
      try {
        await setDefaultEthClientFullNode(clientData.dnpName);
      } catch (e) {
        logs.error(
          "Error removing fullnode.dappnode alias from previous ETH multi-client",
          e
        );
      }
    }
  }

  // Setting the status to selected will trigger an install
  db.ethClientTarget.set(nextTarget);
  if (prevTarget !== nextTarget && nextTarget !== "remote") {
    db.ethClientInstallStatus.set(nextTarget, { status: "TO_INSTALL" });
    eventBus.runEthClientInstaller.emit();
  }
}

// Utils

export async function setDefaultEthClientFullNode(
  dnpName: string
): Promise<void> {
  const previousEthClientPackage = await packageGet({
    dnpName
  });

  // Check if ETH client is multiservice, if so get the mainContainer
  const mainService = previousEthClientPackage.manifest?.mainService;
  const serviceName =
    mainService || previousEthClientPackage.containers[0].serviceName;
  // The container selected will be:
  // - Container owner of the main service (if exists)
  // - First container otherwhise
  const previousEthClientContainerName =
    previousEthClientPackage.containers.find(
      container => container.serviceName === serviceName
    )?.containerName || previousEthClientPackage.containers[0].containerName;

  // Remove fullnode alias from endpoint config
  const currentEndpointConfig = await getEndpointConfig(
    previousEthClientContainerName
  );
  const endpointConfig: Partial<Dockerode.NetworkInfo> = {
    ...currentEndpointConfig,
    Aliases: [
      ...currentEndpointConfig?.Aliases.filter(
        // according to docs for compose file v3, aliases are declared as strings https://docs.docker.com/compose/compose-file/compose-file-v3/#aliases
        (item: string) => item !== params.FULLNODE_ALIAS
      )
    ]
  };
  // Remove fullnode alias from compose
  removeFullnodeAliasFromCompose(dnpName, serviceName);
  await dockerNetworkDisconnect(
    params.DNP_PRIVATE_NETWORK_NAME,
    previousEthClientContainerName
  );
  await dockerNetworkConnect(
    params.DNP_PRIVATE_NETWORK_NAME,
    previousEthClientContainerName,
    endpointConfig
  );
}

export function removeFullnodeAliasFromCompose(
  ethClientDnpName: string,
  ethClientServiceName: string
): void {
  editComposeFullnodeAliasEthClient(
    true,
    ethClientDnpName,
    ethClientServiceName
  );
}

export function addFullnodeAliasToCompose(
  ethClientDnpName: string,
  ethClientServiceName: string
): void {
  editComposeFullnodeAliasEthClient(
    false,
    ethClientDnpName,
    ethClientServiceName
  );
}

function editComposeFullnodeAliasEthClient(
  removeAlias: boolean,
  ethClientDnpName: string,
  ethClientServiceName: string
): void {
  const compose = new ComposeFileEditor(ethClientDnpName, false);

  const composeService = compose.services()[ethClientServiceName];
  const serviceNetworks = parseServiceNetworks(
    composeService.get().networks || {}
  );
  const serviceNetwork =
    serviceNetworks[params.DNP_PRIVATE_NETWORK_NAME] ?? null;

  if (removeAlias)
    composeService.removeNetworkAliases(
      params.DNP_PRIVATE_NETWORK_NAME,
      [params.FULLNODE_ALIAS],
      serviceNetwork
    );
  else
    composeService.addNetworkAliases(
      params.DNP_PRIVATE_NETWORK_NAME,
      [params.FULLNODE_ALIAS],
      serviceNetwork
    );

  compose.write();
}
