const express = require('express');
const { chat } = require('../controllers/chatbot.controller');

const router = express.Router();
router.post('/chat', chat);

module.exports = router;
