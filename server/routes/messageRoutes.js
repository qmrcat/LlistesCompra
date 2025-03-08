const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/auth');

// Proteger todas las rutas
router.use(authMiddleware);

// Rutas para mensajes
router.post('/item/:itemId', messageController.sendMessage);
router.get('/item/:itemId', messageController.getItemMessages);
router.get('/unread/list/:listId', messageController.getUnreadMessageCount);
router.put('/read/item/:itemId', messageController.markMessagesAsRead);

module.exports = router;