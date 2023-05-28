require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  defaultNetwork: "localhost",
  networks: {
    localhost: {},
    chiado: {
      url: 'https://rpc.chiadochain.net', 
      chainId: 10200, 
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};
