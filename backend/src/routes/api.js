const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');

router.get('/fetch', proxyController.handleProxy);
router.get('/performance', proxyController.getStats);
router.get('/logs', proxyController.getLogs);
router.delete('/purge', proxyController.purgeCache);
router.post('/ttl', proxyController.updateTTL); // New Route

module.exports = router;