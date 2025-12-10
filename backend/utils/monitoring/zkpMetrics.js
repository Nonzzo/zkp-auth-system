const prometheus = require('prom-client');

// Proof generation histogram
const proofGenerationDuration = new prometheus.Histogram({
  name: 'zkp_proof_generation_seconds',
  help: 'Time taken to generate a ZK proof in seconds',
  labelNames: ['status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// Proof verification histogram
const proofVerificationDuration = new prometheus.Histogram({
  name: 'zkp_proof_verification_seconds',
  help: 'Time taken to verify a ZK proof in seconds',
  labelNames: ['status'],
  buckets: [0.05, 0.1, 0.5, 1, 2, 5]
});

// Authentication attempts counter
const authAttempts = new prometheus.Counter({
  name: 'zkp_auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['result']
});

// Proof generation counter
const proofGenerated = new prometheus.Counter({
  name: 'zkp_proof_generated_total',
  help: 'Total proofs generated',
  labelNames: ['status']
});

// Proof verification counter
const proofVerified = new prometheus.Counter({
  name: 'zkp_proof_verified_total',
  help: 'Total proofs verified',
  labelNames: ['result']
});

// Active verification attempts gauge
const activeVerifications = new prometheus.Gauge({
  name: 'zkp_active_verifications',
  help: 'Number of currently active verification processes'
});

// User registration counter
const usersRegistered = new prometheus.Counter({
  name: 'zkp_users_registered_total',
  help: 'Total users registered'
});

// Circuit compilation time
const circuitCompileTime = new prometheus.Histogram({
  name: 'zkp_circuit_compile_seconds',
  help: 'Time taken to compile circuit',
  buckets: [1, 5, 10, 30, 60]
});

const cryptoOpsLatency = new prometheus.Histogram({
  name: 'zkp_crypto_ops_latency_seconds',
  help: 'Latency of crypto operations',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1]
});

module.exports = {
  proofGenerationDuration,
  proofVerificationDuration,
  authAttempts,
  proofGenerated,
  proofVerified,
  activeVerifications,
  usersRegistered,
  circuitCompileTime,
  cryptoOpsLatency
};