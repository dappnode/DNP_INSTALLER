import "mocha";
import { expect } from "chai";
import { parseOpenOutput } from "../../../src/modules/upnpc/open";

describe("upnpn: parseOpenOutput", () => {
  const terminalOutputSuccess = `upnpc : miniupnpc library test client, version 2.0.
 (c) 2005-2017 Thomas Bernard.
Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
for more information.
List of UPNP devices found on the network :
 desc: http://192.168.1.1:5001/dyn/uuid:0011-0011-0011-0011
 st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

Found valid IGD : http://192.168.1.1:5001/uuid:0011-0011-0011-0011/WANPPPConnection:1
Local LAN ip address : 192.168.1.01
ExternalIPAddress = 85.84.83.82
InternalIP:Port = 192.168.1.01:4002
external 85.84.83.82:4002 UDP is redirected to internal 192.168.1.01:4002 (duration=0)
`;

  it("On success, it should return ok", async () => {
    const ok = parseOpenOutput(terminalOutputSuccess);
    expect(ok).to.be.ok;
  });
});
