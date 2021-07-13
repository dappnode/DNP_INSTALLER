import { bitcoin } from "./bitcoin";
import { MockDnp, PortProtocol } from "./types";

const dnpName = "lightning-network.dnp.dappnode.eth";
const serviceName = dnpName;

export const lightningNetwork: MockDnp = {
  dependencies: [bitcoin],

  avatar: dnpName,

  metadata: {
    name: "lightning-network.dnp.dappnode.eth",
    version: "0.0.3",
    upstreamVersion: "0.6.1-beta",
    shortDescription: "Scalable, instant Bitcoin/Blockchain transactions",
    description: "The Lightning Network DAppNodePackage (lnd + RTL). The Lightning Network is a decentralized system for instant, high-volume micropayments that removes the risk of delegating custody of funds to trusted third parties.".repeat(
      10
    ),
    type: "service",
    backup: [{ name: "data", path: "/root/.lnd/data" }],
    style: {
      featuredBackground: "linear-gradient(67deg, #090909, #2f1354)",
      featuredColor: "#eee"
    },
    author:
      "DAppNode Association <admin@dappnode.io> (https://github.com/dappnode)",
    contributors: [
      "Abel Boldú (@vdo)",
      "Eduardo Antuña <eduadiez@gmail.com> (https://github.com/eduadiez)"
    ],
    categories: ["Payment channels", "Economic incentive"],
    keywords: ["bitcoin", "btc", "lightning network", "lnd"],
    links: {
      homepage:
        "https://github.com/dappnode/DAppNodePackage-LightningNetwork#readme",
      ui: "http://lightning-network.dappnode",
      api: "http://lightning-network.dappnode:8080",
      another: "http://lightning-network.dappnode"
    },
    repository: {
      type: "git",
      url:
        "git+https://github.com/dappnode/DAppNodePackage-LightningNetwork.git"
    },
    bugs: {
      url: "https://github.com/dappnode/DAppNodePackage-LightningNetwork/issues"
    },
    disclaimer: {
      message:
        "This software is experimental, presented 'as is' and inherently carries risks. By installing it, you acknowledge that DAppNode Association has done its best to mitigate these risks and accept to waive any liability or responsibility for DAppNode in case of any shortage, discrepancy, damage, loss or destruction of any digital asset managed within this DAppNode package.\n\nThis package stores private keys, which will be stored in your DAppNode. Neither DAppNode Association nor the developers of this software can have access to your private key, nor help you recover it if you lose it. \n\nYou are solely responsible for keeping your private keys and password safe and to perform secure backups, as well as to restrict access to your computer and other equipment. To the extent permitted by applicable law, you agree to be responsible for all activities that have been conducted from your account. You must take all necessary steps to ensure that your private key, password, and/or recovery phrase remain confidential and secured."
    },
    license: "GPL-3.0",
    dependencies: {
      "bitcoin.dnp.dappnode.eth": "latest"
    }
  },

  setupWizard: {
    version: "2",
    fields: [
      {
        id: "rtlPassword",
        target: {
          type: "environment",
          name: "RTL_PASSWORD"
        },
        title: "RTL password",
        description: "Password to protect RTL",
        pattern: "^.{8,}$",
        patternErrorMessage: "Must be at least 8 characters long",
        secret: true,
        required: true
      },
      {
        id: "network",
        target: {
          type: "environment",
          name: "NETWORK"
        },
        title: "Network",
        description: "Choose which network to connect to",
        enum: ["mainnet", "testnet"]
      },
      {
        id: "onlyTestnet",
        target: {
          type: "environment",
          name: "ONLY_TESTNET"
        },
        title: "Only testnet",
        description:
          "Mock variable that should only be visible if `network = testnet`",
        required: true,
        if: {
          network: { enum: ["testnet"] }
        }
      }
    ]
  },

  userSettings: {
    portMappings: { [serviceName]: { "9735": "9735" } },
    namedVolumeMountpoints: { lndconfig_data: "" },
    environment: {
      [serviceName]: {
        RTL_PASSWORD: "",
        RPCUSER: "dappnode",
        RPCPASS: "dappnode",
        BITCOIND_HOST: "my.bitcoin.dnp.dappnode.eth",
        NETWORK: "mainnet",
        ALIAS: "",
        COLOR: "#5ACDC5",
        EXT_IP: ""
      }
    }
  },

  gettingStarted: `
**Accessing the ADMIN UI**\n\nOnce the node is synced, you can access your LN node [admin UI here](https://lightning-network.dappnode)\n\n**How to download macaroons**\n\nUsually Lightning Network applications require files called *macaroons* for authorizations to perform operations on the LND node. There are many types depending on the level of access.\nTo download the admin macaroon, you should go to the Admin panel of DAppnode: \nPackages -> My packages -> Lightning-Network -> File manager\nThen input in the 'Download from DNP' field:\n\`\`\`\n/config/data/chain/bitcoin/mainnet/admin.macaroon\n\`\`\`\n\n**How to use Joule extension with DAppNode**\n\nJoule is an extension available for many browsers which lets you use your node to make payments, invoices, open channels and more. Check the website: https://lightningjoule.com/\n* To run Joule, first you need to download these macaroons in a safe folder, as described above:\n\`\`\`\n/config/data/chain/bitcoin/mainnet/admin.macaroon\n/config/data/chain/bitcoin/mainnet/readonly.macaroon\n\`\`\`\n* When asked on the type of node, select Remote and then enter the following url: \n   https://lightning-network.dappnode:8080\n   * You will need to accept the SSL certificate in the next step\n* Upload the macaroons, choose a password to encrypt the data, and you're ready to go!\n* **Enjoy!** But be aware both LND and RTL are beta software .Only use funds you can afford to lose.  Don't be completely #Reckless ;) \n\n <img src="https://i.imgur.com/66P7Aei.png" width="500px" height="100%"> \n\n ![](https://i.imgur.com/66P7Aei.png) \n\n\n ![](https://i.ibb.co/cvw9f9K/download.png)


**Blockquotes**

As Kanye West said:

> We're living the future so
> the present is our past.      


**Syntax highlighting**

\`\`\`js
function fancyAlert(arg) {
  if(arg) {
    $.facebox({div:'#foo'})
  }
}
\`\`\`


**Task Lists**
- [x]  this is a complete item
- [ ]  this is an incomplete item


**Tables**

First Header | Second Header
------------ | -------------
Content from cell 1 | Content from cell 2
Content in the first column | Content in the second column

        `,

  installedData: {
    version: "0.1.0",
    userSettings: {
      environment: {
        [serviceName]: {
          ENV_NAME: "ENV_VALUE"
        }
      }
    },
    updateAvailable: {
      newVersion: "0.1.1",
      upstreamVersion: "0.7.0-beta"
    },
    packageSentData: {
      apiKey: "AAXXAAXXAAXXAAXXAAXXAAXXAAXXAAXXAAXXAAXX",
      secretKey: "ZZXXZZXXZZXXZZXXZZXXZZXXZZXXZZXXZZXXZZXX"
    }
  },
  installedContainers: {
    [serviceName]: {
      state: "running",
      ports: [
        {
          host: 30303,
          container: 30303,
          protocol: PortProtocol.TCP
        },
        {
          host: 30303,
          container: 30303,
          protocol: PortProtocol.UDP
        }
      ],
      volumes: [
        {
          name: "lightning-networkpublicdappnodeeth_data",
          host: "data",
          container: "./data/ethereum"
        }
      ]
    }
  }
};
