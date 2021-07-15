import "mocha";
import { expect } from "chai";
import { parseCloseOutput } from "../../../src/modules/upnpc/close";

describe("upnpn: parseCloseOutput", () => {
  const terminalOutputSuccess = `upnpc : miniupnpc library test client, version 2.0.
  (c) 2005-2017 Thomas Bernard.
Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
for more information.
List of UPNP devices found on the network :
  desc: http://192.168.1.1:5001/dyn/uuid:0011-0011-0011-0011
  st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

Found valid IGD : http://192.168.1.1:5001/uuid:0011-0011-0011-0011/WANPPPConnection:1
Local LAN ip address : 192.168.1.01
UPNP_DeletePortMapping() returned : 0
`;

  const terminalOutputErrorNoPort = `upnpc : miniupnpc library test client, version 2.0.
 (c) 2005-2017 Thomas Bernard.
Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
for more information.
List of UPNP devices found on the network :
 desc: http://192.168.1.1:5001/dyn/uuid:0011-0011-0011-0011
 st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

Found valid IGD : http://192.168.1.1:5001/uuid:0011-0011-0011-0011/WANPPPConnection:1
Local LAN ip address : 192.168.1.01
UPNP_DeletePortMapping() failed with code : 714`;

  it("On success, it should return ok", async () => {
    const ok = parseCloseOutput(terminalOutputSuccess);
    expect(ok).to.be.ok;
  });
});
