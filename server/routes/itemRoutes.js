const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const authMiddleware = require('../middlewares/auth');

// Proteger todas las rutas
router.use(authMiddleware);

// Rutas para ítems
router.post('/list/:listId', itemController.addItem);
router.put('/:itemId', itemController.updateItem);
router.delete('/:itemId', itemController.deleteItem);

module.exports = router;