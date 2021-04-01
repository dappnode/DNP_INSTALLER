import createClient from "ipfs-http-client";

const ipfs = createClient.create();
ipfs.add({ a: 1 });

import { logs } from "../../logs";
import { CatStreamToFsArgs, catStreamToFs } from "./catStreamToFs";
import { IpfsCatOptions, IpfsLsFileResult } from "./types";
import { handleIpfsError } from "./utils";

export class Ipfs {
  /** Un-typed `ipfs-http-client` instance */
  ipfs: any;
  /** Default IPFS timeout for all requests */
  timeout = 30 * 1000;

  /**
   * Full URL to an IPFS API
   */
  constructor(ipfsHost: string) {
    this.ipfs = ipfsClient(ipfsHost, { timeout: this.timeout });
  }

  /**
   * Returns a file addressed by a valid IPFS Path.
   * @param hash "QmPTkMuuL6PD8L2SwTwbcs1NPg14U8mRzerB1ZrrBrkSDD"
   * @param options Available options:
   * - maxLength: specifies a length to read from the stream.
   *   if reached, it will throw an error
   * @returns hash contents as a buffer
   */
  async cat(hash: string, opts?: IpfsCatOptions): Promise<Buffer> {
    const chunks = [];
    try {
      for await (const chunk of this.ipfs.cat(hash, {
        length: opts?.maxLength,
        timeout: this.timeout
      })) {
        chunks.push(chunk);
      }
    } catch (e) {
      handleIpfsError(e, hash);
    }

    const data = Buffer.concat(chunks);
    if (opts?.maxLength && data.length >= opts.maxLength)
      throw Error(`Maximum size ${opts.maxLength} bytes exceeded`);

    return data;
  }

  /**
   * Downloads and parses buffer to UTF8
   * @see cat
   */
  async catString(hash: string, opts?: IpfsCatOptions): Promise<string> {
    const buffer = await this.cat(hash, opts);
    return buffer.toString();
  }

  async catStreamToFs(args: CatStreamToFsArgs): Promise<void> {
    return await catStreamToFs(args, this.ipfs);
  }

  async ls(hash: string): Promise<IpfsLsFileResult[]> {
    const files = [];
    try {
      for await (const file of this.ipfs.ls(hash, { timeout: this.timeout })) {
        files.push(file);
      }
    } catch (e) {
      handleIpfsError(e, hash);
    }

    return files.map(file => ({
      ...file,
      // cid: CID('QmZyUEQVuRK3XV7L9Dk26pg6RVSgaYkiSTEdnT2kZZdwoi'),
      hash: file.cid.toString()
    }));
  }

  /**
   * Useful to check if a large dataset is available
   * Also possible to get it's size with it by summing its links size
   */
  async objectGet(hash: string): Promise<{ size: number }> {
    try {
      return await this.ipfs.object.get(hash, { timeout: this.timeout });
    } catch (e) {
      handleIpfsError(e, hash);
    }
  }

  /**
   * Pin a hash
   */
  async pinAdd(hash: string): Promise<void> {
    return await this.ipfs.pin.add(hash, { timeout: this.timeout });
  }

  async pinAddNoThrow(hash: string): Promise<void> {
    await this.pinAdd(hash).catch((e: Error) =>
      logs.error(`Error pinning hash ${hash}`, e)
    );
  }
}
