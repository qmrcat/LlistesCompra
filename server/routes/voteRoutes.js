const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const authMiddleware = require('../middlewares/auth');

// Proteger todas las rutas
router.use(authMiddleware);

// Rutes per a les votacions dels Items (Productes)
router.post('/vote', voteController.sendVoteItem); // Votar un Item (up o down) `/api/votes/vote`, 'POST'
// router.get('/vote/item/:itemId', voteController.getItemVotes); // Obtenir tots els vots d'un item

module.exports = router;