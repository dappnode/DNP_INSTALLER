import { DiagnoseResult } from "../types";
import { SystemInfo, InstalledPackageData, HostStatDisk } from "common/types";
import { mandatoryCoreDnps } from "params";

type DiagnoseResultOrNull = DiagnoseResult | null;

/**
 * Diagnose texts
 * ==============
 *
 * Must return an object as:
 *
 * {
 *   ok: {Boolean},
 *   msg: {string} (short description),
 *   solutions: {array}
 * }
 *
 * can also return null, and that diagnose will be ignored
 */

export function connection({
  isOpen,
  error
}: {
  isOpen: boolean;
  error: string | null;
}): DiagnoseResultOrNull {
  return {
    ok: isOpen,
    msg: isOpen ? "Session is open" : `Session is closed: ${error || ""}`,
    solutions: [
      `You may be disconnected from your DAppNode's VPN. Please make sure your connection is still active`,
      `If you are still connected, disconnect your VPN connection, connect again and refresh this page`
    ]
  };
}

export function internetConnection({
  data: dappnodeParams,
  isValidating
}: {
  data?: SystemInfo;
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating) return { loading: true, msg: "Loading system info..." };
  if (!dappnodeParams) return null;
  const { publicIp, staticIp } = dappnodeParams;
  return {
    ok: Boolean(publicIp),
    msg: publicIp
      ? staticIp
        ? "May have connected to the internet, static IP set"
        : "Has connected to the internet, and detected own public IP"
      : "Cannot connect to the internet. Could not fetch own public IP",
    solutions: [
      "Make sure your DAppNode is connected to the internet. Make sure to plug its ethernet cable to the router."
    ]
  };
}

export function openPorts({
  data: dappnodeParams,
  isValidating
}: {
  data?: SystemInfo;
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating) return { loading: true, msg: "Loading system info..." };
  if (!dappnodeParams) return null;
  const { alertToOpenPorts } = dappnodeParams;
  return {
    ok: !alertToOpenPorts,
    msg: alertToOpenPorts
      ? "Ports have to be opened and there is no UPnP device available"
      : "No ports have to be opened OR the router has UPnP enabled",
    solutions: [
      "If you are capable of opening ports manually, please ignore this error",
      "Your router may have UPnP but it is not turned on yet. Please research if your specific router has UPnP and turn it on"
    ]
  };
}

export function noNatLoopback({
  data: dappnodeParams,
  isValidating
}: {
  data?: SystemInfo;
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating) return { loading: true, msg: "Loading system info..." };
  if (!dappnodeParams) return null;
  const { noNatLoopback, internalIp } = dappnodeParams;
  return {
    ok: !noNatLoopback,
    msg: noNatLoopback
      ? "No NAT loopback, external IP did not resolve"
      : "NAT loopback enabled, external IP resolves",
    solutions: [
      `Please use the internal IP: ${internalIp} when you are in the same network as your DAppNode`
    ]
  };
}

export function ipfs({
  data: ipfsConnectionStatus,
  isValidating
}: {
  data?: { resolves: boolean; error?: string };
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating)
    return { loading: true, msg: "Checking if IPFS resolves..." };
  if (!ipfsConnectionStatus) return null;
  return {
    ok: ipfsConnectionStatus.resolves,
    msg: ipfsConnectionStatus.resolves
      ? "IPFS resolves"
      : "IPFS is not resolving: " + ipfsConnectionStatus.error,
    solutions: [
      `Go to the system tab and make sure IPFS is running. Otherwise open the package and click 'restart'`,
      `If the problem persist make sure your disk has not run of space; IPFS may malfunction in that case.`
    ]
  };
}

export function diskSpace({
  data,
  isValidating
}: {
  data?: HostStatDisk;
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating) return { loading: true, msg: "Checking disk usage..." };
  if (!data || !data.usedPercentage) return null;
  const ok = data.usedPercentage < 95;
  return {
    ok,
    msg: ok ? "Disk usage is ok (<95%)" : "Disk usage is over 95%",
    solutions: [
      "If the disk usage gets to 100%, DAppNode will stop working. Please empty some disk space",
      "Locate DAppNode Packages with big volumes such as blockchain nodes and remove their data"
    ]
  };
}

export function coreDnpsRunning({
  data: dnpInstalled,
  isValidating
}: {
  data?: InstalledPackageData[];
  isValidating: boolean;
}): DiagnoseResultOrNull {
  if (isValidating)
    return {
      loading: true,
      msg: "Verifying installed core DAppNode Packages..."
    };

  if (!dnpInstalled) return null;

  const notFound = [];
  const notRunning = [];
  for (const coreDnpName of mandatoryCoreDnps) {
    const coreDnp = dnpInstalled.find(dnp => dnp.dnpName === coreDnpName);
    if (!coreDnp) notFound.push(coreDnpName);
    else if (coreDnp.containers.some(container => !container.running))
      notRunning.push(coreDnpName);
  }

  const errorMsgs: string[] = [];
  if (notFound.length > 0)
    errorMsgs.push(
      `Core DAppNode Packages ${notFound.join(", ")} are not found`
    );
  if (notRunning.length > 0)
    errorMsgs.push(
      `Core DAppNode Packages ${notRunning.join(", ")} are not running`
    );
  const ok = notFound.length === 0 && notRunning.length === 0;
  return {
    ok,
    msg: ok ? "All core DAppNode Packages are running" : errorMsgs.join(". "),
    solutions: [
      "Make sure the disk is not too full. If so DAppNode automatically stops the IPFS package to prevent it from becoming un-usable",
      "Go to the System tab and restart each stopped DAppNode Package. Please inspect the logs to understand cause and report it if it was not expected"
    ]
  };
}
