import * as dotenv from "dotenv";

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";

// tasks
import "./resources/tasks/accounts";

dotenv.config();

const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      chainId: 1,
      blockGasLimit: 90000000,
      // allowUnlimitedContractSize: true,
    },
    niletestnet: {
      url: "https://nile.trongrid.io",
      // chainId: 97,
      accounts: ["d6c12ee57f6a0bbaeb823a4c34e61fe2d2da0557a392392b979ab46c97c2cc5f"],
      // gasPrice:9000000000
      timeout: 900000
    },
    bscmainnet: {
      // https://docs.bnbchain.org/docs/rpc/
      url: "https://bsc-dataseed2.defibit.io",
      chainId: 56,
      accounts: ["c2713624c5aaeb629e5fdaf3dc7f57fe69eeae8397cb8d581db8db00e1909c15"],
      // gasPrice:6000000000,
      timeout: 900000
    }
  },
  solidity: {
    compilers: [
      {
        version: "0.8.8",
        settings: {
          optimizer: {
            enabled: true,
            runs: 9999,
          },
          metadata: {
            bytecodeHash: "none",
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 9999,
          },
          metadata: {
            bytecodeHash: "none",
          },
        },
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    // enabled: false,
    // gasPrice: 21,
    currency: "USD",
  },
  typechain: {
    outDir: "./resources/types",
    target: "ethers-v5",
  },
  paths: {
    tests: "./resources/test",
  },
  etherscan: {
    apiKey: {
      bsc: "SX4ZSNXD39A54A94QIVH8Q92EEK5GDSZRD"
      // bscTestnet: "SX4ZSNXD39A54A94QIVH8Q92EEK5GDSZRD"
    }
  }
};

export default config;
