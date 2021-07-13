import { UpdateAvailable } from "../types";
import { dbCache } from "./dbFactory";
import { stripDots } from "./dbUtils";

const PACKAGE_GETTING_STARTED_SHOW = "package-getting-started-show";
const PACKAGE_INSTALL_TIME = "package-install-time";
const PACKAGE_LATEST_KNOWN_VERSION = "package-latest-known-version";
const PACKAGE_SENT_DATA = "package-sent-data";

export const packageGettingStartedShow = dbCache.indexedByKey<boolean, string>({
  rootKey: PACKAGE_GETTING_STARTED_SHOW,
  getKey: dnpName => stripDots(dnpName)
});

export const packageInstallTime = dbCache.indexedByKey<number, string>({
  rootKey: PACKAGE_INSTALL_TIME,
  getKey: dnpName => stripDots(dnpName)
});

export function addPackageInstalledMetadata(dnpName: string): void {
  packageGettingStartedShow.set(dnpName, true);
  packageInstallTime.set(dnpName, Date.now());
}

/**
 * Register the last emitted version for a dnpName
 * Only emit notifications for versions above this one
 */
export const packageLatestKnownVersion = dbCache.indexedByKey<
  UpdateAvailable,
  string
>({
  rootKey: PACKAGE_LATEST_KNOWN_VERSION,
  // Do NOT strip dots so the packages can be indexed by dnpName doing .getAll()
  getKey: dnpName => dnpName
});

/**
 * Store data sent by the package and show it to the UI
 */
export const packageSentData = dbCache.indexedByKey<
  Record<string, string>,
  string
>({
  rootKey: PACKAGE_SENT_DATA,
  getKey: dnpName => dnpName
});
