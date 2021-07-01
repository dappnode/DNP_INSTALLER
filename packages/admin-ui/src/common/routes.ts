import {
  AutoUpdateDataView,
  EthClientTarget,
  CoreUpdateData,
  DirectoryItem,
  RequestedDnp,
  UserSettingsAllDnps,
  MountpointData,
  SystemInfo,
  VolumeData,
  PortMapping,
  PackageNotification,
  PackageBackup,
  EthClientFallback,
  NewFeatureId,
  NewFeatureStatus,
  VpnDeviceCredentials,
  VpnDevice,
  PackageNotificationDb,
  UserActionLog,
  InstalledPackageDetailData,
  PackageEnvs,
  HostStatCpu,
  HostStatDisk,
  HostStatMemory,
  PublicIpResponse,
  ChainData,
  ShhStatus,
  PortToOpen,
  UpnpTablePortStatus,
  ApiTablePortStatus,
  HttpsPortalMapping,
  DockerUpdateStatus,
  WireguardDeviceCredentials,
  ExposableServiceMapping,
  HostDiagnoseItem,
  InstalledPackageDataApiReturn,
  WifiReport,
  CurrentWifiCredentials,
  LocalProxyingStatus
} from "./types";

export interface Routes {
  /**
   * Returns formated auto-update data
   */
  autoUpdateDataGet: () => Promise<AutoUpdateDataView>;

  /**
   * Edits the auto-update settings
   * @param id = "my-packages", "system-packages" or "bitcoin.dnp.dappnode.eth"
   * @param enabled Auto update is enabled for ID
   */
  autoUpdateSettingsEdit: (kwargs: {
    id: string;
    enabled: boolean;
  }) => Promise<void>;

  /**
   * Generates a backup of a package and sends it to the client for download.
   * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
   */
  backupGet: (kwargs: {
    dnpName: string;
    backup: PackageBackup[];
  }) => Promise<string>;

  /**
   * Restores a backup of a package from the dataUri provided by the user
   * @returns fileId = "64020f6e8d2d02aa2324dab9cd68a8ccb186e192232814f79f35d4c2fbf2d1cc"
   */
  backupRestore: (kwargs: {
    dnpName: string;
    backup: PackageBackup[];
    fileId: string;
  }) => Promise<void>;

  /**
   * Returns chain data for all installed packages declared as chains
   * Result is cached for 5 seconds across all consumers
   */
  chainDataGet(): Promise<ChainData[]>;

  /**
   * Used to test different IPFS timeout parameters live from the ADMIN UI.
   * @param timeout new IPFS timeout in ms
   */
  changeIpfsTimeout: (kwargs: { timeout: number }) => Promise<void>;

  /**
   * Cleans the cache files of the DAPPMANAGER:
   */
  cleanCache: () => Promise<void>;

  /**
   * Cleans the main database of the DAPPMANAGER:
   */
  cleanDb: () => Promise<void>;

  /**
   * Copy file to a DNP:
   * @param containerName Name of a docker container
   * @param dataUri = "data:application/zip;base64,UEsDBBQAAAg..."
   * @param filename name of the uploaded file.
   * - MUST NOT be a path: "/app", "app/", "app/file.txt"
   * @param toPath path to copy a file to
   * - If path = path to a file: "/usr/src/app/config.json".
   *   Copies the contents of dataUri to that file, overwritting it if necessary
   * - If path = path to a directory: "/usr/src/app".
   *   Copies the contents of dataUri to ${dir}/${filename}
   * - If path = relative path: "config.json".
   *   Path becomes $WORKDIR/config.json, then copies the contents of dataUri there
   *   Same for relative paths to directories.
   * - If empty, defaults to $WORKDIR
   */
  copyFileTo: (kwargs: {
    containerName: string;
    dataUri: string;
    filename: string;
    toPath: string;
  }) => Promise<void>;

  /** Set the dappnodeWebNameSet */
  dappnodeWebNameSet: (dappnodeWebName: string) => Promise<void>;

  /**
   * Creates a new device with the provided id.
   * Generates certificates and keys needed for OpenVPN.
   * @param id Device id name
   */
  deviceAdd: (kwargs: { id: string }) => Promise<void>;

  /**
   * Creates a new OpenVPN credentials file, encrypted.
   * The filename is the (16 chars short) result of hashing the generated salt in the db,
   * concatenated with the device id.
   * @param id Device id name
   */
  deviceCredentialsGet: (kwargs: {
    id: string;
  }) => Promise<VpnDeviceCredentials>;

