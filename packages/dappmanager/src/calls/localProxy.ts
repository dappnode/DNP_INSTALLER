import { ComposeFileEditor } from "../modules/compose/editor";
import {
  stopAvahiDaemon,
  startAvahiDaemon,
  getAvahiDaemonStatus
} from "../modules/hostScripts/scripts/avahiDaemon";
import params from "../params";
import { AvahiDaemonStatus, LocalProxyingStatus } from "../types";
import { packageSetEnvironment } from "./packageSetEnvironment";
import { listPackageNoThrow } from "../modules/docker/list";

/**
 * Local proxying allows to access the admin UI through dappnode.local.
 * When disabling this feature:
 * - Remove NGINX logic in HTTPs Portal to route .local domains
 * - Stop exposing the port 80 to the local network
 * - Stop broadcasting .local domains to mDNS
 */
export async function localProxyingEnableDisable(
  enable: boolean
): Promise<void> {
  await packageSetEnvironment({
    dnpName: params.HTTPS_PORTAL_DNPNAME,
    environmentByService: {
      [params.HTTPS_PORTAL_MAIN_SERVICE]: {
        [params.HTTPS_PORTAL_LOCAL_PROXYING_ENVNAME]: enable ? "true" : "false"
      }
    }
  }).catch(e => {
    e.message = `Error setting LOCAL_PROXYING: ${e.message}`;
    throw e;
  });

  // TODO: Stop exposing port 80

  if (enable) {
    await startAvahiDaemon().catch(e => {
      e.message = `Error starting avahi daemon: ${e.message}`;
      throw e;
    });
  } else {
    await stopAvahiDaemon().catch(e => {
      e.message = `Error stopping avahi daemon: ${e.message}`;
      throw e;
    });
  }
}

/**
 * Local proxying allows to access the admin UI through dappnode.local.
 * Return current status of:
 * - NGINX is routing .local domains
 * - Port 80 is exposed
 * - Is broadcasting to mDNS
 */
export async function localProxyingStatusGet(): Promise<LocalProxyingStatus> {
  const isHttpsPresent = (await listPackageNoThrow({
    dnpName: params.HTTPS_PORTAL_DNPNAME
  }))
    ? true
    : false;

  if (!isHttpsPresent) return "https missing";

  const userSettings = ComposeFileEditor.getUserSettingsIfExist(
    params.HTTPS_PORTAL_DNPNAME,
    params.HTTPS_PORTAL_ISCORE
  );

  const LOCAL_PROXYING =
    userSettings.environment?.[params.HTTPS_PORTAL_MAIN_SERVICE]?.[
      params.HTTPS_PORTAL_LOCAL_PROXYING_ENVNAME
    ];

  // https://github.com/dappnode/DNP_HTTPS/blob/2a52450061eb3b0c4bc321e9b75547661cba1017/fs_overlay/var/lib/nginx-conf/nginx.conf.erb#L115
  // if ENV['LOCAL_PROXYING'].downcase == 'true'
  const localProxyingEnabled = String(LOCAL_PROXYING).toLowerCase() === "true";

  const avahiDaemonStatus = await getAvahiDaemonStatus().catch(e => {
    e.message = `Error getting avahi daemon status: ${e.message}`;
    throw e;
  });

  return parseLocalProxyingStatus(avahiDaemonStatus, localProxyingEnabled);
}

// Utils
function parseLocalProxyingStatus(
  avahiStatus: AvahiDaemonStatus,
  localProxyingEnabled: boolean
): LocalProxyingStatus {
  if (
    avahiStatus.avahiResolves &&
    avahiStatus.isAvahiEnabled &&
    avahiStatus.isAvahiRunning &&
    localProxyingEnabled
  )
    return "running";
  if (
    !avahiStatus.avahiResolves &&
    !avahiStatus.isAvahiEnabled &&
    !avahiStatus.isAvahiRunning &&
    !localProxyingEnabled
  )
    return "stopped";
  return "crashed";
}
