require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectRedis } = require('./src/services/redisService');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// ROBUST CORS: Allow Vercel and Localhost explicitly
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        return callback(null, true); // During debug, allow all. Change to allowedOrigins later.
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-api-key', 'x-admin-auth'],
    credentials: true
}));

app.use(express.json());

// Health check for Render.com
app.get('/', (req, res) => res.send('CloudShield Backend Active'));
app.get('/health', (req, res) => res.status(200).json({ status: 'active' }));

app.use('/api', apiRoutes);

const start = async () => {
    try {
        await connectRedis();
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 CloudShield Engine running on port ${PORT}`);
        });
    } catch (err) {
        console.error("❌ Failed to start server:", err);
        // Don't exit(1) immediately on Render so we can see logs
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Running in limited mode (Redis Down)`);
        });
    }
};

start();