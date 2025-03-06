const { ethers } = require("hardhat");

async function main() {
  // Get the deployer's address
  const [deployer] = await ethers.getSigners();

  // Deploy the Groth16Verifier contract
  const Groth16Verifier = await ethers.getContractFactory("Groth16Verifier");
  const groth16Verifier = await Groth16Verifier.deploy();
  await groth16Verifier.waitForDeployment();
  const groth16VerifierAddress = await groth16Verifier.getAddress();
  console.log("Groth16Verifier deployed at:", groth16VerifierAddress);

  // Deploy the ZKPVerifier contract and pass the deployer's address as the initialOwner
  const ZKPVerifier = await ethers.getContractFactory("ZKPVerifier");
  const zkpVerifier = await ZKPVerifier.deploy(deployer.address);
  await zkpVerifier.waitForDeployment();
  const zkpVerifierAddress = await zkpVerifier.getAddress();
  console.log("ZKPVerifier deployed at:", zkpVerifierAddress);
  console.log("Owner set to:", deployer.address);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});