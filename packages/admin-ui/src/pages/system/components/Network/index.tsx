import React from "react";
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import { HttpsMappings } from "./HttpsMappings";
import { StaticIp } from "./StaticIp";
import { docsUrl } from "params";
import LinkDocs from "components/LinkDocs";

export function Network() {
  return (
    <>
      <SubTitle>HTTPs Portal</SubTitle>
      <Card spacing className="network-editor">
        <div>
          HTTPs portal allows you to expose services to the external internet
          with a valid TLS/SSL certificate. Only the services that are safe to
          be exposed will show up here. Learn more about HTTPs portal at:{" "}
          <LinkDocs href={docsUrl.httpsExplanation}>What is HTTPs</LinkDocs>
        </div>
        <HttpsMappings />
      </Card>

      <SubTitle>Static IP</SubTitle>
      <Card spacing className="network-editor">
        <div>
          You can set a static IP for this DAppNode instead of using a dyndns.
          Only set a static IP if you are sure it is static, otherwise you may
          not be able to connect to its VPN.
        </div>
        <StaticIp />
      </Card>
    </>
  );
}
