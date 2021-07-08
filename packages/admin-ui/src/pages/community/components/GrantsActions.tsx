import React from "react";
import Button from "components/Button";
import { dappnodeGitcoin } from "params";
import newTabProps from "utils/newTabProps";

export default function GrantsActions() {
  return (
    <Button href={dappnodeGitcoin} {...newTabProps}>
      Contribute
    </Button>
  );
}
