import * as db from "../db";
import { eventBus } from "../eventBus";

/**
 * Delete package sent data key
 */
export async function packageSentDataDelete({
  dnpName,
  key
}: {
  dnpName: string;
  key?: string;
}): Promise<void> {
  let packageData = db.packageSentData.get(dnpName);

  if (!packageData) {
    throw Error(`No data for ${dnpName}`);
  }

  if (key !== undefined) {
    if (!(key in packageData)) {
      throw Error(`Key ${key} not in package data`);
    }
    delete packageData[key];
  } else {
    if (Object.keys(packageData).length === 0) {
      throw Error("Data is empty");
    }
    packageData = {};
  }

  db.packageSentData.set(dnpName, packageData);
  eventBus.requestPackages.emit();
}