  /**
   * Removes the device with the provided id, if exists.
   * @param id Device id name
   */
  deviceRemove: (kwargs: { id: string }) => Promise<void>;

  /**
   * Resets the device credentials with the provided id, if exists.
   * @param id Device id name
   */
  deviceReset: (kwargs: { id: string }) => Promise<void>;

  /**
   * Gives/removes admin rights to the provided device id.
   * @param id Device id name
   * @param isAdmin new admin status
   */
  deviceAdminToggle: (kwargs: {
    id: string;
    isAdmin: boolean;
  }) => Promise<void>;

  /**
   * Returns true if a password has been created for this device
   * @param id Device id name
   */
  devicePasswordHas: (kwargs: { id: string }) => Promise<boolean>;

  /**
   * Returns the login token of this device, creating it if necessary
   * If the password has been changed and is no longer a login token, throws
   * @param id Device id name
   */
  devicePasswordGet: (kwargs: { id: string }) => Promise<string>;

  /**
   * Returns a list of the existing devices, with the admin property
   */
  devicesList: () => Promise<VpnDevice[]>;

  /**
   * Collect host info for support
   */
  diagnose: () => Promise<HostDiagnoseItem[]>;

  /** Updates docker compose */
  dockerComposeUpdate: () => Promise<string>;
  /** Returns docker-compose update requirements */
  dockerComposeUpdateCheck: () => Promise<DockerUpdateStatus>;
  /** Updates docker engine */
  dockerEngineUpdate: () => Promise<string>;
  /** Returns docker engine update requirements */
  dockerEngineUpdateCheck: () => Promise<DockerUpdateStatus>;

  /**
   * Sets if a fallback should be used
   */
  ethClientFallbackSet: (kwargs: {
    fallback: EthClientFallback;
  }) => Promise<void>;

  /**
   * Changes the ethereum client used to fetch package data
   */
  ethClientTargetSet: (kwargs: {
    target: EthClientTarget;
    deletePrevEthClient?: boolean;
  }) => Promise<void>;

  /**
   * Return formated core update data
   */
  fetchCoreUpdateData: (kwarg: { version?: string }) => Promise<CoreUpdateData>;

  /**
   * Fetch directory summary
   */
  fetchDirectory: () => Promise<DirectoryItem[]>;

  /**
   * Fetch extended info about a new DNP
   */
  fetchDnpRequest: (kwargs: { id: string }) => Promise<RequestedDnp>;

  /**
   * Returns the user action logs. This logs are stored in a different
   * file and format, and are meant to ease user support
   * The list is ordered from newest to oldest. Newest log has index = 0
   * @param first for pagination
   * @param after for pagination
   */
  getUserActionLogs: (kwargs: {
    first?: number;
    after?: number;
  }) => Promise<UserActionLog[]>;

  /** HTTPs Portal: map a subdomain */
  httpsPortalMappingAdd(mapping: HttpsPortalMapping): Promise<void>;
  /** HTTPs Portal: remove an existing mapping */
  httpsPortalMappingRemove(mapping: HttpsPortalMapping): Promise<void>;
  /** HTTPs Portal: get all mappings */
  httpsPortalMappingsGet(): Promise<HttpsPortalMapping[]>;
  /** HTTPs Portal: get exposable services with metadata */
  httpsPortalExposableServicesGet(): Promise<ExposableServiceMapping[]>;
  /** HTTPs Portal: recreate mappings */
  httpsPortalMappingsRecreate(): Promise<void>;

  /**
   * Attempts to cat a common IPFS hash. resolves if all OK, throws otherwise
   */
  ipfsTest(): Promise<void>;

  /**
   * Local proxying allows to access the admin UI through dappnode.local.
   * When disabling this feature:
   * - Remove NGINX logic in HTTPs Portal to route .local domains
   * - Stop exposing the port 80 to the local network
   * - Stop broadcasting .local domains to mDNS
   */
  localProxyingEnableDisable: (enable: boolean) => Promise<void>;

  /**
   * Local proxying allows to access the admin UI through dappnode.local.
   * Return current status of:
   * - NGINX is routing .local domains
   * - Port 80 is exposed
   * - Is broadcasting to mDNS
   */
  localProxyingStatusGet: () => Promise<LocalProxyingStatus>;

