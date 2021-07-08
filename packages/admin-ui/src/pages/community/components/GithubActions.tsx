import React from "react";
import Button from "components/Button";
import { dappnodeGithub } from "params";
import newTabProps from "utils/newTabProps";

export default function GithubActions() {
  return (
    <Button href={dappnodeGithub} {...newTabProps}>
      Github
    </Button>
  );
}
