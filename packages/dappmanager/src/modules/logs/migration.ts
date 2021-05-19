import params from "../../params";
import { shellHost } from "../../utils/shell";

/**
 * Creates logs path, if folder already exists
 * returns true, else false
 */
async function isLogsMigrationDone(): Promise<boolean> {
  try {
    await shellHost(`mkdir ${params.LOGS_PATH}`);
    return false;
  } catch (e) {
    // mkdir: cannot create directory '/usr/src/dappnode/logs': File exists
    if (e.message.includes("File exists")) return true;
    e.message = "Error creating logs path: " + e;
    throw Error(e);
  }
}

/**
 * Copy al logs from /usr/sr/dappnode
 * to /usr/src/dappnode/logs
 */
export async function logsMigration(): Promise<void> {
  try {
    const isMigrationDone = await isLogsMigrationDone();
    if (!isMigrationDone)
      await shellHost(`mv --force /usr/src/dappnode/*.log ${params.LOGS_PATH}`);
  } catch (e) {
    e.message = "Error migrating logs files: " + e;
    throw Error(e);
  }
}