  /**
   * Returns the list of current mountpoints in the host,
   * by running a pre-written script in the host
   */
  mountpointsGet: () => Promise<MountpointData[]>;

  /**
   * Flag the UI welcome flow as completed
   */
  newFeatureStatusSet: (kwargs: {
    featureId: NewFeatureId;
    status: NewFeatureStatus;
  }) => Promise<void>;

  /**
   * Returns not viewed notifications.
   * Use an array as the keys are not known in advance and the array form
   * is okay for RPC transport, as uniqueness is guaranteed
   */
  notificationsGet: () => Promise<PackageNotificationDb[]>;

  /**
   * Marks notifications as view by deleting them from the db
   * @param ids Array of ids to be marked as read [ "n-id-1", "n-id-2" ]
   */
  notificationsRemove: (kwargs: { ids: string[] }) => Promise<void>;

  /**
   * Adds a notification to be shown the UI.
   * Set the notification param to null for a random notification
   */
  notificationsTest: (kwargs: {
    notification?: PackageNotification;
  }) => Promise<void>;

  /**
   * Installs a DAppNode Package.
   * Resolves dependencies, downloads release assets, loads the images to docker,
   * sets userSettings and starts the docker container for each package.
   *
   * The logId is the requested id. It is used for the UI to track the progress
   * of the installation in real time and prevent double installs
   *
   * Options
   * - BYPASS_RESOLVER {bool}: Skips dappGet to only fetche first level dependencies
   * - BYPASS_CORE_RESTRICTION {bool}: Allows unverified core DNPs (from IPFS)
   */
  packageInstall: (kwargs: {
    name: string;
    version?: string;
    userSettings?: UserSettingsAllDnps;
    options?: {
      BYPASS_RESOLVER?: boolean;
      BYPASS_CORE_RESTRICTION?: boolean;
    };
  }) => Promise<void>;

  /**
   * Get package detail information
   */
  packageGet: (kwargs: {
    dnpName: string;
  }) => Promise<InstalledPackageDetailData>;

  /**
   * Returns the list of current containers associated to packages
   */
  packagesGet: () => Promise<InstalledPackageDataApiReturn[]>;

  /**
   * Toggles the visibility of a getting started block
   * @param show Should be shown on hidden
   */
  packageGettingStartedToggle: (kwargs: {
    dnpName: string;
    show: boolean;
  }) => Promise<void>;

  /**
   * Returns the logs of the docker container of a package
   * @param containerName Name of a docker container
   * @param options log options
   * - timestamps: Show timestamps
   * - tail: Number of lines to return from bottom: 200
   * @returns String with escape codes
   */
  packageLog: (kwargs: {
    containerName: string;
    options?: { timestamps?: boolean; tail?: number };
  }) => Promise<string>;

  /**
   * Remove a package and its data
   * @param id DNP .eth name
   * @param deleteVolumes flag to also clear permanent package data
   */
  packageRemove: (kwarg: {
    dnpName: string;
    deleteVolumes?: boolean;
    timeout?: number;
  }) => Promise<void>;

  /**
   * Recreates a package containers
   */
  packageRestart: (kwargs: {
    dnpName: string;
    serviceNames?: string[];
  }) => Promise<void>;

  /**
   * Removes a package volumes. The re-ups the package
   */
  packageRestartVolumes: (kwargs: {
    dnpName: string;
    volumeId?: string;
  }) => Promise<void>;

  /**
   * Updates the .env file of a package. If requested, also re-ups it
   */
  packageSetEnvironment: (kwargs: {
    dnpName: string;
    environmentByService: { [serviceName: string]: PackageEnvs };
  }) => Promise<void>;

  /**
   * Updates a package port mappings
   */
  packageSetPortMappings: (kwargs: {
    dnpName: string;
    portMappingsByService: { [serviceName: string]: PortMapping[] };
    options?: { merge: boolean };
  }) => Promise<void>;

  /**
   * Stops or starts a package containers
   * @param timeout seconds to stop the package
   */
  packageStartStop: (kwargs: {
    dnpName: string;
    serviceNames?: string[];
    options?: { timeout?: number };
  }) => Promise<void>;

  /**
   * Changes the user `dappnode`'s password in the host machine
   * Only allows it if the current password has the salt `insecur3`
   */
  passwordChange: (kwargs: { newPassword: string }) => Promise<void>;

