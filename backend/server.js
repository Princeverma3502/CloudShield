require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectRedis } = require('./src/services/redisService');
const apiRoutes = require('./src/routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

const start = async () => {
    try {
        await connectRedis();
        console.log("✅ Redis Connected");
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start:", err);
    }
};

start();