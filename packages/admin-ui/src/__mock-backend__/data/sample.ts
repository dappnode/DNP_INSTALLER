import {
  DirectoryItem,
  RequestedDnp,
  InstalledPackageDetailData,
  PackageContainer
} from "../../common";

export const sampleRequestState: RequestedDnp = {
  dnpName: "demo-name",
  semVersion: "0.0.0",
  reqVersion: "0.0.0",
  avatarUrl: "",
  metadata: { name: "demo-name", version: "0.0.0", description: "demo" },
  specialPermissions: {},
  imageSize: 10000000,
  isUpdated: false,
  isInstalled: true,
  settings: {},
  setupWizard: {},

  request: {
    compatible: {
      requiresCoreUpdate: false,
      resolving: false,
      isCompatible: true,
      error: "",
      dnps: { "demo-name": { to: "0.0.0" } }
    },
    available: { isAvailable: true, message: "" }
  }
};

export const sampleDirectoryState: DirectoryItem = {
  index: 0,
  status: "ok",
  name: "demo-name",
  description: "Demo description",
  avatarUrl: "",
  isInstalled: false,
  isUpdated: false,
  whitelisted: true,
  isFeatured: false,
  categories: ["Blockchain"]
};

export const sampleContainer: PackageContainer = {
  containerId: "0000",
  containerName: "mock",
  dnpName: "mock",
  serviceName: "mock",
  instanceName: "",
  version: "0.0.0",
  isDnp: true,
  isCore: false,
  created: 12316723123,
  image: "demo-name:0.0.0",
  state: "running",
  running: true,
  exitCode: null,
  ip: "172.10.0.1",
  dependencies: {},
  ports: [],
  volumes: [],
  networks: [],
  avatarUrl: "http://example.com:8080/ipfs/Qm",
  origin: undefined
};

export const sampleDnp: InstalledPackageDetailData = {
  dnpName: "demo-name",
  instanceName: "",
  version: "0.0.0",
  isDnp: true,
  isCore: false,
  dependencies: {},
  avatarUrl: "http://example.com:8080/ipfs/Qm",
  origin: undefined,
  gettingStarted: "",
  gettingStartedShow: true,
  areThereVolumesToRemove: false,
  dependantsOf: [],
  updateAvailable: null,
  notRemovable: false,
  containers: [],
  packageSentData: {}
};
