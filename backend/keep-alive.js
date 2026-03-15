const axios = require('axios');

const URL = 'https://cloudshield-backend.onrender.com';

const startKeepAlive = () => {
  setInterval(async () => {
    try {
      const res = await axios.get(URL);
      console.log(`[KEEP-ALIVE] Ping successful: ${res.status} at ${new Date().toISOString()}`);
    } catch (e) {
      console.error(`[KEEP-ALIVE] Ping failed: ${e.message}`);
    }
  }, 14 * 60 * 1000); // 14 minutes
};

module.exports = startKeepAlive;