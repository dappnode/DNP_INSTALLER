// AUTH, SESSION types
export interface LoginStatusReturn {
  username: string;
  isAdmin: boolean;
}

// HTTPS portal mappings

export interface HttpsPortalMapping {
  fromSubdomain: string;
  dnpName: string;
  serviceName: string;
  port: number;
}

export interface ExposableServiceInfo extends HttpsPortalMapping {
  /** Example: `"Geth JSON RPC"` */
  name: string;
  /** Example: `"JSON RPC endpoint for Geth mainnet"` */
  description: string;
}

export interface ExposableServiceManifestInfo {
  name: string;
  description?: string;
  serviceName?: string;
  fromSubdomain?: string;
  port: number;
}

export interface ExposableServiceMapping extends ExposableServiceInfo {
  exposed: boolean;
}

// Wifi

export interface WifiReport {
  info: string;
  report?: {
    lastLog: string;
    exitCode: number | null;
  };
}

export interface CurrentWifiCredentials {
  ssid: string;
  password: string;
}

// Wireguard

export interface WireguardDeviceCredentials {
  /**
   * Raw config file in plaintext
   * ```txt
   * [Interface]
   * Address = 172.34.1.2
   * PrivateKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
   * ListenPort = 51820
   * DNS = 172.33.1.2
   *
   * [Peer]
   * PublicKey = AAAAABBBBBAAAAABBBBBAAAAABBBBBAAAAABBBBBAAA=
   * Endpoint = aaaabbbbaaaabbbb.dyndns.dappnode.io:51820
   * AllowedIPs = 172.33.0.0/16
   * ```
   */
  configRemote: string;
  configLocal: string;
}

// SSH types

export type ShhStatus = "enabled" | "disabled";

// Device types

export type VpnDeviceAdminPassword =
  | { hasChangedPassword: true }
  | { hasChangedPassword: false; password: string };

export type VpnDevice =
  | { id: string; admin: false }
  | ({ id: string; admin: true } & VpnDeviceAdminPassword);

export type VpnDeviceCredentials = VpnDevice & {
  url: string;
};

// Do not re-export variables since it will conflict with DNP_ADMIN's rule of 'isolatedModules'

// ==============
// ==============
// ADMIN
// ==============
// ==============

/**
 * [NOTE] Items MUST be ordered by the directory order
 * - featured #0
 * - featured #1
 * - whitelisted #0
 * - whitelisted #1
 * - whitelisted #2
 * - other #0
 * - other #1
 *
 * [NOTE] Search result will never show up in the directory listing,
 * they will appear in a future dropdown under the searchbar
 */
// Information immediatelly available in the directory smart contract
interface DirectoryItemBasic {
  index: number;
  name: string;
  whitelisted: boolean;
  isFeatured: boolean;
}
export interface DirectoryItemOk extends DirectoryItemBasic {
  status: "ok";
  description: string; // = metadata.shortDescription || metadata.description
  avatarUrl: string; // Must be URL to a resource in a DAPPMANAGER API
  isInstalled: boolean; // Show "UPDATE"
  isUpdated: boolean; // Show "UPDATED"
  featuredStyle?: {
    featuredBackground?: string;
    featuredColor?: string;
    featuredAvatarFilter?: string;
  };
  categories: string[];
}

export interface DirectoryItemError extends DirectoryItemBasic {
  status: "error";
  message: string;
}
export type DirectoryItem = DirectoryItemOk | DirectoryItemError;

export interface RequestStatus {
  loading?: boolean;
  error?: string;
  success?: boolean;
}

export interface SetupWizard {
  version: "2";
  fields: SetupWizardField[];
}

export interface SetupWizardField {
  id: string;
  target?: UserSettingTarget; // Allow form questions
  // UI
  title: string;
  description: string;
  secret?: boolean;
  // Validation options
  pattern?: string;
  patternErrorMessage?: string;
  enum?: string[];
  required?: boolean;
  if?: SetupSchema | { [id: string]: SetupSchema };
}

export type UserSettingTarget =
  | { type: "environment"; name: string; service?: string[] | string }
  | { type: "portMapping"; containerPort: string; service?: string }
  | { type: "namedVolumeMountpoint"; volumeName: string }
  | { type: "allNamedVolumesMountpoint" }
  | { type: "fileUpload"; path: string; service?: string };

export interface SetupWizardAllDnps {
  [dnpName: string]: SetupWizard;
}

export interface SetupTarget {
  [propId: string]: UserSettingTarget;
}

