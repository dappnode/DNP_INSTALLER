import * as db from "../../db";
import { eventBus } from "../../eventBus";
import { HttpError, wrapHandler } from "../utils";
import { getDnpFromIp } from "./sign";

const MAX_LENGTH = 512;
const MAX_KEYS = 20;

/**
 * Receive arbitrary data from packages to be shown in the UI
 */
export const dataSend = wrapHandler(async (req, res) => {
  const key = req.query.key;
  const data = req.query.data || req.body;

  try {
    if (typeof key === undefined) throw Error("missing");
    if (typeof key !== "string") throw Error("must be a string");
    if (!key) throw Error("must not be empty");
  } catch (e) {
    throw new HttpError({ statusCode: 400, name: `Arg key ${e.message}` });
  }

  try {
    if (typeof data === undefined) throw Error("missing");
    if (typeof data !== "string") throw Error("must be a string");
    // OK to be empty
    if (data.length > MAX_LENGTH) throw Error("too long");
  } catch (e) {
    throw new HttpError({ statusCode: 400, name: `Arg data ${e.message}` });
  }

  const { dnpName } = await getDnpFromIp(req.ip);

  const packageData = db.packageSentData.get(dnpName) ?? {};
  if (Object.keys(packageData).length > MAX_KEYS) {
    throw Error("Too many keys already stored");
  }

  const prevData = packageData[key];
  packageData[key] = data;
  db.packageSentData.set(dnpName, packageData);

  // Emit to the UI for instant refresh
  if (prevData !== data) {
    eventBus.requestPackages.emit();
  }

  return res.status(200).send();
});
