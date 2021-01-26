import { ethers } from "ethers";
import { ApmVersionMetadata } from "./types";
import { getTimestamp } from "./apmUtils";

const repoAbi = [
  "event NewVersion(uint256 versionId, uint16[3] semanticVersion)"
];

/**
 * Fetches the new repos logs from a registry
 *
 * [NOTE]: Will throw with "ENS name not configured" if the ENS can't
 * resolve the domain
 */
export async function fetchApmVersionsMetadata(
  provider: ethers.providers.Provider,
  addressOrEnsName: string,
  fromBlock?: number
): Promise<ApmVersionMetadata[]> {
  // Change this method if the web3 library is not ethjs
  // await ensureAncientBlocks();

  const repo = new ethers.Contract(addressOrEnsName, repoAbi, provider);

  const filter = repo.filters.NewVersion();
  const logs = await repo.queryFilter(filter, fromBlock || 0, "latest");

  return await Promise.all(
    logs.map(
      async (event): Promise<ApmVersionMetadata> => {
        if (!event.args) throw Error(`Error parsing NewRepo event`);
        // const versionId = parsedLog.values.versionId.toNumber();
        return {
          version: event.args.semanticVersion.join("."),
          // Parse tx data
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: await getTimestamp(event.blockNumber, provider)
        };
      }
    )
  );
}