export interface SetupSchemaAllDnps {
  [dnpName: string]: SetupSchema;
}

export interface SetupTargetAllDnps {
  [dnpName: string]: SetupTarget;
}

export interface SetupUiJsonAllDnps {
  [dnpName: string]: SetupUiJson;
}

// Setup schema types

export type SetupSchema = {
  type?: string;
  title?: string;
  description?: string;
  default?: string;
  enum?: string[];
  pattern?: string;
  customErrors?: { pattern?: string };
  required?: string[];
  properties?: {
    [k: string]: any;
  };
  dependencies?: {
    [k: string]: any;
  };
  oneOf?: any[];
};
export interface SetupUiJson {
  [propId: string]: {
    "ui:widget"?: "password";
  };
  // SetupUiJson is a legacy non-critical type that needs to exist and be
  // different from any so await Promise.all([ ... ]) typing works
  /* eslint-disable @typescript-eslint/ban-ts-ignore */
  // @ts-ignore
  "ui:order"?: string[];
}

// Settings must include the previous user settings

export interface UserSettings {
  environment?: {
    [serviceName: string]: {
      /**
       * ```js
       * { MODE: "VALUE_SET_BEFORE" }
       * ```
       */
      [envName: string]: string; // Env value
    };
  };
  portMappings?: {
    [serviceName: string]: {
      /**
       * ```js
       * { "8443": "8443", "8443/udp": "8443" },
       * ```
       */
      [containerPortAndType: string]: string; // Host port
    };
  };
  namedVolumeMountpoints?: {
    /**
     * ```js
     * { data: "/media/usb0" }
     * ```
     */
    [volumeName: string]: string; // Host absolute path to mountpoint
  };
  allNamedVolumeMountpoint?: string; // mountpoint
  fileUploads?: {
    [serviceName: string]: {
      /**
       * ```js
       * { "/usr/src/app/config.json": "data:text/plain;base64,SGVsbG8sIFdvcmxkIQ%3D%3D" }
       * ```
       */
      [containerPath: string]: string; // dataURL
    };
  };
  domainAlias?: string[]; // ["fullnode", "my-custom-name"]
  // ### DEPRECATED Kept for legacy compatibility
  legacyBindVolumes?: {
    [serviceName: string]: {
      [volumeName: string]: string; // Host vol name to host bind absolute path
    };
  };
}

export interface UserSettingsAllDnps {
  [dnpName: string]: UserSettings;
}

export interface DisclaimerAllDnps {
  [dnpName: string]: string;
}

export interface CompatibleDnps {
  [dnpName: string]: { from?: string; to: string };
  // "bitcoin.dnp.dappnode.eth": { from: "0.2.5"; to: "0.2.6" };
  // "ln.dnp.dappnode.eth": { from: null; to: "0.2.2" };
}

export interface RequestedDnp {
  dnpName: string; // "bitcoin.dnp.dappnode.eth"
  reqVersion: string; // origin or semver: "/ipfs/Qm611" | "0.2.3"
  semVersion: string; // Always a semver: "0.2.3"
  origin?: string; // "/ipfs/Qm"
  avatarUrl: string; // "http://dappmanager.dappnode/avatar/Qm7763518d4";
  // Setup
  setupWizard?: SetupWizardAllDnps;
  settings: UserSettingsAllDnps; // MUST include the previous user settings
  // Additional data
  imageSize: number;
  isUpdated: boolean;
  isInstalled: boolean;
  // Decoupled metadata
  metadata: PackageReleaseMetadata;
  specialPermissions: SpecialPermissionAllDnps;
  // Request status and dependencies
  request: {
    compatible: {
      requiresCoreUpdate: boolean;
      resolving: boolean;
      isCompatible: boolean; // false;
      error: string; // "LN requires incompatible dependency";
      dnps: CompatibleDnps;
    };
    available: {
      isAvailable: boolean; // false;
      message: string; // "LN image not available";
    };
  };
}

export interface GrafanaDashboard {
  uid: string;
}

export interface PrometheusTarget {
  targets: string[];
  labels?: {
    job?: string;
    group?: string;
  };
}

// Installing types

export interface ProgressLogs {
  [dnpName: string]: string;
}

export interface ProgressLogsByDnp {
  [dnpName: string]: ProgressLogs;
}

// ==============
// ==============
// DAPPMANAGER
// ==============
// ==============

export enum PortProtocol {
  UDP = "UDP",
  TCP = "TCP"
}

