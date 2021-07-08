import React, { useState } from "react";
import { apiAuth } from "api";
import { BsLock } from "react-icons/bs";
import Alert from "react-bootstrap/esm/Alert";
import Button from "components/Button";
import ErrorView from "components/ErrorView";
import { StandaloneContainer } from "./StandaloneContainer";
import { ReqStatus } from "types";
import { InputForm } from "components/InputForm";
import Ok from "components/Ok";
import { docsUrl } from "params";
import LinkDocs from "components/LinkDocs";

export function ResetPassword({
  onSuccessfulReset
}: {
  onSuccessfulReset: () => void;
}) {
  const [token, setToken] = useState("");
  const [reqStatus, setReqStatus] = useState<ReqStatus>({});

  async function onReset() {
    try {
      setReqStatus({ loading: true });
      await apiAuth.recoverPass({ token });
      setReqStatus({ result: true });
      onSuccessfulReset();
    } catch (e) {
      setReqStatus({ error: e });
    }
  }

  return (
    <StandaloneContainer TopIcon={BsLock} title="Reset">
      <div className="text">
        Use your recovery token to reset the admin password and register again
      </div>

      <Alert variant="warning">
        If you have lost your recovery token you have to directly access your
        machine via SSH or by connecting a keyboard and screen and follow this
        guide
        <br />
        <LinkDocs href={docsUrl.recoverPasswordGuide}>
          Reset your DAppNode admin password
        </LinkDocs>
      </Alert>

      <InputForm
        fields={[
          {
            label: "Recovery token",
            labelId: "recovery-token",
            name: "recovery-token",
            autoFocus: true,
            secret: true,
            value: token,
            onValueChange: setToken
          }
        ]}
      >
        <Button
          type="submit"
          className="register-button"
          onClick={onReset}
          variant="dappnode"
          disabled={reqStatus.loading || !token}
          fullwidth
        >
          Reset password
        </Button>
      </InputForm>

      {reqStatus.result && <Ok ok msg="Reseted password"></Ok>}
      {reqStatus.error && <ErrorView error={reqStatus.error} hideIcon red />}
    </StandaloneContainer>
  );
}
