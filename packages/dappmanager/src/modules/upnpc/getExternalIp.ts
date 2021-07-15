import isIp from "is-ip";
import upnpcCommand from "./upnpcCommand";
import { parseUpnpErrors } from "./upnpError";

export default async function getExternalIp(): Promise<string> {
  try {
    const res = await upnpcCommand("-l");
    const externalIp = ((res || "").match(
      /ExternalIPAddress.=.((\d+\.?){4})/
    ) || [])[1];
    if (isIp(externalIp)) return externalIp;
    else throw Error("Wrong IP");
  } catch (e) {
    e.message = `Error getting external IP: ${e.message}`;
    const upnpError = parseUpnpErrors(e.message);
    throw upnpError;
  }
}
