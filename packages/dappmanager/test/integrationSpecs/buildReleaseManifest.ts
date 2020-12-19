import { isEqual } from "lodash";
import * as ipfs from "../../src/modules/ipfs";
import { ManifestWithImage } from "../../src/types";
import { ipfsAddManifest, ipfsAddFromFs } from "../testIpfsUtils";
import { saveNewImageToDisk } from "./mockImage";

/**
 * Release type: `Manifest-type`
 * This function is a miniature version of the DAppNode SDK
 * 1. Creates a new directory with the structure:
 *  /dappnode_package-no-hashes.json
 *  /mock-test.public.dappnode.eth_0.0.1.tar.xz
 * 2. Uploads the entire folder and checks its contents
 *
 * @returns releaseHash
 */
export async function uploadManifestRelease(
  manifest: ManifestWithImage
): Promise<string> {
  const imagePath = await saveNewImageToDisk({
    dnpName: manifest.name,
    version: manifest.version,
    serviceNames: [manifest.name]
  });
  const imageUploadResult = await ipfsAddFromFs(imagePath);

  if (!manifest.image) throw Error("No image in manifest");
  manifest.image.hash = imageUploadResult.hash;
  manifest.image.size = imageUploadResult.size;

  const releaseHashManifest = await ipfsAddManifest(manifest);

  // Verify the uploaded files
  const manifestUploaded = await ipfs
    .cat({ hash: releaseHashManifest })
    .then(file => JSON.parse(file.toString()));
  if (!isEqual(manifestUploaded, manifest))
    throw Error("Wrong uploaded manifest");

  return releaseHashManifest;
}
