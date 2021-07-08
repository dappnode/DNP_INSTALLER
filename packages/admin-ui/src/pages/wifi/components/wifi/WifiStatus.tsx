// React
import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { NavLink } from "react-router-dom";
// Own components
import Card from "components/Card";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Switch from "components/Switch";
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
// API
import { api, useApi } from "api";
import { continueIfCalleDisconnected } from "api/utils";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
// Types
import { ContainerState, WifiReport } from "types";
import { docsUrl, wifiDnpName } from "./../../../../params";

import { StateBadgeContainer } from "pages/packages/components/StateBadge";
import { MdWifi } from "react-icons/md";
// Utils
import { prettyDnpName } from "utils/format";
import LinkDocs from "components/LinkDocs";

function WifiInfo({ wifiStatus }: { wifiStatus: ContainerState }) {
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);
  return (
    <p>
      Connect to the Wi-Fi hostpot exposed by your DAppNode using your
      credentials. More information at:{" "}
      <LinkDocs href={docsUrl.connectWifi}>
        How to connect do DAppNode WiFi
      </LinkDocs>
      {dappnodeIdentity.internalIp === dappnodeIdentity.ip &&
      wifiStatus !== "running"
        ? "Local and public IPs are equal. This may be due to dappnode is running on a remote machine and does not require Wi-Fi."
        : null}
    </p>
  );
}

function WifiLog({ wifiReport }: { wifiReport: WifiReport }) {
  return (
    <>
      <hr />
      <p>{wifiReport.info}</p>

      {wifiReport.report ? (
        <div className="error-stack">
          {`${wifiReport.report.lastLog}. Exit code: ${wifiReport.report.exitCode}`}
        </div>
      ) : null}
    </>
  );
}

export default function WifiStatus(): JSX.Element {
  const wifiReport = useApi.wifiReportGet();
  const wifiDnp = useApi.packageGet({ dnpName: wifiDnpName });

  useEffect(() => {
    const interval = setInterval(() => {
      wifiReport.revalidate();
    }, 5 * 1000);
    return () => {
      clearInterval(interval);
    };
  }, [wifiReport]);

  async function pauseWifi(): Promise<void> {
    try {
      if (wifiDnp.data) {
        if (wifiDnp.data.containers[0].state === "running")
          await new Promise<void>(resolve => {
            confirm({
              title: `Pause wifi service`,
              text: `Warning, if you are connected to your DAppNode's WIFI you may lose access to your DAppNode. Make sure to have an alternative way to connect to it, like a VPN connection.`,
              label: "Pause",
              onClick: resolve
            });
          });

        await withToast(
          continueIfCalleDisconnected(
            () => api.packageStartStop({ dnpName: wifiDnpName }),
            wifiDnpName
          ),
          {
            message:
              wifiDnp.data.containers[0].state === "running"
                ? "Pausing wifi"
                : "Starting wifi",
            onSuccess:
              wifiDnp.data.containers[0].state === "running"
                ? "Paused wifi"
                : "Started wifi"
          }
        );

        wifiReport.revalidate();
      }
    } catch (e) {
      console.error("Error on start/stop wifi package");
    }
  }

  return (
    <>
      {wifiDnp.data ? (
        <Card spacing>
          <WifiInfo wifiStatus={wifiDnp.data.containers[0].state} />
          <hr />
          <div className="wifi-local-status-actions-row">
            <div className="wifi-local-status-container">
              <StateBadgeContainer container={wifiDnp.data.containers[0]} />
              <MdWifi className="wifi-local-status-icon" />
              <NavLink
                className="wifi-status-name"
                to="http://my.dappnode/#/packages/wifi.dnp.dappnode.eth"
              >
                {prettyDnpName(wifiDnpName)}
              </NavLink>
            </div>
            <div className="wifi-local-actions">
              <Switch
                checked={wifiDnp.data.containers[0].state === "running"}
                onToggle={pauseWifi}
                label={
                  wifiDnp.data.containers[0].state === "running" ? "On" : "Off"
                }
              ></Switch>
            </div>
          </div>

          {wifiDnp.data.containers[0].state !== "running" &&
          wifiDnp.data.containers[0].state !== "paused" &&
          wifiReport.data ? (
            <WifiLog wifiReport={wifiReport.data} />
          ) : null}
        </Card>
      ) : wifiDnp.error ? (
        <ErrorView error={wifiDnp.error} />
      ) : wifiDnp.isValidating ? (
        <Loading steps={["Loading wifi service"]} />
      ) : null}
    </>
  );
}