interface BasicPortMapping {
  host?: number;
  container: number;
  protocol: PortProtocol;
}

export interface PortMapping extends BasicPortMapping {
  ephemeral?: boolean;
  ip?: string;
  deletable?: boolean;
}

export interface PackagePort {
  portNumber: number;
  protocol: PortProtocol;
}

export interface UpnpPortMapping {
  protocol: PortProtocol;
  exPort: string;
  inPort: string;
  ip: string;
}

export interface TablePortsStatus {
  port: number;
  protocol: PortProtocol;
  serviceName: string;
  dnpName: string;
  message?: string;
}

export interface ApiTablePortStatus extends TablePortsStatus {
  status: ApiStatus;
}

export interface UpnpTablePortStatus extends TablePortsStatus {
  status: UpnpStatus;
}

// ApiStatus data structure is different than UpnpStatus because we want to attach an error message
export type ApiStatus =
  | "open"
  | "closed"
  | "unknown" // port not found or protocol UDP
  | "error"; // error from/fetching the API

// unknown => port not found. not-available => UPnP disabled or not recognized
export type UpnpStatus = "open" | "closed";

export interface VolumeMapping {
  host: string; // path
  container: string; // dest
  name?: string;
}

export interface Dependencies {
  [dependencyName: string]: string;
}

export type ContainerState =
  | "created" // created A container that has been created(e.g.with docker create) but not started
  | "restarting" // restarting A container that is in the process of being restarted
  | "running" // running A currently running container
  | "paused" // paused A container whose processes have been paused
  | "exited" // exited A container that ran and completed("stopped" in other contexts, although a created container is technically also "stopped")
  | "dead"; // dead A container that the daemon tried and failed to stop(usually due to a busy device or resource used by the container)

export type ChainDriver =
  | "bitcoin"
  | "ethereum"
  | "ethereum2-beacon-chain-prysm"
  | "monero";
export const chainDrivers: ChainDriver[] = [
  "bitcoin",
  "ethereum",
  "ethereum2-beacon-chain-prysm",
  "monero"
];

/**
 * Type mapping of a package container labels
 * NOTE: Treat as unsafe input, labels may not exist or have wrong formatting
 */
export interface ContainerLabelTypes {
  "dappnode.dnp.dnpName": string;
  "dappnode.dnp.version": string;
  "dappnode.dnp.serviceName": string;
  "dappnode.dnp.instanceName": string;
  "dappnode.dnp.dependencies": Dependencies;
  "dappnode.dnp.avatar": string;
  "dappnode.dnp.origin": string;
  "dappnode.dnp.chain": ChainDriver;
  "dappnode.dnp.isCore": boolean;
  "dappnode.dnp.isMain": boolean;
  "dappnode.dnp.dockerTimeout": number;
  "dappnode.dnp.default.environment": string[];
  "dappnode.dnp.default.ports": string[];
  "dappnode.dnp.default.volumes": string[];
}

export interface PackageContainer {
  /**
   * Docker container ID
   * ```
   * "3edc051920c61e02ff9c42cf35caf4f48f693d65f44d6652de29e9024f051405"
   * ```
   */
  containerId: string;
  /**
   * Docker container name
   * ```
   * "DAppNodeCore-mypackage.dnp.dappnode.eth"
   * ```
   */
  containerName: string;
  /**
   * ENS domain name of this container's package
   * ```
   * "mypackage.dnp.dappnode.eth"
   * ```
   */
  dnpName: string;
  /**
   * Docker compose service name of this container, as declared in its package docker-compose
   * ```
   * "frontend"
   * ```
   */
  serviceName: string;
  /**
   * Name given by the user when installing an instance of a package
   * ```
   * "my-package-test-instance"
   * ```
   */
  instanceName: string;
  /**
   * Semantic version of this container's package
   * ```
   * "0.1.0"
   * ```
   */
  version: string;

  // Docker data
  created: number;
  image: string;
  ip?: string; // IP of the DNP in the dappnode network
  state: ContainerState;
  running: boolean;
  exitCode: number | null;
  ports: PortMapping[];
  volumes: VolumeMapping[];
  networks: { name: string; ip: string }[];

  // DAppNode package data
  isDnp: boolean;
  isCore: boolean;
  defaultEnvironment?: PackageEnvs;
  defaultPorts?: PortMapping[];
  defaultVolumes?: VolumeMapping[];
  dependencies: Dependencies;
  avatarUrl: string;
  origin?: string;
  chain?: ChainDriver;
  domainAlias?: string[];
  canBeFullnode?: boolean;
  isMain?: boolean;
  dockerTimeout?: number;
  // Note: environment is only accessible doing a container inspect or reading the compose
  // envs?: PackageEnvs;
}

