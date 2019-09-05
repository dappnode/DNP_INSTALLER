import "mocha";
import { expect } from "chai";
import sinon from "sinon";
import { eventBusTag } from "../../src/eventBus";
import { InstallerPkg } from "../../src/types";

const proxyquire = require("proxyquire").noCallThru();

describe("Call function: installPackage", function() {
  const params = {
    DNCORE_DIR: "DNCORE",
    REPO_DIR: "test_files/"
  };

  const pkgName = "dapp.dnp.dappnode.eth";
  const pkgVer = "0.1.1";
  const pkgManifest = {
    name: pkgName,
    type: "service"
  };

  const depName = "kovan.dnp.dappnode.eth";
  const depVer = "0.1.1";
  const depManifest = {
    name: depName,
    type: "library"
  };
  const depPortsToOpen = [
    { portNumber: 32769, protocol: "UDP" },
    { portNumber: 32769, protocol: "TCP" }
  ];

  // Stub packages module. Resolve always returning nothing
  const packages = {
    download: sinon.fake.resolves(null),
    load: sinon.fake.resolves(null),
    run: sinon.fake.resolves(null)
  };

  const dappGet = sinon.fake.resolves({
    message: "Found compatible state",
    state: { [pkgName]: pkgVer, [depName]: depVer }
  });

  const getManifest = sinon.stub().callsFake(async function(pkg) {
    if (pkg.name === pkgName) return pkgManifest;
    else if (pkg.name === depName) return depManifest;
    else throw Error(`[SINON STUB] Manifest of ${pkg.name} not available`);
  });

  const eventBusPackage = {
    eventBus: {
      emit: sinon.stub()
    },
    eventBusTag
  };

  const listContainers = async () => {};

  // Simulate that only the dependency has p2p ports
  const lockPorts = sinon.stub().callsFake(async id => {
    if (id === depName) return depPortsToOpen;
    else return [];
  });

  // Simulated the chain is already synced
  const isSyncing = async () => false;

  // db to know UPnP state
  const db = {
    get: (key: string) => {
      if (key === "upnpAvailable") return true;
    }
  };

  const { default: installPackage } = proxyquire(
    "../../src/calls/installPackage",
    {
      "../modules/packages": packages,
      "../modules/dappGet": dappGet,
      "../modules/getManifest": getManifest,
      "../modules/listContainers": listContainers,
      "../modules/lockPorts": lockPorts,
      "../eventBus": eventBusPackage,
      "../utils/isSyncing": isSyncing,
      "../params": params,
      "../db": db
    }
  );

  // before(() => {
  //     const DOCKERCOMPOSE_PATH = getPath.dockerCompose(PACKAGE_NAME, params);
  //     validate.path(DOCKERCOMPOSE_PATH);
  //     fs.writeFileSync(DOCKERCOMPOSE_PATH, dockerComposeTemplate);
  // });

  it("should install the package with correct arguments", async () => {
    const res = await installPackage({ id: pkgName });
    expect(res).to.be.an("object");
    expect(res).to.have.property("message");
  });

  // Step 1: Parse request
  // Step 2: Resolve the request
  it("should have called dappGet with correct arguments", async () => {
    sinon.assert.calledWith(dappGet, { name: pkgName, req: pkgName, ver: "*" });
  });

  const callKwargPkg = {
    id: pkgName,
    pkg: {
      manifest: { ...pkgManifest },
      name: pkgName,
      ver: pkgVer,
      isCore: false
    }
  };
  const callKwargDep = {
    id: pkgName,
    pkg: {
      manifest: { ...depManifest },
      name: depName,
      ver: depVer,
      isCore: false
    }
  };

  interface SortablePkg {
    pkg: InstallerPkg;
  }
  function sortById(a: SortablePkg, b: SortablePkg) {
    return a.pkg.name > b.pkg.name ? 1 : a.pkg.name < b.pkg.name ? -1 : 0;
  }

  // Step 3: Format the request and filter out already updated packages
  // Step 4: Download requested packages
  it("should have called download", async () => {
    sinon.assert.callCount(packages.download, 2);
    expect(
      [
        packages.download.getCall(0).args[0],
        packages.download.getCall(1).args[0]
      ].sort(sortById)
    ).deep.equal(
      [callKwargPkg, callKwargDep],
      `should call packages.download for ${pkgName} and ${depName}`
    );
  });

  it("should have called load", async () => {
    sinon.assert.callCount(packages.load, 2);

    expect(
      [packages.load.getCall(0).args[0], packages.load.getCall(1).args[0]].sort(
        sortById
      )
    ).deep.equal(
      [callKwargPkg, callKwargDep],
      `should call packages.load for ${pkgName} and ${depName}`
    );
  });

  // Step 5: Run requested packages
  it("should have called run", async () => {
    sinon.assert.callCount(packages.run, 2);

    expect(
      [packages.run.getCall(0).args[0], packages.run.getCall(1).args[0]].sort(
        sortById
      )
    ).deep.equal(
      [callKwargPkg, callKwargDep],
      `should call packages.run for ${pkgName} and ${depName}`
    );
  });

  // Step 6: P2P ports: modify docker-compose + open ports
  it("should emit an internal call to the eventBus", async () => {
    sinon.assert.callCount(lockPorts, 2);
    // eventBus should be called once to open ports, and then to emitPackages
    sinon.assert.callCount(eventBusPackage.eventBus.emit, 3);
    expect(eventBusPackage.eventBus.emit.getCall(0).args).to.deep.equal(
      [eventBusTag.runNatRenewal],
      `eventBus.emit first call must be a NAT renewal call`
    );
  });

  // Step FINAL:
  it("should request to emit packages to refresh the UI", async () => {
    expect(eventBusPackage.eventBus.emit.getCall(1).args).to.deep.equal(
      [eventBusTag.emitPackages],
      `eventBus.emit second call must be to request emit packages`
    );
  });

  // it('should throw an error with wrong package name', async () => {
  //     let error = '--- removePackage did not throw ---';
  //     try {
  //         await removePackage({id: PACKAGE_NAME});
  //     } catch (e) {
  //         error = e.message;
  //     }
  //     expect(error).to.include('No docker-compose found');
  // });
});