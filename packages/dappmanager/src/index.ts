import { AbortController } from "abort-controller";
import * as db from "./db";
import { eventBus } from "./eventBus";
import initializeDb from "./initializeDb";
import { createGlobalEnvsEnvFile } from "./modules/globalEnvs";
import { generateKeyPair } from "./utils/publickeyEncryption";
import { copyHostScripts } from "./modules/hostScripts";
import { migrateEthchain } from "./modules/ethClient";
import { runLegacyActions } from "./modules/legacy";
import { migrateUserActionLogs } from "./logUserAction";
import { postRestartPatch } from "./modules/installer/restartPatch";
import { startDaemons } from "./daemons";
import { SshManager } from "./modules/sshManager";
import * as calls from "./calls";
import { routesLogger, subscriptionsLogger } from "./api/logger";
import * as routes from "./api/routes";
import { logs } from "./logs";
import params from "./params";
import { getEthForwardMiddleware } from "./ethForward";
import { getVpnApiClient } from "./api/vpnApiClient";
import {
  getVersionData,
  isNewDappmanagerVersion
} from "./utils/getVersionData";
import { shellHost } from "./utils/shell";
import { startDappmanager } from "./startDappmanager";
import { addAliasToRunningContainersMigration } from "./modules/https-portal";
import { copyHostServices } from "./modules/hostServices/copyHostServices";
import { logsMigration } from "./modules/logs";

const controller = new AbortController();

const vpnApiClient = getVpnApiClient(params);
const sshManager = new SshManager({ shellHost });

// Start HTTP API
const server = startDappmanager({
  params,
  logs,
  routes,
  ethForwardMiddleware: getEthForwardMiddleware(),
  routesLogger,
  methods: calls,
  subscriptionsLogger,
  eventBus,
  isNewDappmanagerVersion,
  vpnApiClient,
  sshManager
});

// Start daemons
startDaemons(controller.signal);

// Generate keypair, network stats, and run dyndns loop
initializeDb();

// Create the global env file
createGlobalEnvsEnvFile();

// Create local keys for NACL public encryption
if (!db.naclPublicKey.get() || !db.naclSecretKey.get()) {
  const { publicKey, secretKey } = generateKeyPair();
  db.naclPublicKey.set(publicKey);
  db.naclSecretKey.set(secretKey);
}

// TODO: find a proper place for this
// Store pushed notifications in DB
eventBus.notification.on(notification => {
  db.notificationPush(notification.id, notification);
});

// Initial calls to check this DAppNode's status
calls
  .passwordIsSecure()
  .then(isSecure =>
    logs.info("Host password is", isSecure ? "secure" : "INSECURE")
  )
  .catch(e => logs.error("Error checking if host user password is secure", e));

// Read and print version data
const versionData = getVersionData();
if (versionData.ok) logs.info("Version info", versionData.data);
else logs.error(`Error getting version data: ${versionData.message}`);

/**
 * [LEGACY] The previous method of injecting ENVs to a DNP was via .env files
 * This function will read the contents of .env files and add them in the
 * compose itself in the `environment` field in array format.
 *
 * [LEGACY] The DB is split into two where the old db becomes a cache only
 * and the new one is for permanent required data. Some key-values will be
 * moved from the old db to the cache db.
 */

migrateEthchain().catch(e => logs.error("Error migrating ETHCHAIN", e));

migrateUserActionLogs().catch(e =>
  logs.error("Error migrating userActionLogs", e)
);

runLegacyActions().catch(e => logs.error("Error running legacy actions", e));

/**
 * Migrations:
 * - Alias and network migration
 * - logs path migrations
 */

addAliasToRunningContainersMigration().catch(e =>
  logs.error("Error adding alias to running containers", e)
);

logsMigration().catch(e => logs.error("Error migrating logs files on host", e));

/**
 * Run initial opts
 * - Copy host scripts
 * - Copy host services
 */

copyHostScripts().catch(e => logs.error("Error copying host scripts", e));

copyHostServices().catch(e => logs.error("Error copying host services", e));

postRestartPatch().catch(e => logs.error("Error on postRestartPatch", e));

// Graceful shutdown
process.on("SIGINT", () => {
  controller.abort();
  server.close();
  process.exit(0);
});
