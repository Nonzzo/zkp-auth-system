const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const { cryptoService } = require('./utils/crypto');
const cryptoRoutes = require('./routes/crypto');
const keyRotationScheduler = require('./utils/crypto/KeyRotationScheduler');
const pinoHttp = require('pino-http');
const logger = require('./utils/monitoring/logger');
const prometheus = require('prom-client');
const { monitorRequest } = require('./middleware/monitoring');
const userRoutes = require('./routes/user');
const { WebSocketServer } = require('ws'); // <--- 1. Import WS
const http = require('http');

// Load environment variables
dotenv.config();

const app = express();


// Configure CORS before other middleware
app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(monitorRequest);
app.use(pinoHttp({ logger }));

// Add crypto test routes
app.use('/api', cryptoRoutes);


// Add health check endpoint with metrics
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    uptime: process.uptime()
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(await prometheus.register.metrics());
  } catch (error) {
    logger.error(error, 'Failed to get metrics');
    res.status(500).send(error);
  }
});

// Mount the auth routes with /api prefix
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// --- . Create HTTP Server explicitly ---
const server = http.createServer(app);

// --- . Attach WebSocket Server ---
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const userId = req.url.split('/').pop(); // Extract userId from URL
  logger.info(`WebSocket connected for user: ${userId}`);

  // Send initial status
  ws.send(JSON.stringify({ status: 'idle', timestamp: Date.now() }));

  ws.on('close', () => {
    logger.info(`WebSocket disconnected for user: ${userId}`);
  });
});

// Helper to broadcast updates (you can export this to use in auth.js later)
global.broadcastVerificationStatus = (userId, status) => {
  wss.clients.forEach(client => {
    // In a real app, you would map clients to userIds to send targeted updates
    if (client.readyState === 1) { 
      client.send(JSON.stringify({ status, timestamp: Date.now() }));
    }
  });
};

// Initialize crypto service and start server
async function initializeServices() {
  try {
    await cryptoService.initialize();
    logger.info('✅ Crypto service initialized successfully');

    keyRotationScheduler.start();
    logger.info('✅ Key rotation scheduler started');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('✅ Connected to MongoDB');

    // Start server after successful initialization
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Service initialization failed:', error);
    process.exit(1);
  }
}

// Start the application
initializeServices();
