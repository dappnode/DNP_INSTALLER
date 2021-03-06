import { CoreUpdateDataAvailable, Routes } from "../common";
import { directory, dnpRequests } from "./data";

export const fetchPkgsData: Pick<
  Routes,
  "fetchCoreUpdateData" | "fetchDirectory" | "fetchDnpRequest"
> = {
  fetchCoreUpdateData: async () => sampleCoreUpdateData,
  fetchDirectory: async () => directory,
  fetchDnpRequest: async ({ id }) => {
    const dnpRequest = dnpRequests[id];
    if (!dnpRequest) throw Error(`No dnp request found for ${id}`);
    return dnpRequest;
  }
};

const sampleCoreUpdateData: CoreUpdateDataAvailable = {
  available: true,
  type: "patch",
  packages: [
    {
      name: "admin.dnp.dappnode.eth",
      from: "0.2.0",
      to: "0.2.6",
      warningOnInstall: "Warning on **install**"
    }
  ],
  changelog:
    "Major improvements to the 0.2 version https://github.com/dappnode/DAppNode/wiki/DAppNode-Migration-guide-to-OpenVPN",
  updateAlerts: [
    {
      from: "0.2.0",
      to: "0.2.0",
      message: "Conditional update alert: **Markdown**"
    }
  ],
  versionId: "admin@0.2.6",
  coreVersion: "0.2.10"
};