  /**
   * Checks if the user `dappnode`'s password in the host machine
   * is NOT the insecure default set at installation time.
   * It does so by checking if the current salt is `insecur3`
   *
   * - This check will be run every time this node app is started
   *   - If the password is SECURE it will NOT be run anymore
   *     and this call will return true always
   *   - If the password is INSECURE this check will be run every
   *     time the admin requests it (on page load)
   *
   * @returns true = is secure / false = is not
   */
  passwordIsSecure: () => Promise<boolean>;

  /**
   * Shuts down the host machine via the DBus socket
   */
  poweroffHost: () => Promise<void>;

  /**
   * Returns ports to open
   */
  portsToOpenGet: () => Promise<PortToOpen[]>;

  /**
   * Returns ports status from upnp scanning
   */
  portsUpnpStatusGet: (kwargs: {
    portsToOpen: PortToOpen[];
  }) => Promise<UpnpTablePortStatus[]>;

  /**
   * Returns ports status from API scanning
   */
  portsApiStatusGet: (kwargs: {
    portsToOpen: PortToOpen[];
  }) => Promise<ApiTablePortStatus[]>;

  /**
   * Reboots the host machine via the DBus socket
   */
  rebootHost: () => Promise<void>;

  /**
   * Receives an encrypted message containing the seed phrase of
   * 12 word mnemonic ethereum account. The extra layer of encryption
   * slightly increases the security of the exchange while the WAMP
   * module works over HTTP.
   * @param seedPhraseEncrypted tweetnacl base64 box with nonce
   */
  seedPhraseSet: (kwargs: { seedPhraseEncrypted: string }) => Promise<void>;

  /**
   * Sets the static IP
   * @param staticIp New static IP. To enable: "85.84.83.82", disable: ""
   */
  setStaticIp: (kwargs: { staticIp: string }) => Promise<void>;

  statsCpuGet: () => Promise<HostStatCpu>;

  statsMemoryGet: () => Promise<HostStatMemory>;

  statsDiskGet: () => Promise<HostStatDisk>;

  /**
   * Gets bot telegram status
   */
  telegramStatusGet: () => Promise<boolean>;

  /**
   * Sets the status of the telegram bot
   * @param telegramStatus new status of the bot
   */
  telegramStatusSet: (kwarg: { telegramStatus: boolean }) => Promise<void>;

  /**
   * Gets bot telegram token
   */
  telegramTokenGet: () => Promise<string | null>;

  /**
   * Sets the telegram token
   * @param telegramToken new bot token
   */
  telegramTokenSet: (kwarg: { telegramToken: string }) => Promise<void>;

  /**
   * Return the current SSH port from sshd
   */
  sshPortGet: () => Promise<number>;
  /**
   * Change the SHH port on the DAppNode host
   */
  sshPortSet: (kwargs: { port: number }) => Promise<void>;
  /**
   * Disable or enable SSH on the DAppNode host
   */
  sshStatusSet: (kwargs: { status: ShhStatus }) => Promise<void>;
  /**
   * Check if SSH is enabled of disabled in the DAppNode host
   */
  sshStatusGet: () => Promise<ShhStatus>;

  /**
   * Returns the current DAppNode system info
   */
  systemInfoGet: () => Promise<SystemInfo>;

  /**
   * Executes security updates on host
   */
  runHostSecurityUpdates: () => Promise<string>;

  /**
   * Attemps to open ports using UPnP
   */
  natRenewalEnable: (kwargs: { enableNatRenewal: boolean }) => Promise<void>;

  /** Returns nat renewal status */
  natRenewalIsEnabled: () => Promise<boolean>;

  /**
   * Removes a docker volume by name
   * @param name Full volume name: "bitcoindnpdappnodeeth_bitcoin_data"
   */
  volumeRemove: (kwargs: { name: string }) => Promise<void>;

  /**
   * Returns volume data
   */
  volumesGet: () => Promise<VolumeData[]>;

  /**
   * Returns public Ip in real time
   */
  ipPublicGet: () => Promise<PublicIpResponse>;

  /**Get wifi credentials */
  wifiCredentialsGet(): Promise<CurrentWifiCredentials>;

  /** Get wifi report */
  wifiReportGet(): Promise<WifiReport>;

  /** Add a device to Wireguard DNP ENVs */
  wireguardDeviceAdd(device: string): Promise<void>;

