import upnpcCommand from "./upnpcCommand";
import { PackagePort } from "../../types";

/**
 * Close port = deletes the map requested port to host
 * Actual command example:
 *   docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -d 500 UDP
 *
 * @param kwargs: {
 *   portNumber: '3000',
 *   protocol: 'TCP',
 * }
 * @returns
 */
export async function close(port: PackagePort): Promise<boolean> {
  const { portNumber, protocol } = port;

  try {
    const res = await upnpcCommand(`-e DAppNode -d ${portNumber} ${protocol}`);
    return parseCloseOutput(res);
  } catch (e) {
    parseCloseOutput(e.message);
    throw e;
  }
}

// Utils

// SUCCESSFUL: Close an existing port

// dappnode@machine:/usr/src/dappnode/DNCORE$ docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -d 4002 UDP
// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// List of UPNP devices found on the network :
//  desc: http://192.168.1.1:5001/dyn/uuid:0011-0011-0011-0011
//  st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

// Found valid IGD : http://192.168.1.1:5001/uuid:0011-0011-0011-0011/WANPPPConnection:1
// Local LAN ip address : 192.168.1.01
// UPNP_DeletePortMapping() returned : 0

// ERROR: Close a NON existing port

// dappnode@machine:/usr/src/dappnode/DNCORE$ docker run --rm --net=host ${IMAGE} upnpc -e DAppNode -d 40025 UDP
// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// List of UPNP devices found on the network :
//  desc: http://192.168.1.1:5001/dyn/uuid:0011-0011-0011-0011
//  st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

// Found valid IGD : http://192.168.1.1:5001/uuid:0011-0011-0011-0011/WANPPPConnection:1
// Local LAN ip address : 192.168.1.01
// UPNP_DeletePortMapping() failed with code : 714

// ERROR: no UPnP device found

// root@lionDAppnode:/usr/src/dappnode/DNCORE# docker run --rm --net=host ${IMAGE} upnpc -s
// upnpc : miniupnpc library test client, version 2.0.
//  (c) 2005-2017 Thomas Bernard.
// Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
// for more information.
// No IGD UPnP Device found on the network !

/**
 *
 * @param terminalOutput A sample can be found above
 * @returns
 */
export function parseCloseOutput(terminalOutput: string): boolean {
  // Get the last line of the output
  const lines = terminalOutput.trim().split(/\r?\n/);
  const lastLine = lines[lines.length - 1] || "";

  // Check if is contains "returned.0"
  const okRegex = RegExp(/returned.+0/);
  if (okRegex.test(lastLine)) {
    return true;
  } else {
    return false;
  }
}
