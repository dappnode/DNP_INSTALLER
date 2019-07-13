const proxyquire = require("proxyquire");
const expect = require("chai").expect;

describe("Module > passwordManager", () => {
  const checkImageCmd = `docker ps --filter "name=dappmanager.dnp.dappnode.eth" --format "{{.Image}}"`;
  const image = "dappmanager.dnp.dappnode.eth:0.2.0";
  const grepCommand = `docker run --rm -v /etc:/etc --privileged --entrypoint="" dappmanager.dnp.dappnode.eth:0.2.0 sh -c "grep dappnode:.*insecur3 /etc/shadow"`;
  const passwordHash = `dappnode:$6$insecur3$rnEv9Amdjn3ctXxPYOlzj/cwvLT43GjWzkPECIHNqd8Vvza5bMG8QqMwEIBKYqnj609D.4ngi4qlmt29dLE.71:18004:0:99999:7:::`;

  it("Should check if the password is secure", async () => {
    const { isPasswordSecure } = proxyquire("modules/passwordManager", {
      "utils/shell": async cmd => {
        if (cmd === checkImageCmd) return image;
        if (cmd == grepCommand) return passwordHash;
        throw Error(`Unknown command ${cmd}`);
      }
    });
    const isSecure = await isPasswordSecure();
    expect(isSecure).to.equal(false);
  });

  it("Should change the password", async () => {
    let lastCmd;
    const { changePassword } = proxyquire("modules/passwordManager", {
      "utils/shell": async cmd => {
        lastCmd = cmd;
        if (cmd === checkImageCmd) return image;
        if (cmd == grepCommand) return passwordHash;
        if (cmd.includes("chpasswd")) return "";
        throw Error(`Unknown command ${cmd}`);
      }
    });

    const newPassword = "secret-password";
    await changePassword(newPassword);
    expect(lastCmd).to.equal(
      `docker run --rm -v /etc:/etc --privileged --entrypoint="" dappmanager.dnp.dappnode.eth:0.2.0 sh -c "echo dappnode:${newPassword} | chpasswd"`
    );
  });

  it("Should block changing the password when it's secure", async () => {
    const { changePassword } = proxyquire("modules/passwordManager", {
      "utils/shell": async cmd => {
        if (cmd === checkImageCmd) return image;
        if (cmd == grepCommand) return "";
        throw Error(`Unknown command ${cmd}`);
      }
    });

    let errorMessage = "---did not throw---";
    try {
      await changePassword("password");
    } catch (e) {
      errorMessage = e.message;
    }

    expect(errorMessage).to.equal(
      `The password can only be changed if it's the insecure default`
    );
  });
});