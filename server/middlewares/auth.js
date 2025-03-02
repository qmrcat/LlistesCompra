const { verifyToken } = require('../config/auth');
const { User } = require('../models');

// Middleware para verificar autenticación
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado. Token no proporcionado' 
      });
    }

    // Verificar el token
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido o expirado' 
      });
    }

    // Verificar que el usuario existe en la base de datos
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Agregar el usuario al objeto de solicitud
    req.user = {
      id: user.id,
      email: user.email,
      alias: user.alias
    };

    next();
  } catch (error) {
    console.error('Error de autenticación:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error de autenticación' 
    });
  }
};

module.exports = authMiddleware;