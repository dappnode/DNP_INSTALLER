// React
import React, { useState } from "react";
import { useSelector } from "react-redux";
// API
import { api, useApi } from "api";
import { ReqStatus } from "types";
// Own components
import { confirm } from "components/ConfirmDialog";
import { withToast } from "components/toast/Toast";
import { rootPath as installedRootPath } from "pages/installer";
import ErrorView from "components/ErrorView";
import Loading from "components/Loading";
import Card from "components/Card";
import Switch from "components/Switch";
import { getDappnodeIdentityClean } from "services/dappnodeStatus/selectors";
import { adminUiLocalDomain, docsUrl, httpsPortalDnpName } from "params";
import { StateBadge } from "pages/packages/components/StateBadge";
import { MdWifi } from "react-icons/md";
import { parseContainerState } from "pages/packages/components/StateBadge/utils";
import Alert from "react-bootstrap/esm/Alert";
import { LocalProxyingStatus } from "common";
import { NavLink } from "react-router-dom";
import LinkDocs from "components/LinkDocs";

export function LocalProxying() {
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});
  const localProxyingStatus = useApi.localProxyingStatusGet();
  const dappnodeIdentity = useSelector(getDappnodeIdentityClean);

  async function localProxyingEnableDisable(): Promise<void> {
    try {
      if (!localProxyingStatus.data) return;
      if (reqStatus.loading) return;

      const isLocalProxyingRunning = localProxyingStatus.data === "running";
      if (isLocalProxyingRunning)
        await new Promise<void>(resolve => {
          confirm({
            title: `Stopping Local Network Proxy`,
            text: `Warning, if you are connected to your DAppNode through Local Network Proxy you may lose access to your DAppNode. Make sure to have an alternative way to connect to it, like WiFi or a VPN connection.`,
            label: "Pause",
            onClick: resolve
          });
        });

      setReqStatus({ loading: true });
      await withToast(
        () => api.localProxyingEnableDisable(!isLocalProxyingRunning),
        {
          message: isLocalProxyingRunning
            ? "Stopping Local Network Proxy..."
            : "Starting Local Network Proxy",
          onSuccess: isLocalProxyingRunning
            ? "Stopped Local Network Proxy..."
            : "Started Local Network Proxy"
        }
      );
      setReqStatus({ result: true });

      localProxyingStatus.revalidate();
    } catch (e) {
      setReqStatus({ error: e });
      console.error("Error on start/stop Local Network Proxy", e);
    }
  }

  if (localProxyingStatus.data === "https missing") {
    const url = `${installedRootPath}/${httpsPortalDnpName}`;
    return (
      <Alert variant="secondary">
        You must <NavLink to={url}>install the HTTPs Portal</NavLink> to use
        this feature.{" "}
        <LinkDocs href={docsUrl.connectLocalProxy}>
          Learn more about Local Network
        </LinkDocs>
      </Alert>
    );
  }

  return (
    <>
      {localProxyingStatus.data ? (
        <Card spacing>
          <p>
            If you are connected to the same router as your DAppNode you can use
            this page at <a href={adminUiLocalDomain}>{adminUiLocalDomain}</a>.
            Learn more about the Local Network Proxy at:{" "}
            <LinkDocs href={docsUrl.connectLocalProxy}>
              How to connect do DAppNode Local Network
            </LinkDocs>
          </p>
          {dappnodeIdentity.internalIp === dappnodeIdentity.ip && (
            <p>
              Local and public IPs are equal. This may be due to dappnode is
              running on a remote machine and does not require Local Network
              Proxy.
            </p>
          )}
          <hr />

          <div className="wifi-local-status-actions-row">
            <div className="wifi-local-status-container">
              <StateBadge
                {...parseAvahiPublishCmdState(localProxyingStatus.data)}
              />
              <MdWifi className="wifi-local-status-icon" />
              <span className="wifi-local-status-name">
                Local Network Proxy
              </span>
            </div>

            <div className="wifi-local-actions">
              <Switch
                checked={localProxyingStatus.data === "running"}
                onToggle={localProxyingEnableDisable}
                disabled={reqStatus.loading}
                label={localProxyingStatus.data === "running" ? "On" : "Off"}
              ></Switch>
            </div>
          </div>
        </Card>
      ) : localProxyingStatus.isValidating ? (
        <Loading steps={["Loading Local Network Proxy..."]} />
      ) : localProxyingStatus.error ? (
        <ErrorView error={localProxyingStatus.error} />
      ) : null}
    </>
  );
}

function parseAvahiPublishCmdState(
  state: Exclude<LocalProxyingStatus, "https missing">
): ReturnType<typeof parseContainerState> {
  switch (state) {
    case "running":
      return { variant: "success", state: "running", title: "Running" };
    case "stopped":
      return { variant: "secondary", state: "stopped", title: "Paused" };
    case "crashed":
      return {
        variant: "danger",
        state: "crashed",
        title: "Exited"
      };
  }
}
