import { staticKey } from "./dbMain";

const IMPORTED_INSTALLATION_STATIC_IP = "imported-installation-staticIp";
const IS_VPN_DB_MIGRATED = "is-vpn-db-migrated";
const IS_FIRST_TIME_RUNNING = "is-first-time-running";

export const importedInstallationStaticIp = staticKey<boolean>(
  IMPORTED_INSTALLATION_STATIC_IP,
  false
);

export const isVpnDbMigrated = staticKey<boolean>(IS_VPN_DB_MIGRATED, false);

export const isFirstTimeRunning = staticKey<boolean>(
  IS_FIRST_TIME_RUNNING,
  false
);
