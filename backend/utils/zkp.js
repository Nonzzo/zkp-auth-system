const snarkjs = require("snarkjs");
const fs = require("fs");
const { ethers } = require('ethers');
const path = require('path');

// Import the existing ABI
const VERIFIER_ABI = require('../abis/Groth16Verifier.json');


// Path constants for circuit files
const CIRCUIT_WASM = path.join(__dirname, '../zk-circuits/circuit_js/circuit.wasm');
const CIRCUIT_ZKEY = path.join(__dirname, '../zk-circuits/circuit.zkey'); 
const VERIFICATION_KEY = path.join(__dirname, '../zk-circuits/verification_key.json');

// Add debug logging
console.log('Circuit paths:', {
    CIRCUIT_WASM,
    CIRCUIT_ZKEY,
    VERIFICATION_KEY
});

/**
 * Generate a Zero-Knowledge Proof (ZKP) for authentication
 * @param {string} passwordHash - Hashed password commitment (Keccak256)
 * @param {string} providedPassword - User-entered password
 * @param {string} salt - The stored salt from registration
 * @returns {Promise<{proof: object, publicSignals: object}>}
 */
const generateProof = async (passwordHash, providedPassword, salt) => {
    try {
        if (!passwordHash || !providedPassword || !salt) {
            throw new Error('Missing required parameters for proof generation');
        }

        // Hash the provided password with salt
        const providedHash = ethers.keccak256(ethers.toUtf8Bytes(providedPassword + salt));
        
        // Convert hex strings to arrays of numbers (0-15)
        const convertHexToArray = (hexStr) => {
            const cleanHex = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
            // Take first 16 characters and convert to numbers
            const arr = Array.from(cleanHex.slice(0, 16)).map(char => {
                const num = parseInt(char, 16);
                if (isNaN(num)) {
                    throw new Error(`Invalid hex character: ${char}`);
                }
                return num;
            });
            // Pad array if needed
            while (arr.length < 16) {
                arr.push(0);
            }
            return arr;
        };

        const passwordHashArray = convertHexToArray(passwordHash);
        const providedHashArray = convertHexToArray(providedHash);

        // Validate array lengths
        passwordHashArray.forEach((num, i) => {
            if (num < 0 || num > 15) {
                throw new Error(`Invalid hex value at index ${i} in passwordHash: ${num}`);
            }
        });

        providedHashArray.forEach((num, i) => {
            if (num < 0 || num > 15) {
                throw new Error(`Invalid hex value at index ${i} in providedHash: ${num}`);
            }
        });

        const input = {
            passwordHash: passwordHashArray,
            providedPassword: providedHashArray
        };

        console.log('Debug - Circuit input validation:', {
            passwordHashLength: passwordHashArray.length,
            providedHashLength: providedHashArray.length,
            passwordHashRange: `${Math.min(...passwordHashArray)}-${Math.max(...passwordHashArray)}`,
            providedHashRange: `${Math.min(...providedHashArray)}-${Math.max(...providedHashArray)}`,
            passwordHashArray,
            providedHashArray
        });

        // Generate the proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            CIRCUIT_WASM,
            CIRCUIT_ZKEY
        );

        console.log('Debug - Proof generated successfully');
        return { proof, publicSignals };
    } catch (error) {
        console.error('Error in generateProof:', error);
        console.error('Stack trace:', error.stack);
        throw new Error(`Proof generation failed: ${error.message}`);
    }
};

/**
 * Verify a Zero-Knowledge Proof
 * @param {object} proof - The proof object
 * @param {object} publicSignals - The public signals from proof generation
 * @returns {Promise<boolean>} - True if proof is valid, otherwise false
 */

