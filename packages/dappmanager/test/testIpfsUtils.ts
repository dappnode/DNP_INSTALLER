import fs from "fs";
import ipfsRaw from "../src/modules/ipfs/ipfsSetup";
import { Manifest } from "../src/types";
import Ipfs from "ipfs-http-client";

const globSource = (Ipfs as any).globSource;
const Buffer = (Ipfs as any).Buffer;

/**
 * Util, IPFS wrapper with type info
 */

type IpfsAddResult = {
  path: string;
  hash: string;
  size: number;
};

function parseAddResult(file: any): IpfsAddResult {
  return {
    path: file.path,
    hash: file.cid.toString(),
    size: file.size
  };
}

async function ipfsAddSingle(content: any): Promise<IpfsAddResult> {
  const file = await ipfsRaw.add(content);
  return parseAddResult(file);
}

/**
 * Uploads a directory / file from the local filesystem
 * This should be part of the `DAppNodeSDK`
 */
export async function ipfsAddFromFs(
  path: string,
  options?: { recursive: boolean }
): Promise<IpfsAddResult> {
  if (!fs.existsSync(path))
    throw Error(`ipfs.addFromFs error: no file found at: ${path}`);
  return await ipfsAddSingle(globSource(path, options));
}

export async function ipfsAddDirFromFs(path: string): Promise<string> {
  const result = await ipfsAddFromFs(path, { recursive: true });
  return result.hash;
}

/**
 * Uploads a manifest from memory
 * This should be part of the `DAppNodeSDK`
 */
export async function ipfsAddManifest(manifest: Manifest): Promise<string> {
  const content = Buffer.from(JSON.stringify(manifest, null, 2));
  const result = await ipfsAddSingle(content);
  return result.hash;
}
