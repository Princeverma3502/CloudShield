const axios = require('axios');
const redisService = require('../services/redisService');

const pendingRequests = new Map();
let stats = { hits: 0, misses: 0, coalesced: 0 };

const handleProxy = async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: "URL is required" });

    try {
        // 1. Try Cache
        const cached = await redisService.get(targetUrl);
        if (cached) {
            stats.hits++;
            return res.json({ source: 'CACHE', stats, data: cached });
        }

        // 2. Try Coalescing (Waiting Room)
        if (pendingRequests.has(targetUrl)) {
            stats.coalesced++;
            const data = await pendingRequests.get(targetUrl);
            return res.json({ source: 'COALESCED', stats, data });
        }

        // 3. Fresh Fetch
        stats.misses++;
        const fetchPromise = axios.get(targetUrl).then(r => r.data);
        pendingRequests.set(targetUrl, fetchPromise);

        const data = await fetchPromise;
        await redisService.set(targetUrl, data);
        pendingRequests.delete(targetUrl);

        res.json({ source: 'API', stats, data });
    } catch (error) {
        pendingRequests.delete(targetUrl);
        res.status(500).json({ error: "Fetch failed" });
    }
};

const getStats = (req, res) => res.json(stats);

module.exports = { handleProxy, getStats };