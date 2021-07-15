import "mocha";
import { expect } from "chai";
import { parseListOutput } from "../../../src/modules/upnpc/list";

describe("upnpn: parseListOutput", () => {
  const terminalOutputSuccess = `upnpc : miniupnpc library test client, version 2.0.
 (c) 2005-2017 Thomas Bernard.
Go to http://miniupnp.free.fr/ or https://miniupnp.tuxfamily.org/
for more information.
List of UPNP devices found on the network :
 desc: http://192.168.1.1:5001/dyn/uuid:0011-0011-0011-0011
 st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

Found valid IGD : http://192.168.1.1:5001/uuid:0011-0011-0011-0011/WANPPPConnection:1
Local LAN ip address : 192.168.1.01
Connection Type : IP_Routed
Status : Connected, uptime=1360425s, LastConnectionError :
  Time started : Tue Feb 31 00:00:01 2018
MaxBitRateDown : 0 bps   MaxBitRateUp 0 bps
ExternalIPAddress = 85.84.83.82
 i protocol exPort->inAddr:inPort description remoteHost leaseTime
 0 UDP   500->192.168.1.42:500   'DAppNode' '' 0
 1 UDP  4500->192.168.1.42:4500  'DAppNode' '' 0
2 TCP    22->192.168.1.42:22    'DAppNode' '' 0
 3 UDP 30303->192.168.1.42:30303 'DAppNode' '' 0
 4 TCP 30303->192.168.1.42:30303 'DAppNode' '' 0
 5 TCP  4001->192.168.1.42:4001  'DAppNode' '' 0
 6 UDP  4002->192.168.1.42:4002  'DAppNode' '' 0
 7 TCP 32000->192.168.1.52:32000 'otherApp (TCP)' '' 0
 8 UDP 32000->192.168.1.52:32000 'otherApp (UDP)' '' 0
GetGenericPortMappingEntry() returned 713 (SpecifiedArrayIndexInvalid)
`;

  it("On success, it should return the current port mappings", async () => {
    const ports = parseListOutput(terminalOutputSuccess);
    expect(ports).to.deep.equal([
      { protocol: "UDP", exPort: "500", inPort: "500", ip: "192.168.1.42" },
      { protocol: "UDP", exPort: "4500", inPort: "4500", ip: "192.168.1.42" },
      { protocol: "TCP", exPort: "22", inPort: "22", ip: "192.168.1.42" },
      { protocol: "UDP", exPort: "30303", inPort: "30303", ip: "192.168.1.42" },
      { protocol: "TCP", exPort: "30303", inPort: "30303", ip: "192.168.1.42" },
      { protocol: "TCP", exPort: "4001", inPort: "4001", ip: "192.168.1.42" },
      { protocol: "UDP", exPort: "4002", inPort: "4002", ip: "192.168.1.42" }
    ]);
  });
});
