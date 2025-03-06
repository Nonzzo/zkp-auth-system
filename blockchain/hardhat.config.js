require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // Load environment variables from .env file

module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, // Sepolia Alchemy endpoint
      accounts: [process.env.SEPOLIA_PRIVATE_KEY], // Use your deployer's private key
    },
  },
};