export interface InstalledPackageDataApiReturn extends InstalledPackageData {
  updateAvailable: UpdateAvailable | null;
}

export type InstalledPackageData = Pick<
  PackageContainer,
  | "dnpName"
  | "instanceName"
  | "version"
  | "isDnp"
  | "isCore"
  | "dependencies"
  | "avatarUrl"
  | "origin"
  | "chain"
  | "domainAlias"
  | "canBeFullnode"
> & {
  containers: PackageContainer[];
};

export interface UpdateAvailable {
  newVersion: string;
  upstreamVersion?: string;
}

export interface InstalledPackageDetailData extends InstalledPackageData {
  setupWizard?: SetupWizard;
  userSettings?: UserSettings;
  gettingStarted?: string;
  gettingStartedShow?: boolean;
  backup?: PackageBackup[];
  /**
   * Checks if there are volumes to be removed on this DNP
   */
  areThereVolumesToRemove: boolean;
  dependantsOf: string[];
  updateAvailable: UpdateAvailable | null;
  notRemovable: boolean;
  // Non-indexed data
  manifest?: Manifest;
}

export interface PackageEnvs {
  [envName: string]: string;
}

export interface ManifestUpdateAlert {
  from: string;
  to: string;
  message: string;
}

interface ManifestImage {
  hash: string;
  size: number;
  path: string;
  volumes?: string[];
  ports?: string[];
  environment?: string[];
  /** FORBIDDEN FEATURE */
  external_vol?: string[];
  restart?: string;
  privileged?: boolean;
  cap_add?: string[];
  cap_drop?: string[];
  devices?: string[];
  subnet?: string;
  ipv4_address?: string;
  network_mode?: string;
  command?: string;
  labels?: string[];
}
export interface Manifest extends PackageReleaseMetadata {
  name: string;
  version: string;
  avatar?: string;
}

export interface ManifestWithImage extends Manifest {
  image: ManifestImage;
}

export interface ComposeService {
  cap_add?: string[];
  cap_drop?: string[];
  command?: string;
  container_name: string; // "DAppNodeCore-dappmanager.dnp.dappnode.eth";
  devices?: string[];
  dns?: string; // "172.33.1.2";
  entrypoint?: string;
  env_file?: string[];
  environment?: PackageEnvs | string[];
  expose?: string[];
  extra_hosts?: string[];
  image: string; // "dappmanager.dnp.dappnode.eth:0.2.6";
  // ipv4_address: "172.33.1.7";
  labels?: { [labelName: string]: string };
  logging?: {
    driver?: string;
    options?: {
      [optName: string]: string | number | null;
    };
  };
  network_mode?: string;
  networks?: ComposeServiceNetworks;
  ports?: string[];
  privileged?: boolean;
  restart?: string; // "unless-stopped";
  stop_grace_period?: string;
  stop_signal?: string;
  user?: string;
  volumes?: string[]; // ["dappmanagerdnpdappnodeeth_data:/usr/src/app/dnp_repo/"];
  working_dir?: string;
}

export interface ComposeServiceNetwork {
  ipv4_address?: string;
  aliases?: string[];
}

export type ComposeServiceNetworks = string[] | ComposeServiceNetworksObj;

export type ComposeServiceNetworksObj = {
  [networkName: string]: ComposeServiceNetwork;
};

export interface ComposeNetwork {
  external?: boolean;
  driver?: string; // "bridge";
  ipam?: {
    config: {
      /** subnet: "172.33.0.0/16" */
      subnet: string;
    }[];
  };
  name?: string;
}

export interface ComposeNetworks {
  /** networkName: "dncore_network" */
  [networkName: string]: ComposeNetwork | null;
}

export interface ComposeVolume {
  // FORBIDDEN
  // external?: boolean | { name: string }; // name: "dncore_ipfsdnpdappnodeeth_data"
  // NOT allowed to user, only used by DAppNode internally (if any)
  external?: boolean;
  name?: string; // Volumes can only be declared locally or be external
  driver?: string; // Dangerous
  driver_opts?:
    | { type: "none"; device: string; o: "bind" }
    | { [driverOptName: string]: string }; // driver_opts are passed down to whatever driver is being used, there's. No verification on docker's part nor detailed documentation
  labels?: { [labelName: string]: string }; // User should not use this feature
}

