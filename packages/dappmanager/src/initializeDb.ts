import * as db from "./db";
import { eventBus } from "./eventBus";
import * as dyndns from "./modules/dyndns";
import getDappmanagerImage from "./utils/getDappmanagerImage";
import getServerName from "./utils/getServerName";
import getInternalIp from "./utils/getInternalIp";
import getStaticIp from "./utils/getStaticIp";
import getExternalUpnpIp from "./modules/upnpc/getExternalIp";
import { writeGlobalEnvsToEnvFile } from "./modules/globalEnvs";
import getPublicIpFromUrls from "./utils/getPublicIpFromUrls";
import params from "./params";
import ping from "./utils/ping";
import { pause } from "./utils/asyncFlows";
import retry from "async-retry";
import shell from "./utils/shell";
import { IdentityInterface } from "./types";
import { logs } from "./logs";
import { localProxyingEnableDisable } from "./calls";
import { isUpnpAvailable } from "./modules/upnpc/isUpnpAvailable";

// Wrap async getter so they do NOT throw, but return null and log the error
const getInternalIpSafe = returnNullIfError(getInternalIp);
const getExternalUpnpIpSafe = returnNullIfError(getExternalUpnpIp, true);
const getPublicIpFromUrlsSafe = returnNullIfError(getPublicIpFromUrls);

/**
 * - Generate local keypair for dyndns
 * - Get network status variables
 * - Trigger a dyndns loop
 */
export default async function initializeDb(): Promise<void> {
  /**
   * Migrate data from the VPN db
   * - dyndns identity (including the domain)
   * - staticIp (if set)
   */
  await migrateVpnDb();

  // 1. Directly connected to the internet: Public IP is the interface IP
  // 2. Behind a router: Needs to get the public IP, open ports and get the internal IP
  // 2A. UPnP available: Get public IP without a centralize service. Can open ports
  // 2B. No UPnP: Open ports manually, needs a centralized service to get the public IP
  // 2C. No NAT-Loopback: Public IP can't be resolved within the same network. User needs 2 profiles

  // Check if the static IP is set. If so, don't use any centralized IP-related service
  // The publicIp will be obtained in the entrypoint.sh and exported as PUBLIC_IP
  const staticIp = await getStaticIp(); // Does not throw
  let internalIp: string | null = null;
  while (!internalIp) {
    internalIp = await getInternalIpSafe();
    if (!internalIp) {
      logs.warn("Internal IP is not available yet, retrying in 60 seconds");
      await pause(60 * 1000);
    }
  }

  // > External IP
  //   If the host is exposed to the internet and the staticIp is set, avoid calling UPnP.
  //   Otherwise, get the externalIp from UPnP
  const externalIp: string | null =
    staticIp && staticIp === internalIp
      ? staticIp
      : await getExternalUpnpIpSafe();

  // > Public IP
  //   `getPublicIpFromUrls` is a call to a centralized service.
  //   If the staticIp or the externalIp (from UPnP) is set, avoid calling getPublicIpFromUrls
  const publicIp = staticIp || (await getPublicIpFromUrlsSafe());

  // > UPnP Available
  //   This boolean will trigger the VPN nodejs process to try to open the ports with UPnP
  //   UPnP is available and necessary only if the internalIp is not equal to the public IP
  //   and the external IP from UPnP command succeeded
  const upnpAvailable =
    Boolean(publicIp && externalIp && internalIp !== publicIp) &&
    (await isUpnpAvailable())
      ? true
      : false;

  // >
  const doubleNat = publicIp
    ? Boolean(externalIp && externalIp !== publicIp)
    : false;

  // > No NAT Loopback
  //   This boolean will trigger a warning in the ADMIN UI to alert the user to use different VPN profiles
  //   If the DAppNode is not able to resolve it's own public IP, the user should use the internal IP
  //   to connect from the same network as the DAppNode
  //   * The ping command is really slow, only execute it if necessary
  //   * Ping does not throw
  const noNatLoopback = publicIp
    ? Boolean(internalIp !== publicIp ? !(await ping(publicIp)) : false)
    : false;

  // > Alert user to open ports
  //   This boolean will trigger a warning in the ADMIN UI to alert the user to open ports
  //   Will be true if the DAppNode is behind a router but the external IP from UPnP command failed
  const alertUserToOpenPorts = publicIp
    ? Boolean(internalIp !== publicIp && !upnpAvailable)
    : false;

  const serverName = getServerName();
  db.publicIp.set(publicIp || "");
  db.serverName.set(serverName);
  db.upnpAvailable.set(upnpAvailable);
  db.noNatLoopback.set(noNatLoopback);
  db.doubleNat.set(doubleNat);
  db.alertToOpenPorts.set(alertUserToOpenPorts);
  db.internalIp.set(internalIp);

  // Create VPN's address + privateKey if it doesn't exist yet (with static ip or not)
  // - Verify if the privateKey is corrupted or lost. Then create a new identity and alert the user
  // - Updates the domain: db.domain.set(domain);
  dyndns.generateKeys(); // Auto-checks if keys are already generated

  // Set the domain of this DAppNode to point to the internal IP for better UX
  // on Wifi connections, only if the internal IP !== public IP
  // MUST be run after key generation `dyndns.generateKeys()`
  // NOTE: Runs as a forked process with retry and a try / catch block
  updateLocalDyndns();

  // After initializing all the internal params (hostname, internal_ip, etc)
  // Persist them to the global ENVs file so other packages can consume it
  // However, the prefered way to consume global envs is via API
  writeGlobalEnvsToEnvFile();

  eventBus.initializedDb.emit();

  // Disable local proxying if we the DAppNode is exposed to the public internet
  if (publicIp === internalIp) {
    logs.info("Exposed to the public internet, disabling local proxying");
    localProxyingEnableDisable(false).then(
      () => logs.info("Disabled local proxying"),
      e => logs.error("Error disabling local proxying", e)
    );
  }
}

