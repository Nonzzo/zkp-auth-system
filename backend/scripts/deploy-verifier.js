const { execSync } = require('child_process');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function deployVerifier() {
    try {
        const circuitsDir = path.join(__dirname, '../zk-circuits');
        
        console.log('📁 Working directory:', circuitsDir);
        
        console.log('1. Compiling circuit...');
        execSync('circom circuit.circom --wasm --r1cs', {
            cwd: circuitsDir,
            stdio: 'inherit'
        });

        console.log('2. Generating zkey...');
        execSync('snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit.zkey', {
            cwd: circuitsDir,
            stdio: 'inherit'
        });

        console.log('3. Exporting verification key...');
        execSync('snarkjs zkey export verificationkey circuit.zkey verification_key.json', {
            cwd: circuitsDir,
            stdio: 'inherit'
        });

        console.log('4. Generating Solidity verifier...');
        execSync('snarkjs zkey export solidityverifier circuit.zkey Verifier.sol', {
            cwd: circuitsDir,
            stdio: 'inherit'
        });

        console.log('5. Deploying Verifier contract to Sepolia...');

        // Validate environment variables
        if (!process.env.PRIVATE_KEY || !process.env.SEPOLIA_RPC_URL) {
            throw new Error('Missing PRIVATE_KEY or SEPOLIA_RPC_URL in .env');
        }

        // Format private key (ensure it has 0x prefix)
        const privateKey = process.env.PRIVATE_KEY.startsWith('0x') 
            ? process.env.PRIVATE_KEY 
            : `0x${process.env.PRIVATE_KEY}`;

        // Setup provider and wallet first
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(privateKey, provider);

        // Verify wallet
        console.log('Wallet address:', await wallet.getAddress());
        const balance = await provider.getBalance(await wallet.getAddress());
        console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');

        // Read contract source and get pragma version
        const verifierPath = path.join(circuitsDir, 'Verifier.sol');
        console.log('Reading contract from:', verifierPath);
        const verifierSource = fs.readFileSync(verifierPath, 'utf8');
        
        // Extract Solidity version from pragma
        const pragmaLine = verifierSource.split('\n')[0];
        const versionMatch = pragmaLine.match(/pragma solidity \^?([\d.]+)/);
        const solidityVersion = versionMatch ? versionMatch[1] : '0.8.0'; // default to 0.8.0 if not found
        
        console.log(`Detected Solidity version: ${solidityVersion}`);

        // Install correct solc version if needed
        const solcVersion = `0.8.20`; // Use specific version that works with the contract
        if (!fs.existsSync(path.join(__dirname, `../node_modules/solc`))) {
            console.log(`Installing solc ${solcVersion}...`);
            execSync(`npm install solc@${solcVersion}`, { stdio: 'inherit' });
        }

        // Configure solc compiler input
        console.log('Compiling contract...');
        const input = {
            language: 'Solidity',
            sources: {
                'Verifier.sol': {
                    content: verifierSource
                }
            },
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                },
                outputSelection: {
                    '*': {
                        '*': ['abi', 'evm.bytecode']
                    }
                }
            }
        };

        // Compile contract
        const solc = require('solc');
        

        const output = JSON.parse(solc.compile(JSON.stringify(input)));

        // Check for compilation errors
        if (output.errors) {
            output.errors.forEach(error => {
                console.error('Compilation error:', error.message);
            });
            if (output.errors.some(x => x.severity === 'error')) {
                throw new Error('Compilation failed');
            }
        }

        // Get contract artifacts
        const contract = output.contracts['Verifier.sol'].Groth16Verifier;
        if (!contract) {
            throw new Error('Groth16Verifier contract not found in compilation output');
        }

        console.log('Contract compiled successfully');
        const abi = contract.abi;
        const bytecode = contract.evm.bytecode.object;

        // Deploy contract
        console.log('Deploying contract...');
        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        const deployedContract = await factory.deploy();
        await deployedContract.waitForDeployment();

        const contractAddress = await deployedContract.getAddress();
        console.log('\n✅ Verifier deployed successfully!');
        console.log('Contract address:', contractAddress);

        // Update .env file
        const envPath = path.join(__dirname, '../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        envContent = envContent.replace(
            /VERIFIER_CONTRACT=.*/,
            `VERIFIER_CONTRACT="${contractAddress}"`
        );
        fs.writeFileSync(envPath, envContent);

        console.log('\nNext steps:');
        console.log('1. Contract address has been updated in .env');
        console.log('2. Run: docker-compose down && docker-compose build && docker-compose up');

    } catch (error) {
        console.error('❌ Error:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}


deployVerifier().catch(console.error);