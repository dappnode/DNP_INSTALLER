import React from "react";
import Button from "components/Button";
import { dappnodeDiscourse } from "params";
import newTabProps from "utils/newTabProps";

export default function DiscourseActions() {
  return (
    <Button href={dappnodeDiscourse} {...newTabProps}>
      Join Discourse
    </Button>
  );
}