/**
 * Migrate data from the VPN db
 * - dyndns identity (including the domain)
 * - staticIp (if set)
 */
async function migrateVpnDb(): Promise<void> {
  try {
    if (db.isVpnDbMigrated.get()) return;

    interface VpnDb extends IdentityInterface {
      domain: string;
      staticIp: string | null;
      "imported-installation-staticIp": boolean;
    }
    const image = await getDappmanagerImage();
    const output = await shell(
      `docker run --rm -v  ${params.vpnDataVolume}:/data --entrypoint=/bin/cat ${image} /data/vpndb.json`
    );
    if (!output) throw Error(`VPN DB is empty`);
    const vpndb: VpnDb = JSON.parse(output);

    // Only set the params from the VPN if
    // - they are NOT set in the DAPPMANAGER
    // - they ARE set in the VPN
    if (vpndb.privateKey && !db.dyndnsIdentity.get().privateKey) {
      db.dyndnsIdentity.set({
        address: vpndb.address,
        privateKey: vpndb.privateKey,
        publicKey: vpndb.publicKey
      });
      db.domain.set(vpndb.domain);
    }
    if (vpndb.staticIp && !db.staticIp.get())
      db.staticIp.set(vpndb.staticIp || "");
    if (vpndb["imported-installation-staticIp"])
      db.importedInstallationStaticIp.set(
        Boolean(vpndb["imported-installation-staticIp"])
      );

    db.isVpnDbMigrated.set(true);

    logs.info("VPN DB imported successfully imported");
  } catch (e) {
    if (e.message && e.message.includes("No such file or directory")) {
      logs.warn(`VPN DB not imported, vpndb.json missing.`);
    } else {
      logs.error("Error importing VPN DB", e);
    }
  }
}

/**
 * Set the domain of this DAppNode to point to the internal IP for better UX
 * on Wifi connections, only if the internal IP !== public IP
 * MUST be run after key generation `dyndns.generateKeys()`
 * > update_local_dyndns abcd1234abcd1234.dyndns.dappnode.io 192.168.1.12
 */
async function updateLocalDyndns(): Promise<void> {
  try {
    await retry(async function updateLocalDyndnsCall(): Promise<void> {
      const domain = db.domain.get();
      const publicIp = db.publicIp.get();
      const internalIp = db.internalIp.get();
      if (internalIp !== publicIp && internalIp && domain) {
        try {
          await shell(`update_local_dyndns ${domain} ${internalIp}`);
          logs.info(`Updated local dyndns: ${domain} ${internalIp}`);
        } catch (e) {
          // Log the error in each attempt for transparency / debugging
          logs.warn(`Error on updateLocalDyndns attempt: ${e.message}`);
          throw e;
        }
      }
    });
  } catch (e) {
    logs.error("Error on update local dyndns", e);
  }
}

// Utils

function returnNullIfError(
  fn: () => Promise<string>,
  silent?: boolean
): () => Promise<string | null> {
  return async function(): Promise<string | null> {
    try {
      return await fn();
    } catch (e) {
      if (silent) logs.warn(e.message);
      else logs.error(e);
      return null;
    }
  };
}
