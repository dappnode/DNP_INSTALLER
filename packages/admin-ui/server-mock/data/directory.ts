import { DirectoryItemOk, DirectoryItem } from "../../src/common";
import { MockDnp } from "./dnps/types";
import { mockDnps } from "./dnps";

function getDirectoryDnp(dnp: MockDnp, index: number): DirectoryItemOk {
  return {
    index,
    status: "ok",
    name: dnp.metadata.name,
    description:
      dnp.metadata.shortDescription || dnp.metadata.description || "",
    avatarUrl: dnp.avatar || "",
    isFeatured: false,
    isInstalled: Boolean(dnp.installedData),
    isUpdated: false,
    whitelisted: true,
    featuredStyle: dnp.metadata.style,
    categories: dnp.metadata.categories || [],
    ...dnp.directory
  };
}

export const directory: DirectoryItem[] = [
  ...mockDnps.map(getDirectoryDnp),
  {
    index: 99,
    status: "error",
    name: "fetch-fails.dnp.dappnode.eth",
    whitelisted: true,
    isFeatured: false,
    message: "Sample error: Can't download manifest"
  }
];