// Update verifyProof function
const verifyProof = async (proof, publicSignals) => {
    try {
        if (!proof || !publicSignals) {
            throw new Error('Missing proof or public signals');
        }

        // Validate contract address
        if (!process.env.VERIFIER_CONTRACT) {
            throw new Error('VERIFIER_CONTRACT environment variable is not set');
        }

        // Format contract address
        const verifierAddress = ethers.getAddress(process.env.VERIFIER_CONTRACT);
        console.log('Debug - Using verifier contract:', verifierAddress);

        // Convert all proof values to BigInt strings
        const formattedProof = [
            // Format pi_a (remove third component and convert to BigInt)
            [
                BigInt(proof.pi_a[0]).toString(),
                BigInt(proof.pi_a[1]).toString()
            ],
            // Format pi_b (keep first two inner arrays and convert to BigInt)
            [
                [
                    BigInt(proof.pi_b[0][1]).toString(), // Swap x and y coordinates
                    BigInt(proof.pi_b[0][0]).toString()
                ],
                [
                    BigInt(proof.pi_b[1][1]).toString(), // Swap x and y coordinates
                    BigInt(proof.pi_b[1][0]).toString()
                ]
            ],
            // Format pi_c (remove third component and convert to BigInt)
            [
                BigInt(proof.pi_c[0]).toString(),
                BigInt(proof.pi_c[1]).toString()
            ]
        ];

        // Setup provider and contract
        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        // Validate provider connection
        try {
            await provider.getNetwork();
        } catch (error) {
            throw new Error(`Failed to connect to Sepolia: ${error.message}`);
        }

        const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const verifierContract = new ethers.Contract(
            process.env.VERIFIER_CONTRACT,
            VERIFIER_ABI,
            signer
        );

        // Validate contract exists
        const code = await provider.getCode(verifierAddress);
        if (code === '0x') {
            throw new Error(`No contract found at address ${verifierAddress}`);
        }

        // Format public signals
        const formattedPublicSignals = publicSignals.map(s => BigInt(s).toString());

        console.log('Debug - Contract call details:', {
            proof: formattedProof,
            publicSignals: formattedPublicSignals,
            contractAddress: verifierAddress, // Use verifierAddress instead of verifierContract.address
            network: await provider.getNetwork().then(n => ({
                name: n.name,
                chainId: n.chainId
            }))
        });

        // Call verifyProof with properly formatted inputs
        const isValid = await verifierContract.verifyProof(
            formattedProof[0],   // pi_a
            formattedProof[1],   // pi_b
            formattedProof[2],   // pi_c
            formattedPublicSignals,
            { gasLimit: 3000000 }
        );

        if (!isValid) {
            // Compare with local verification
            const vKey = JSON.parse(fs.readFileSync(VERIFICATION_KEY));
            const localVerification = await snarkjs.groth16.verify(vKey, publicSignals, proof);
            
            console.log('Verification details:', {
                local: localVerification,
                onChain: isValid,
                proofDetails: {
                    original: {
                        pi_a: proof.pi_a,
                        pi_b: proof.pi_b,
                        pi_c: proof.pi_c
                    },
                    formatted: formattedProof
                }
            });
        }

        return isValid;

    } catch (error) {
        console.error('Error in verifyProof:', error);
        throw new Error(`Proof verification failed: ${error.message}`);
    }
};

/**
 * Hash a password with salt using Keccak256
 * @param {string} password - Plain text password
 * @param {string} salt - Salt for hashing
 * @returns {string} - Keccak256 hash of password + salt
 */
const hashPassword = (password, salt) => {
    try {
        return ethers.keccak256(ethers.toUtf8Bytes(password + salt));
    } catch (error) {
        console.error('Error in hashPassword:', error);
        throw new Error(`Password hashing failed: ${error.message}`);
    }
};

/**
 * Generate a random salt
 * @returns {string} - Hexadecimal string representing the salt
 */
const generateSalt = () => {
    try {
        return ethers.hexlify(ethers.randomBytes(32));
    } catch (error) {
        console.error('Error in generateSalt:', error);
        throw new Error(`Salt generation failed: ${error.message}`);
    }
};

module.exports = {
    generateProof,
    verifyProof,
    hashPassword,
    generateSalt
};