export interface ComposeVolumes {
  /** volumeName: "dncore_ipfsdnpdappnodeeth_data" */
  [volumeName: string]: ComposeVolume | null;
}

export interface Compose {
  version: string; // "3.5"
  /** dnpName: "dappmanager.dnp.dappnode.eth" */
  services: { [dnpName: string]: ComposeService };
  networks?: ComposeNetworks;
  volumes?: ComposeVolumes;
}

export interface PackagePort {
  portNumber: number;
  protocol: PortProtocol;
}

export interface PortToOpen extends PackagePort {
  serviceName: string;
  dnpName: string;
}

export interface PackageRequest {
  name: string;
  ver: string;
  req?: string;
}

export interface DappnodeParams {
  DNCORE_DIR: string;
  REPO_DIR: string;
}

export interface PackageBackup {
  name: string;
  path: string;
  service?: string;
}

export type NotificationType = "danger" | "warning" | "success" | "info";
export interface PackageNotification {
  id: string; // "notification-id"
  type: NotificationType;
  title: string; // "Some notification"
  body: string; // "Some text about notification"
}
export interface PackageNotificationDb extends PackageNotification {
  timestamp: number;
  viewed: boolean;
}

export type UpdateType = "major" | "minor" | "patch" | null;

export type DirectoryDnpStatus = "Deleted" | "Active" | "Developing";
export interface DirectoryDnp {
  name: string;
  status: number;
  statusName: DirectoryDnpStatus;
  position: number;
  directoryId: number;
  isFeatured: boolean;
  featuredIndex: number;
  manifest?: Manifest;
  avatar?: string;
}

export interface ChainData {
  dnpName: string; // "geth.dnp.dappnode.eth"
  name?: string; // Optional pretty name: "Geth (light client)"
  syncing: boolean; // if chain is syncing
  error: boolean; // If there was an error retrieving state
  message: string; // "Blocks synced: 543000 / 654000"
  help?: string; // External link to show as help if needed: "http://geth.help"
  progress?: number; // 0.83027522935
}

export interface ProgressLog {
  id: string; // "ln.dnp.dappnode.eth@/ipfs/Qmabcdf", overall log id(to bundle multiple logs)
  dnpName: string; // "bitcoin.dnp.dappnode.eth", dnpName the log is referring to
  message: string; // "Downloading 75%", log message
  clear?: boolean; // to trigger the UI to clear the all logs of this id
}

export interface UserActionLog {
  level: "info" | "error";
  timestamp: number; // 1591095463341
  event: string; // "packageInstall.dnp.dappnode.eth"
  message: string; // "Successfully install DNP", { string } Returned message from the call function*
  args: any[]; // { id: "dnpName" }, { object }
  result?: any; // If success: { data: "contents" }, {*} Returned result from the call function
  stack?: string; // If error: e.stack { string }
  // Additional properties to compress repeated logs (mainly errors)
  count?: number;
}

/**
 * Auto-update helper types
 */

/**
 * Sample:
 * ```
 * settings = {
 *   "system-packages": { enabled: true }
 *   "my-packages": { enabled: true }
 *   "bitcoin.dnp.dappnode.eth": { enabled: false }
 * }
 * ```
 */
export interface AutoUpdateSettings {
  [dnpNameOrGroupId: string]: { enabled: boolean };
}

export interface AutoUpdateRegistryEntry {
  updated?: number;
  successful?: boolean;
}
export interface AutoUpdateRegistryDnp {
  [version: string]: AutoUpdateRegistryEntry;
}

/**
 * Sample:
 * ```
 * registry = {
 *   "core.dnp.dappnode.eth": {
 *     "0.2.4": { updated: 1563304834738, successful: true },
 *     "0.2.5": { updated: 1563304834738, successful: false }
 *   }, ...
 * }
 * ```
 */
export interface AutoUpdateRegistry {
  [dnpName: string]: AutoUpdateRegistryDnp;
}

export interface AutoUpdatePendingEntry {
  version?: string;
  firstSeen?: number;
  scheduledUpdate?: number;
  completedDelay?: boolean;
  errorMessage?: string;
}

/**
 * Sample:
 * ```
 * pending = {
 *   "core.dnp.dappnode.eth": {
 *     version: "0.2.4",
 *     firstSeen: 1563218436285,
 *     scheduledUpdate: 1563304834738,
 *     completedDelay: true
 *   },
 * ... },
 * ```
 */
export interface AutoUpdatePending {
  [dnpName: string]: AutoUpdatePendingEntry;
}

