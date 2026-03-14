const axios = require('axios');
const redisService = require('../services/redisService');

const pendingRequests = new Map();
let stats = { hits: 0, misses: 0, coalesced: 0 };
let logs = [];
let globalTTL = 60; // Default TTL is 60 seconds

const addLog = (url, status) => {
    const newLog = {
        id: Date.now() + Math.random(),
        url: url.length > 50 ? url.substring(0, 47) + "..." : url,
        status,
        time: new Date().toLocaleTimeString()
    };
    logs = [newLog, ...logs].slice(0, 10);
};

const handleProxy = async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: "URL is required" });

    try {
        const cached = await redisService.get(targetUrl);
        if (cached) {
            stats.hits++;
            addLog(targetUrl, 'HIT');
            return res.json(cached);
        }

        if (pendingRequests.has(targetUrl)) {
            stats.coalesced++;
            addLog(targetUrl, 'COALESCED');
            const data = await pendingRequests.get(targetUrl);
            return res.json(data);
        }

        stats.misses++;
        addLog(targetUrl, 'MISS');

        const fetchPromise = axios.get(targetUrl).then(r => r.data);
        pendingRequests.set(targetUrl, fetchPromise);

        const data = await fetchPromise;

        // Use the globalTTL variable here instead of a hardcoded 60
        await redisService.set(targetUrl, data, globalTTL);
        pendingRequests.delete(targetUrl);

        res.json(data);
    } catch (error) {
        pendingRequests.delete(targetUrl);
        res.status(500).json({ error: "Fetch failed" });
    }
};

const getStats = (req, res) => res.json({ ...stats, ttl: globalTTL });
const getLogs = (req, res) => res.json(logs);

const updateTTL = (req, res) => {
    const { ttl } = req.body;
    if (typeof ttl !== 'number') return res.status(400).json({ error: "Invalid TTL" });
    globalTTL = ttl;
    res.json({ message: `TTL updated to ${ttl}s`, ttl: globalTTL });
};

const purgeCache = async (req, res) => {
    try {
        await redisService.client.flushAll(); 
        stats = { hits: 0, misses: 0, coalesced: 0 };
        logs = [];
        res.json({ message: "System purged" });
    } catch (error) {
        res.status(500).json({ error: "Purge failed" });
    }
};

module.exports = { handleProxy, getStats, getLogs, purgeCache, updateTTL };