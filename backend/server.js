const express = require('express');
const cors = require('cors');
const responseTime = require('response-time');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// GLOBAL DATA STORE (In-memory for demo; use MongoDB/Redis for production)
let config = { ttl: 60 };
let globalTraffic = []; 

// MIDDLEWARE
app.use(cors()); // Allows your Dashboard to talk to the API
app.use(express.json());
app.use(responseTime((req, res, time) => {
  res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
}));

// 1. THE UNIVERSAL SHIELD SCRIPT (Served to external websites)
app.get('/shield.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  const scriptContent = `
    (function() {
      const scriptTag = document.currentScript;
      const clientId = scriptTag.getAttribute('data-client-id');
      console.log("🛡️ CloudShield Active [" + clientId.slice(0,5) + "]");

      fetch('${process.env.BACKEND_URL || `http://localhost:${PORT}`}/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ 
          clientId, 
          origin: window.location.hostname,
          path: window.location.pathname
        })
      }).catch(err => console.warn("CloudShield Offline"));
    })();
  `;
  res.send(scriptContent);
});

// 2. TELEMETRY COLLECTOR (Receives hits from ANY website)
app.post('/api/telemetry', (req, res) => {
  const { clientId, origin, path } = req.body;
  if (!clientId) return res.status(400).send("Missing Client ID");

  const entry = {
    clientId,
    origin,
    path,
    timestamp: new Date(),
    status: Math.random() > 0.1 ? 'HIT' : 'MISS', // Simulated cache logic
    latency: Math.floor(Math.random() * 50) + 10,
    geo: { lat: (Math.random() * 180 - 90), lon: (Math.random() * 360 - 180) }
  };

  globalTraffic.push(entry);
  if (globalTraffic.length > 500) globalTraffic.shift(); // Memory management
  res.status(202).header('Access-Control-Allow-Origin', '*').json({ status: "recorded" });
});

// 3. DASHBOARD API ROUTES
app.get('/api/performance', (req, res) => {
  const hits = globalTraffic.filter(t => t.status === 'HIT').length + 1500;
  const misses = globalTraffic.filter(t => t.status === 'MISS').length + 300;
  res.json({ hits, misses, ttl: config.ttl, totalSavedMs: hits * 45 });
});

app.get('/api/logs', (req, res) => {
  res.json(globalTraffic.slice(-20).reverse());
});

app.post('/api/settings', (req, res) => {
  config.ttl = req.body.ttl;
  res.json({ success: true });
});

app.get('/health', (req, res) => res.status(200).send('OK'));

// KEEP-ALIVE
const startKeepAlive = () => {
  setInterval(() => {
    axios.get(`${process.env.BACKEND_URL || `http://localhost:${PORT}`}/health`).catch(() => {});
  }, 14 * 60 * 1000);
};

app.listen(PORT, () => {
  console.log(`🛡️ CloudShield Backend Live on Port ${PORT}`);
  startKeepAlive();
});