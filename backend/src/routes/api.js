const express = require('express');
const router = express.Router();
const { handleProxy, getStats } = require('../controllers/proxyController');

// Route for the proxy
router.get('/fetch', handleProxy);

// Route to see performance
router.get('/performance', getStats);

module.exports = router;