import Button from "components/Button";
import React from "react";
import { mediumTreasuryUrl, explorerTreasuryUrl } from "params";
import newTabProps from "utils/newTabProps";

export default function TreasuryActions() {
  return (
    <>
      <Button href={mediumTreasuryUrl} {...newTabProps}>
        Read more
      </Button>
      <Button href={explorerTreasuryUrl} {...newTabProps}>
        Check my ranking
      </Button>
    </>
  );
}