export interface AutoUpdateFeedback {
  inQueue?: boolean;
  manuallyUpdated?: boolean;
  scheduled?: number;
  updated?: number;
  errorMessage?: string;
}

/**
 * Sample:
 * ```
 * dnpsToShow = [{
 *   id: "system-packages",
 *   displayName: "System packages",
 *   enabled: true,
 *   feedback: {
 *     updated: 15363818244,
 *     manuallyUpdated: true,
 *     inQueue: true,
 *     scheduled: 15363818244
 *   }
 * }, ... ]
 * ```
 */
export interface AutoUpdateDataDnpView {
  id: string;
  displayName: string;
  enabled: boolean;
  feedback: AutoUpdateFeedback;
}

/**
 * Full auto-update data:
 * - settings: If auto-updates are enabled for a specific DNP or DNPs
 * - registry: List of executed auto-updates
 * - pending: Pending auto-update per DNP, can be already executed
 * - dnpsToShow: Parsed data to be shown in the UI
 */
export interface AutoUpdateDataView {
  settings: AutoUpdateSettings;
  registry: AutoUpdateRegistry;
  pending: AutoUpdatePending;
  dnpsToShow: AutoUpdateDataDnpView[];
}

/**
 * For fetch core update data
 */

export interface DependencyListItem {
  name: string;
  from?: string;
  to: string;
  warningOnInstall?: string;
}

export interface CoreUpdateDataNotAvailable {
  available: false;
}
export interface CoreUpdateDataAvailable {
  available: true;
  type?: string;
  packages: DependencyListItem[];
  changelog: string;
  updateAlerts: ManifestUpdateAlert[];
  versionId: string;
  coreVersion: string;
}
export type CoreUpdateData =
  | CoreUpdateDataNotAvailable
  | CoreUpdateDataAvailable;

/**
 * Releases types
 */

export interface ApmVersion {
  version: string;
  contentUri: string;
}

export interface PackageVersionData {
  version?: string;
  branch?: string;
  commit?: string;
}

export interface HostDiagnoseItem {
  name: string;
  data: string;
}

export type DistributedFileSource = "ipfs" | "swarm";
export interface DistributedFile {
  hash: string;
  source: DistributedFileSource;
  size: number;
}

export interface ReleaseWarnings {
  /**
   * If a core package does not come from the DAppNode Package APM registry
   */
  unverifiedCore?: boolean;
  /**
   * If the requested name does not match the manifest name
   */
  requestNameMismatch?: boolean;
}

export interface SpecialPermission {
  name: string; // "Short description",
  details: string; // "Long description of the capabilitites"
  serviceName?: string; // Extra data
}

export interface SpecialPermissionAllDnps {
  [dnpName: string]: SpecialPermission[];
}

export interface PackageRelease {
  dnpName: string;
  reqVersion: string; // origin or semver: "/ipfs/Qm611" | "0.2.3"
  semVersion: string; // Always a semver: "0.2.3"
  // File info for downloads
  imageFile: DistributedFile;
  avatarFile?: DistributedFile;
  // Data for release processing
  metadata: PackageReleaseMetadata;
  compose: Compose;
  // Aditional
  warnings: ReleaseWarnings;
  origin?: string;
  isCore: boolean;
}

export type InstallPackageDataPaths = Pick<
  InstallPackageData,
  | "dnpName"
  | "semVersion"
  | "composePath"
  | "composeBackupPath"
  | "manifestPath"
  | "manifestBackupPath"
  | "imagePath"
  | "isUpdate"
  | "dockerTimeout"
  | "containersStatus"
>;

export interface InstallPackageData extends PackageRelease {
  isUpdate: boolean;
  // Paths
  imagePath: string;
  composePath: string;
  composeBackupPath: string;
  manifestPath: string;
  manifestBackupPath: string;
  // Data to write
  compose: Compose;
  // User settings to be applied after running
  fileUploads?: { [serviceName: string]: { [containerPath: string]: string } };
  dockerTimeout: number | undefined;
  containersStatus: ContainersStatus;
}

export interface ContainersStatus {
  [serviceName: string]: ContainerStatus;
}

export interface ContainerStatus {
  targetStatus: "stopped" | "running";
  dockerTimeout: number | undefined;
}

// Must be in-sync with SDK types
export type Architecture = "linux/amd64" | "linux/arm64";
export const architectures: Architecture[] = ["linux/amd64", "linux/arm64"];
export const defaultArch = "linux/amd64";

