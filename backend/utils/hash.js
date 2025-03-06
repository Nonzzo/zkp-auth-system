const { ethers } = require("ethers");

/**
 * Hash a password using Keccak256 with a salt
 * @param {string} password - User's password
 * @param {string} salt - Randomly generated salt
 * @returns {string} - Hashed password commitment
 */
const hashPassword = (password, salt) => {
    return ethers.keccak256(ethers.toUtf8Bytes(password + salt));
};

/**
 * Generate a random salt
 * @returns {string} - Randomly generated salt
 */
const generateSalt = () => {
    return ethers.hexlify(ethers.randomBytes(16)); // 16-byte random salt
};

module.exports = { hashPassword, generateSalt };
