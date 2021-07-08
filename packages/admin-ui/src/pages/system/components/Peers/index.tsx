import React from "react";
// Components
import SubTitle from "components/SubTitle";
import AddIpfsPeer from "./AddIpfsPeer";
import ShareIpfsPeer from "./ShareIpfsPeer";
import { RouteComponentProps } from "react-router-dom";
import { docsUrl } from "params";
import LinkDocs from "components/LinkDocs";

const Peers: React.FC<RouteComponentProps> = ({ location, match }) => {
  const peerFromUrl = getPeerFromUrl(location.pathname, match.url);
  return (
    <>
      <p>
        Learn more about IPFS peers at:{" "}
        <LinkDocs href={docsUrl.ipfsPeersExplanation}>What is IPFS</LinkDocs>
      </p>
      <SubTitle>Share IPFS peer</SubTitle>
      <ShareIpfsPeer matchUrl={match.url} />
      <SubTitle>Add IPFS peer</SubTitle>
      <AddIpfsPeer peerFromUrl={peerFromUrl} />
    </>
  );
};

// Utils

/**
 * Parses the peer from the trailing part of the URL
 * @param pathname "/system/add-ipfs-peer/%2Fdns4%2F4b62acf"
 * @param matchedUrl "/system/add-ipfs-peer"
 */
function getPeerFromUrl(pathname: string, matchedUrl: string): string {
  if (!pathname.includes(matchedUrl)) return "";
  const trailing = pathname.split(matchedUrl)[1];
  // remove first and last slash, and decode
  return decodeURIComponent((trailing || "").replace(/^\/|\/$/g, ""));
}

export default Peers;
