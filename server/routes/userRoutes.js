const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

// Proteger todas las rutas
router.use(authMiddleware);

// El archivo userController.js se implementaría con funciones
// para gestionar búsqueda de usuarios, actualización de perfil, etc.

module.exports = router;