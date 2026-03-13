const express = require('express');
const redis = require('redis');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to Redis
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', err => console.error('❌ Redis Client Error', err));

// 🤝 THE WAITING ROOM (Request Coalescing)
// This Map tracks requests currently being fetched from the outside world.
const pendingRequests = new Map();

async function init() {
    await client.connect();
    console.log("✅ Connected to Redis");

    app.get('/proxy', async (req, res) => {
        const targetUrl = req.query.url;

        if (!targetUrl) {
            return res.status(400).json({ error: "Please provide a ?url= query parameter" });
        }

        try {
            // 1. CHECK REDIS FIRST
            const cachedData = await client.get(targetUrl);
            if (cachedData) {
                console.log(`✨ CACHE HIT: ${targetUrl}`);
                return res.json({
                    source: 'Redis Cache',
                    data: JSON.parse(cachedData)
                });
            }

            // 2. CHECK THE WAITING ROOM (Coalescing)
            if (pendingRequests.has(targetUrl)) {
                console.log(`🤝 COALESCING: Already fetching ${targetUrl}, waiting...`);
                const data = await pendingRequests.get(targetUrl);
                return res.json({
                    source: 'Coalesced Request',
                    data: data
                });
            }

            // 3. FETCH FROM EXTERNAL API
            console.log(`🌐 API FETCH: Calling ${targetUrl}...`);
            
            // Create the promise and put it in the map
            const fetchPromise = axios.get(targetUrl).then(response => response.data);
            pendingRequests.set(targetUrl, fetchPromise);

            // Wait for the result
            const freshData = await fetchPromise;

            // 4. SAVE TO REDIS (Expires in 60 seconds)
            await client.set(targetUrl, JSON.stringify(freshData), {
                EX: 60 
            });

            // Clean up the waiting room
            pendingRequests.delete(targetUrl);

            return res.json({
                source: 'Original API',
                data: freshData
            });

        } catch (error) {
            pendingRequests.delete(targetUrl);
            console.error("❌ Error fetching data:", error.message);
            res.status(500).json({ error: "Failed to fetch data from target URL" });
        }
    });

    app.listen(PORT, () => {
        console.log(`🚀 Cache-Cloud Backend running on port ${PORT}`);
    });
}

init();