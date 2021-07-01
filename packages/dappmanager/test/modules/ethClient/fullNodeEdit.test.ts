import "mocha";
import { expect } from "chai";
import { shellSafe } from "../../testUtils";
import fs from "fs";
import {
  removeFullnodeAliasFromCompose,
  addFullnodeAliasToCompose
} from "../../../src/modules/ethClient/changeEthMultiClient";

// The following test will wite a compose with the alias fullnode.dappnode:
// 1. Then will remove such aslias and test it
// 2. With the existing edited compose will add back again the alias: fullnode.dappnode and test it

describe("Edit fullnode in eth client", () => {
  const composeWithFullnodeAlias = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    dns: 172.33.1.2
    environment:
      - 'EXTRA_OPTIONS=--http.api eth,net,web3,txpool'
    image: 'goerli-geth.dnp.dappnode.eth:0.4.12'
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: '3'
    networks:
      dncore_network:
        aliases:
          - goerli-geth.dappnode
          - fullnode.dappnode
    ports:
      - '30303'
      - 30303/udp
      - 30304/udp
    restart: always
    volumes:
      - 'goerli:/goerli'
    labels:
      dappnode.dnp.dnpName: goerli-geth.dnp.dappnode.eth
      dappnode.dnp.version: 0.4.12
volumes:
  goerli: {}
networks:
  dncore_network:
    external: true
`;

  const composeWithOutFullnodeAlias = `
version: '3.5'
services:
  goerli-geth.dnp.dappnode.eth:
    container_name: DAppNodePackage-goerli-geth.dnp.dappnode.eth
    dns: 172.33.1.2
    environment:
      - 'EXTRA_OPTIONS=--http.api eth,net,web3,txpool'
    image: 'goerli-geth.dnp.dappnode.eth:0.4.12'
    logging:
      driver: json-file
      options:
        max-size: 10m
        max-file: '3'
    networks:
      dncore_network:
        aliases:
          - goerli-geth.dappnode
    ports:
      - '30303'
      - 30303/udp
      - 30304/udp
    restart: always
    volumes:
      - 'goerli:/goerli'
    labels:
      dappnode.dnp.dnpName: goerli-geth.dnp.dappnode.eth
      dappnode.dnp.version: 0.4.12
volumes:
  goerli: {}
networks:
  dncore_network:
    external: true
`;

  // Example package
  const dnpName = "example";
  const serviceName = "goerli-geth.dnp.dappnode.eth";
  const dnpRepoExamplePath = process.cwd() + "/dnp_repo/example";

  before("Create random compose to be edited", async () => {
    // Create necessary dir
    await shellSafe(`mkdir ${dnpRepoExamplePath}`);
    // Create example compose with fullnode
    fs.writeFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      composeWithFullnodeAlias
    );
  });

  it("Should remove alias: fullnode.dappnode", () => {
    // Edit existing compose
    removeFullnodeAliasFromCompose(dnpName, serviceName);

    // Get edited compose
    const composeAfter = fs.readFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      "utf-8"
    );

    expect(composeAfter.trim()).to.equal(composeWithOutFullnodeAlias.trim());
  });

  it("Should add alias: fullnode.dappnode", () => {
    // Edit existing compose
    addFullnodeAliasToCompose(dnpName, serviceName);

    // Get edited compose
    const composeAfter = fs.readFileSync(
      `${dnpRepoExamplePath}/docker-compose.yml`,
      "utf-8"
    );

    expect(composeAfter.trim()).to.equal(composeWithFullnodeAlias.trim());
  });

  after("Remove setup", async () => {
    await shellSafe(`rm -rf ${dnpRepoExamplePath}`);
  });
});
