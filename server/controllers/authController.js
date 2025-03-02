const { User } = require('../models');
const { generateToken } = require('../config/auth');

// Controlador para registrar un nuevo usuario
const register = async (req, res) => {
  try {
    const { email, alias, password } = req.body;

    // Verificar si ya existe un usuario con ese email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Este correo electrónico ya está registrado'
      });
    }

    // Crear el nuevo usuario
    const newUser = await User.create({
      email,
      alias,
      password
    });

    // Generar token JWT
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado correctamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        alias: newUser.alias
      },
      token
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario'
    });
  }
};

// Controlador para iniciar sesión
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        id: user.id,
        email: user.email,
        alias: user.alias
      },
      token
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión'
    });
  }
};

// Controlador para obtener el perfil del usuario
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'alias']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil de usuario'
    });
  }
};

// Controlador para actualizar alias
const updateAlias = async (req, res) => {
  try {
    const userId = req.user.id;
    const { alias } = req.body;

    if (!alias || alias.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El alias no puede estar vacío'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    user.alias = alias;
    await user.save();

    res.json({
      success: true,
      message: 'Alias actualizado correctamente',
      user: {
        id: user.id,
        email: user.email,
        alias: user.alias
      }
    });
  } catch (error) {
    console.error('Error al actualizar alias:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar alias'
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateAlias
};