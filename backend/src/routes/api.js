const express = require('express');
const router = express.Router();
const proxyController = require('../controllers/proxyController');

router.get('/fetch', proxyController.handleProxy);
router.get('/performance', proxyController.getStats); 

module.exports = router;