  /** Remove a device from Wireguard DNP ENVs */
  wireguardDeviceRemove(device: string): Promise<void>;

  /** Get credentials for a single Wireguard device */
  wireguardDeviceGet(device: string): Promise<WireguardDeviceCredentials>;

  /** Get URLs to a single Wireguard credentials */
  wireguardDevicesGet(): Promise<string[]>;
}

interface RouteData {
  /**
   * If true, all actions will be registered as userActionLogs
   * Also, each action will be logged at an INFO level
   */
  log?: boolean;
}

export const routesData: { [P in keyof Routes]: RouteData } = {
  autoUpdateDataGet: {},
  autoUpdateSettingsEdit: { log: true },
  backupGet: {},
  backupRestore: { log: true },
  chainDataGet: {},
  changeIpfsTimeout: { log: true },
  cleanCache: {},
  cleanDb: {},
  copyFileTo: { log: true },
  dappnodeWebNameSet: { log: true },
  deviceAdd: { log: true },
  deviceAdminToggle: { log: true },
  deviceCredentialsGet: {},
  deviceRemove: { log: true },
  deviceReset: { log: true },
  devicePasswordGet: {},
  devicePasswordHas: {},
  devicesList: {},
  diagnose: {},
  dockerComposeUpdate: { log: true },
  dockerComposeUpdateCheck: {},
  dockerEngineUpdate: { log: true },
  dockerEngineUpdateCheck: {},
  ethClientFallbackSet: { log: true },
  ethClientTargetSet: { log: true },
  fetchCoreUpdateData: {},
  fetchDirectory: {},
  fetchDnpRequest: {},
  getUserActionLogs: {},
  httpsPortalMappingAdd: { log: true },
  httpsPortalMappingRemove: { log: true },
  httpsPortalMappingsGet: {},
  httpsPortalMappingsRecreate: {},
  httpsPortalExposableServicesGet: {},
  ipfsTest: {},
  localProxyingEnableDisable: { log: true },
  localProxyingStatusGet: {},
  mountpointsGet: {},
  newFeatureStatusSet: {},
  notificationsGet: {},
  notificationsRemove: {},
  notificationsTest: {},
  packageInstall: { log: true },
  packageGet: {},
  packagesGet: {},
  packageGettingStartedToggle: {},
  packageLog: {},
  packageRemove: { log: true },
  packageRestart: { log: true },
  packageRestartVolumes: { log: true },
  packageSetEnvironment: { log: true },
  packageSetPortMappings: { log: true },
  packageStartStop: { log: true },
  passwordChange: { log: true },
  passwordIsSecure: {},
  poweroffHost: { log: true },
  portsToOpenGet: {},
  portsUpnpStatusGet: {},
  portsApiStatusGet: {},
  rebootHost: { log: true },
  telegramStatusGet: {},
  telegramStatusSet: { log: true },
  telegramTokenGet: {},
  telegramTokenSet: { log: true },
  seedPhraseSet: { log: true },
  setStaticIp: { log: true },
  statsCpuGet: {},
  statsDiskGet: {},
  statsMemoryGet: {},
  sshPortGet: {},
  sshPortSet: { log: true },
  sshStatusGet: {},
  sshStatusSet: { log: true },
  systemInfoGet: {},
  runHostSecurityUpdates: {},
  natRenewalEnable: {},
  natRenewalIsEnabled: {},
  volumeRemove: { log: true },
  volumesGet: {},
  ipPublicGet: {},
  wifiCredentialsGet: {},
  wifiReportGet: {},
  wireguardDeviceAdd: { log: true },
  wireguardDeviceRemove: { log: true },
  wireguardDeviceGet: {},
  wireguardDevicesGet: {}
};

// DO NOT REMOVE
// Enforces that each route is a function that returns a promise
export type RoutesArguments = { [K in keyof Routes]: Parameters<Routes[K]> };
export type RoutesReturn = {
  [K in keyof Routes]: ReplaceVoidWithNull<ResolvedType<Routes[K]>>;
};

/**
 * Returns the return resolved type of a function type
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type ResolvedType<T extends (...args: any) => Promise<any>> = T extends (
  ...args: any
) => Promise<infer R>
  ? R
  : never;
/* eslint-disable @typescript-eslint/no-explicit-any */

export type ReplaceVoidWithNull<T> = T extends void ? null : T;
