const redis = require('redis');
const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

const connectRedis = async () => {
    if (!client.isOpen) await client.connect();
};

module.exports = {
    client,
    connectRedis,
    // Helper to get data
    get: async (key) => {
        const data = await client.get(key);
        return data ? JSON.parse(data) : null;
    },
    // Helper to save data for 60 seconds
    set: async (key, value, ttl = 60) => {
        await client.set(key, JSON.stringify(value), { EX: ttl });
    }
};