export interface PackageReleaseMetadata {
  name: string;
  version: string;
  upstreamVersion?: string;
  shortDescription?: string;
  description?: string;

  type?: "service" | "library" | "dncore";
  chain?: ChainDriver;
  mainService?: string;
  /** "15min" | 3600 */
  dockerTimeout?: string;
  dependencies?: Dependencies;

  requirements?: {
    minimumDappnodeVersion: string;
  };
  globalEnvs?: {
    all?: boolean;
  };
  architectures?: Architecture[];

  // Safety properties to solve problematic updates
  runOrder?: string[];
  restartCommand?: string;
  restartLaunchCommand?: string;

  backup?: PackageBackup[];
  changelog?: string;
  warnings?: {
    onInstall?: string;
    onUpdate?: string;
    onReset?: string;
    onRemove?: string;
  };
  updateAlerts?: ManifestUpdateAlert[];
  disclaimer?: {
    message: string;
  };
  gettingStarted?: string;
  style?: {
    featuredBackground?: string;
    featuredColor?: string;
    featuredAvatarFilter?: string;
  };
  setupWizard?: SetupWizard;
  // Legacy setupWizardv1
  setupSchema?: SetupSchema;
  setupTarget?: SetupTarget;
  setupUiJson?: SetupUiJson;

  // Monitoring
  grafanaDashboards?: GrafanaDashboard[];
  prometheusTargets?: PrometheusTarget[];

  // Network metadata
  exposable?: ExposableServiceManifestInfo[];

  author?: string;
  contributors?: string[];
  categories?: string[];
  keywords?: string[];
  links?: {
    homepage?: string;
    ui?: string;
    api?: string;
    gateway?: string;
    [linkName: string]: string | undefined;
  };
  repository?: {
    type?: string;
    url?: string;
    directory?: string;
  };
  bugs?: {
    url: string;
  };
  license?: string;
}

export interface PackageReleaseImageData {
  // Mergable properties (editable)
  volumes?: string[];
  ports?: string[];
  environment?: string[];
  // Non-mergable properties
  restart?: string;
  privileged?: boolean;
  cap_add?: string[];
  cap_drop?: string[];
  devices?: string[];
  subnet?: string;
  ipv4_address?: string;
  network_mode?: string;
  command?: string;
  labels?: string[];
}

// An array of mountpoints MUST include one with the host (mountpoint = "")
export interface MountpointData {
  mountpoint: string; // "/media/usb0", mountpoint = "" means host (default)
  use: string; // "89%"
  used: number; // 198642520
  total: number; // 235782040
  free: number; // 25092776
  vendor: string; // "ATA", "SanDisk"
  model: string; // "CT500MX500SSD4", "Ultra_USB_3.0"
}

export interface HostInfoScript {
  dockerComposeVersion: string;
  dockerServerVersion: string;
  dockerCliVersion: string;
  os: string;
  versionCodename: string;
  architecture: string;
  kernel: string;
}

export interface AvahiDaemonStatus {
  isAvahiRunning: boolean;
  isAvahiEnabled: boolean;
  avahiResolves: boolean;
}

export type LocalProxyingStatus =
  | "running"
  | "stopped"
  | "crashed"
  | "https missing";

export interface DockerVersionsScript {
  dockerComposeVersion: string;
  dockerServerVersion: string;
}

export interface DockerUpdateStatus {
  updated: boolean;
  version: string;
  requirements: UpdateRequirement[];
}

export interface UpdateRequirement {
  title: string;
  isFulFilled: boolean;
  message: string;
}

export interface VolumeOwnershipData {
  name: string; // "gethdnpdappnodeeth_geth", Actual name to call delete on
  owner?: string; // "geth.dnp.dappnode.eth", Actual name of the owner
}

export interface VolumeData extends VolumeOwnershipData {
  internalName?: string; // "data", Volume name as referenced inside the compose
  createdAt: number; // 1569346006000,
  size?: number; // 161254123,
  refCount?: number; // 2
  isOrphan: boolean; // if no container is using it
  mountpoint: string; // "/dev1/data",
  // Mountpoint extended data
  fileSystem?: MountpointData;
}

/**
 * Eth provider / client types
 * Manage the Ethereum multi-client setup
 */
export type EthClientTargetPackage =
  | "geth-light"
  | "geth"
  | "openethereum"
  | "nethermind";
export type EthClientTarget = EthClientTargetPackage | "remote";
export const ethClientTargets: EthClientTarget[] = [
  "remote",
  "geth-light",
  "geth",
  "openethereum",
  "nethermind"
];

