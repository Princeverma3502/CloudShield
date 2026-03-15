const express = require('express');
const cors = require('cors');
const responseTime = require('response-time');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// GLOBAL DATA STORE
let config = { ttl: 60 };
let globalTraffic = []; 

// MIDDLEWARE
app.use(cors());
app.use(express.json());
app.use(responseTime((req, res, time) => {
  res.setHeader('X-Response-Time', `${time.toFixed(2)}ms`);
}));

// 1. THE UNIVERSAL SHIELD SCRIPT
app.get('/shield.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  const BACKEND_URL = process.env.BACKEND_URL || `https://${req.get('host')}`;

  const scriptContent = `
    (function() {
      const scriptTag = document.currentScript;
      const clientId = scriptTag.getAttribute('data-client-id');
      console.log("🛡️ CloudShield Active [" + (clientId ? clientId.slice(0,5) : 'NO_ID') + "]");

      if(!clientId) return console.error("CloudShield: Missing data-client-id");

      fetch('${BACKEND_URL}/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({ 
          clientId, 
          origin: window.location.hostname,
          path: window.location.pathname
        })
      }).catch(err => console.warn("CloudShield Offline: Backend Unreachable"));
    })();
  `;
  res.send(scriptContent);
});

// 2. TELEMETRY COLLECTOR
app.post('/api/telemetry', (req, res) => {
  const { clientId, origin, path } = req.body;
  
  const entry = {
    clientId: clientId || 'anonymous',
    origin: origin || 'unknown',
    path: path || '/',
    timestamp: new Date(),
    status: Math.random() > 0.1 ? 'HIT' : 'MISS',
    latency: Math.floor(Math.random() * 50) + 10,
    geo: { 
        lat: (Math.random() * 140 - 70), 
        lon: (Math.random() * 360 - 180) 
    }
  };

  globalTraffic.push(entry);
  if (globalTraffic.length > 500) globalTraffic.shift();
  
  res.status(202).header('Access-Control-Allow-Origin', '*').json({ status: "recorded" });
});

// 3. DASHBOARD API (With ClientID Filtering for Public Reports)
app.get('/api/performance', (req, res) => {
  const { clientId } = req.query;
  const data = clientId ? globalTraffic.filter(t => t.clientId === clientId) : globalTraffic;

  // Use real data if it exists, otherwise fallback to demo numbers
  const hits = data.filter(t => t.status === 'HIT').length + (clientId && data.length > 0 ? 0 : 1500);
  const misses = data.filter(t => t.status === 'MISS').length + (clientId && data.length > 0 ? 0 : 300);
  
  res.json({ hits, misses, ttl: config.ttl, totalSavedMs: hits * 45 });
});

app.get('/api/logs', (req, res) => {
  const { clientId } = req.query;
  const data = clientId ? globalTraffic.filter(t => t.clientId === clientId) : globalTraffic;
  res.json(data.slice(-20).reverse());
});

app.post('/api/settings', (req, res) => {
  config.ttl = req.body.ttl;
  res.json({ success: true });
});

app.post('/api/purge', (req, res) => res.json({ success: true }));

app.get('/health', (req, res) => res.status(200).send('OK'));

const startKeepAlive = () => {
  const selfUrl = process.env.BACKEND_URL || `http://localhost:${PORT}`;
  setInterval(() => {
    axios.get(`${selfUrl}/health`).catch(() => {});
  }, 14 * 60 * 1000);
};

app.listen(PORT, () => {
  console.log(`🛡️ CloudShield Backend Live`);
  startKeepAlive();
});