import shell from "../../utils/shell";
import getDappmanagerImage from "../../utils/getDappmanagerImage";
import { parseUpnpErrors } from "./upnpError";

export default async function upnpcCommand(cmd: string): Promise<string> {
  try {
    const image = await getDappmanagerImage();
    return await shell(
      `docker run --rm --net=host --entrypoint=/usr/bin/upnpc ${image} ${cmd}`
    );
  } catch (e) {
    const upnpError = parseUpnpErrors(e.message);
    throw upnpError;
  }
}