/**
 * If the DAPPMANAGER should use a eth remote node in cases of error syncing
 */
export type EthClientFallback = "on" | "off";

export type EthClientStatus = EthClientStatusOk | EthClientStatusError;

export type EthClientStatusOk =
  // All okay, client is functional
  { ok: true; url: string; dnpName: string };

export type EthClientStatusError =
  // Unexpected error
  | { ok: false; code: "UNKNOWN_ERROR"; error: ErrorSerialized }
  // State is not correct, node is not synced but eth_syncing did not picked it up
  | { ok: false; code: "STATE_NOT_SYNCED" }
  // APM state call failed, syncing call succeeded and is not working
  // = Likely an error related to fetching state content
  | { ok: false; code: "STATE_CALL_ERROR"; error: ErrorSerialized }
  // State call failed and eth_syncing returned true
  | { ok: false; code: "IS_SYNCING" }
  // syncing call failed, but the client is running
  // ???, a connection error?
  | { ok: false; code: "NOT_AVAILABLE"; error: ErrorSerialized }
  // NOT Expected: Package's container is not running
  | { ok: false; code: "NOT_RUNNING" }
  // Package's container does not exist in docker ps -a, and there's no clear reason why
  | { ok: false; code: "NOT_INSTALLED" }
  // Expected: Package is installing or pending to be installed
  | { ok: false; code: "INSTALLING" }
  // Expected: Package is installing but an error happened
  | { ok: false; code: "INSTALLING_ERROR"; error: ErrorSerialized }
  // NOT Expected: Package should be installed but it is not
  | { ok: false; code: "UNINSTALLED" };

/**
 * Serialized errors so the can be persisted in the db, a JSON to disk
 */
export interface ErrorSerialized {
  message: string;
  stack?: string;
}

/**
 * Aggregated DAppNode system info
 */
export interface SystemInfo {
  // Git version data
  versionData: PackageVersionData;
  versionDataVpn: PackageVersionData;
  // Network params
  ip: string; // "85.84.83.82",
  name: string; // hostname
  dappnodeWebName: string; // It's a front-end value
  staticIp: string; // "85.84.83.82" | null,
  domain: string; // "1234acbd.dyndns.io",
  upnpAvailable: boolean;
  noNatLoopback: boolean;
  alertToOpenPorts: boolean;
  internalIp: string; // "192.168.0.1",
  // publicIp is used to check for internet connection after installation
  publicIp: string;
  // Public key of nacl's asymmetric encryption, used by the ADMIN UI
  // to send sensitive data in a slightly more protected way
  dappmanagerNaclPublicKey: string;
  // From seedPhrase: If it's not stored yet, it's an empty string
  identityAddress: string;
  // Eth multi-client configuration
  ethClientTarget: EthClientTarget | null;
  ethClientFallback: EthClientFallback;
  // Eth multi-client status (cached, may be a small delay with real status)
  // - EthClientStatus = status of the current target
  // - undefined = status of current target has not been defined yet
  // - null = current target is remote and has no status
  ethClientStatus: EthClientStatus | undefined | null;
  ethProvider: string;
  // Domain maps
  fullnodeDomainTarget: string;
  // UI stats
  newFeatureIds: NewFeatureId[];
}

/**
 * Host machine Memory stats: filesystem, used, available, etc
 */
export interface HostStatMemory {
  total: number;
  used: number;
  free: number;
  usedPercentage: number;
}

/**
 * Host machine Disk stats: filesystem, used, available, etc
 */
export interface HostStatDisk {
  total: number;
  used: number;
  free: number;
  usedPercentage: number;
}

/**
 * Host machine CPU used
 */
export interface HostStatCpu {
  usedPercentage: number;
}

export interface PublicIpResponse {
  publicIp: string;
}

export interface LocalIpResponse {
  localIp: string;
}

/**
 * Welcome wizard / setup flow
 * Available routes / views in the UI
 */
export type NewFeatureId =
  | "repository"
  | "repository-fallback"
  | "system-auto-updates"
  | "change-host-password";

/**
 * UI Welcome flow status. Persists the info of which page the UI should show
 */
export type NewFeatureStatus = "pending" | "seen" | "skipped";

/**
 * HTTP Response
 */

export interface HttpResponseInterface {
  data: any;
  statusCode: number;
}

export interface IdentityInterface {
  address: string;
  privateKey: string;
  publicKey: string;
}
