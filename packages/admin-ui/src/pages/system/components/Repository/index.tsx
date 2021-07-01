import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { api } from "api";
import Card from "components/Card";
import Button from "components/Button";
import {
  getEthClientPrettyName,
  getEthClientPrettyStatus,
  EthMultiClientsAndFallback
} from "components/EthMultiClient";
import { EthClientTarget, EthClientFallback } from "types";
import {
  getEthClientTarget,
  getEthClientFallback,
  getEthClientStatus
} from "services/dappnodeStatus/selectors";
import { changeEthClientTarget } from "pages/system/actions";
import Alert from "react-bootstrap/Alert";
import { withToastNoThrow } from "components/toast/Toast";

export default function Repository() {
  const ethClientTarget = useSelector(getEthClientTarget);
  const ethClientStatus = useSelector(getEthClientStatus);
  const ethClientFallback = useSelector(getEthClientFallback);
  const dispatch = useDispatch();

  const [target, setTarget] = useState<EthClientTarget | null>(
    ethClientTarget || null
  );

  useEffect(() => {
    if (ethClientTarget) setTarget(ethClientTarget);
  }, [ethClientTarget]);

  function changeClient() {
    if (target) dispatch(changeEthClientTarget(target));
  }

  async function changeFallback(newFallback: EthClientFallback) {
    await withToastNoThrow(
      () => api.ethClientFallbackSet({ fallback: newFallback }),
      { onError: true }
    );
  }

  /**
   * There are a few edge cases which the user must be warned about
   *
   * 1. if (!dnp) && status !== "installed", "selected", "error-installing"
   *    NOT-OK Client should be installed
   *    Something or someone removed the client, re-install?
   *  > Show an error or something in the UI as
   *    "Alert!" you target is OFF, go to remote or install it again
   *
   * 2. if (!dnp.running)
   *    Package can be stopped because the user stopped it or
   *    because the DAppNode is too full and auto-stop kicked in
   *  > Show an error or something in the UI as
   *    "Alert!" you target is OFF, go to remote or install it again
   */
  function renderEthMultiClientWarning() {
    if (ethClientStatus && !ethClientStatus.ok)
      switch (ethClientStatus.code) {
        case "NOT_RUNNING":
          return (
            <Alert variant="warning">
              Selected client is not running. Please, restart the client or
              select remote
            </Alert>
          );
        case "NOT_INSTALLED":
        case "UNINSTALLED":
          return (
            <Alert variant="warning">
              Selected client is not installed. Please, re-install the client or
              select remote
            </Alert>
          );
      }
  }

  return (
    <Card className="dappnode-identity">
      <div>
        DAppNode uses smart contracts to access a decentralized respository of
        DApps. Choose to connect to a remote network or use your own local node
      </div>
      {ethClientTarget && ethClientTarget !== "remote" && (
        <div className="description">
          <strong>Client:</strong> {getEthClientPrettyName(ethClientTarget)}
          <br />
          <strong>Status:</strong>{" "}
          {getEthClientPrettyStatus(ethClientStatus, ethClientFallback)}
        </div>
      )}

      {renderEthMultiClientWarning()}

      <EthMultiClientsAndFallback
        target={target}
        onTargetChange={setTarget}
        fallback={ethClientFallback || "off"}
        onFallbackChange={changeFallback}
      />

      <div style={{ textAlign: "end" }}>
        <Button
          variant="dappnode"
          onClick={changeClient}
          disabled={!target || ethClientTarget === target}
        >
          Change
        </Button>
      </div>
    </Card>
  );
}
