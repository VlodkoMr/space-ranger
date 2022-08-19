require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  networks: {
    hardhat: {
      mining: {
        auto: false,
        interval: 1000
      }
    },
    mumbai_testnet: {
      url: process.env.MUMBAI_TESTNET_URL,
      accounts: process.env.MUMBAI_TESTNET_PRIVATE_KEY !== undefined ? [process.env.MUMBAI_TESTNET_PRIVATE_KEY] : [],
    },
    polygon_mainnet: {
      url: "https://polygon-rpc.com",
      accounts: process.env.POLYGON_MAINNET_PRIVATE_KEY !== undefined ? [process.env.POLYGON_MAINNET_PRIVATE_KEY] : [],
    },
  },
};
