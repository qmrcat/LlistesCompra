const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/auth');

// Proteger todas las rutas
router.use(authMiddleware);

// Rutes per al missatges del Xat per al Items (Productes)
router.post('/item/:itemId', messageController.sendMessage); // Envia un missatge
router.get('/item/:itemId', messageController.getItemMessages); // Obtenir tots els missatges d'un item
router.get('/unread/list/:listId', messageController.getUnreadMessageCount); // Obtenir el nombre de missatges no llegits
router.put('/read/item/:itemId', messageController.markMessagesAsRead); // Marcar els missatges com llegits

// Rutes per al missatges del Xat de les llistes
router.post('/list/:listId', messageController.sendMessage); // Envia un missatge
router.get('/list/:listId', messageController.getItemMessages); // Obtenir tots els missatges d'una llista
router.get('/unread-list/:listId', messageController.getUnreadMessageCount); // Obtenir el nombre de missatges no llegits d'una llista
router.put('/read/list/:itemId', messageController.markMessagesAsRead); // Marcar els missatges com llegits d'una llista

module.exports = router;