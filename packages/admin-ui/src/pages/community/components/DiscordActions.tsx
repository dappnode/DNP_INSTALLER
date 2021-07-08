import Button from "components/Button";
import React from "react";
import { dappnodeDiscord } from "params";
import newTabProps from "utils/newTabProps";

export default function DiscordActions() {
  return (
    <Button href={dappnodeDiscord} {...newTabProps}>
      Join Discord
    </Button>
  );
}
