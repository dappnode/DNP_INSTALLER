import fs from "fs";
import path from "path";
import { cleanTestDir, testDir } from "../../testUtils";
import * as ipfs from "../../../src/modules/ipfs";
import { ipfsAddDirFromFs } from "../../testIpfsUtils";
import { expect } from "chai";
import { pinAdd } from "../../../src/modules/ipfs/methods/pinAdd";
import objectSize from "../../../src/modules/ipfs/methods/objectSize";

describe("ipfs / integration test", function() {
  this.timeout(60 * 1000);

  const dirPath = path.join(testDir, "ipfs-test-upload");
  const filepath = path.join(dirPath, "sample.txt");
  const filePathResult = path.join(testDir, "sample-result.txt");
  const fileContents = "sample-contents";

  type Await<T> = T extends PromiseLike<infer U> ? U : T;

  let dirHash: string;
  let fileHash: string;
  let files: Await<ReturnType<typeof ipfs.ls>>;

  before("Prepare directory", () => {
    fs.mkdirSync(dirPath, { recursive: true });
    fs.writeFileSync(filepath, fileContents);
  });

  after("Clean test dir", async () => {
    await cleanTestDir();
  });

  it("Upload directory", async () => {
    dirHash = await ipfsAddDirFromFs(dirPath);
  });

  it("List directory files", async () => {
    files = await ipfs.ls({ hash: dirHash });
    fileHash = files[0].hash;
  });

  it("Download file to FS", async () => {
    await ipfs.catStreamToFs({ hash: fileHash, path: filePathResult });
    const result = fs.readFileSync(filePathResult, "utf8");
    expect(result).to.equal(fileContents, "Wrong downloaded file contents");
  });

  it("Download file to memory", async () => {
    const result = await ipfs.catString({ hash: fileHash });
    expect(result).to.equal(fileContents, "Wrong downloaded file contents");
  });

  it("Pin file", async () => {
    await pinAdd({ hash: fileHash });
  });

  it("objectSize", async () => {
    const size = await objectSize(dirHash);
    expect(size).to.be.a("number");
  });
});
