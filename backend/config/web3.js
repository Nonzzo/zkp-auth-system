require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Load environment variables
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Load contract ABIs
const zkAuthAbi = JSON.parse(fs.readFileSync(path.join(__dirname, "../abis/ZKPVerifier.json")));
const verifierAbi = JSON.parse(fs.readFileSync(path.join(__dirname, "../abis/Groth16Verifier.json")));

// Initialize contract instances
const zkAuthContract = new ethers.Contract(process.env.ZKPAUTH_CONTRACT, zkAuthAbi, wallet);
const verifierContract = new ethers.Contract(process.env.VERIFIER_CONTRACT, verifierAbi, wallet);

module.exports = { zkAuthContract, verifierContract };