import React, { useMemo } from "react";
import {
  NavLink,
  Switch,
  Route,
  Redirect,
  RouteComponentProps
} from "react-router-dom";
import { useApi } from "api";
import { title, subPaths } from "../data";
import { OpenVpnDevicesRoot } from "./openvpn/OpenVpnDevicesRoot";
import { WireguardDevicesRoot } from "./wireguard/WireguardDevicesRoot";
import Title from "components/Title";
import { docsUrl, vpnDnpName, wireguardDnpName } from "params";
import LinkDocs from "components/LinkDocs";

export function VpnHome({ match }: RouteComponentProps) {
  const dnpsRequest = useApi.packagesGet();
  const availableRoutes = useMemo(() => {
    const dnpsSet = dnpsRequest.data
      ? new Set(dnpsRequest.data.map(dnp => dnp.dnpName))
      : new Set<string>();

    return [
      {
        name: "OpenVpn",
        subPath: subPaths.openVpn,
        component: OpenVpnDevicesRoot,
        installed: dnpsSet.has(vpnDnpName)
      },
      {
        name: "Wireguard",
        subPath: subPaths.wireguard,
        component: WireguardDevicesRoot,
        installed: dnpsSet.has(wireguardDnpName)
      }
    ].sort((a, b) =>
      a.installed && !b.installed ? -1 : !a.installed && b.installed ? 1 : 0
    );
  }, [dnpsRequest.data]);

  return (
    <>
      <Title title={title} />
      <div className="horizontal-navbar">
        {availableRoutes.map(route => (
          <button key={route.subPath} className="item-container">
            <NavLink
              to={`${match.url}/${route.subPath}`}
              className="item no-a-style"
              style={{ whiteSpace: "nowrap" }}
            >
              {route.name}
            </NavLink>
          </button>
        ))}
      </div>

      <p>
        Create a VPN profile for each of your devices (laptop, phone) so you can
        access your DAppNode from an external network. Learn more about VPN at:{" "}
        <LinkDocs href={docsUrl.connectVpn}>
          How to connect do DAppNode VPN
        </LinkDocs>
      </p>

      <div className="section-spacing">
        <Switch>
          {availableRoutes.map(route => (
            <Route
              key={route.subPath}
              path={`${match.path}/${route.subPath}`}
              component={route.component}
            />
          ))}
          {/* Redirect automatically to the first route. DO NOT hardcode 
              to prevent typos and causing infinite loops */}
          <Redirect to={`${match.url}/${availableRoutes[0].subPath}`} />
        </Switch>
      </div>
    </>
  );
}
