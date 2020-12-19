import Ipfs from "ipfs-http-client";
import params from "../../params";

export const timeoutMs = 30 * 1000;
/**
 * From https://github.com/sindresorhus/ky/blob/2f37c3f999efb36db9108893b8b3d4b3a7f5ec45/index.js#L127-L132
 */
export const TimeoutErrorKy = class TimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "TimeoutError";
  }
};

/**
 * IPFS client setup.
 *
 * Notice that this script takes advantatge of the singleton nature of nodejs imports.
 * The exported ipfs object will only be initialized once in the entire application.
 */
const IPFS_HOST = params.IPFS_HOST;
const ipfs = process.env.DISABLE_IPFS
  ? ({} as ReturnType<typeof Ipfs>)
  : Ipfs({ url: IPFS_HOST, timeout: timeoutMs });

export default ipfs;
