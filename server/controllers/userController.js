const { User, List, ListUser } = require('../models');
const { Op } = require('sequelize');

// Buscar usuarios por correo electrónico
const searchUsersByEmail = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Es necesario proporcionar un correo electrónico para la búsqueda'
      });
    }
    
    // Buscar usuarios que coincidan parcialmente con el correo
    const users = await User.findAll({
      where: {
        email: {
          [Op.like]: `%${email}%`
        },
        id: {
          [Op.ne]: req.user.id // Excluir al usuario actual
        }
      },
      attributes: ['id', 'email', 'alias'],
      limit: 10
    });
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar usuarios'
    });
  }
};

// Obtener información de un usuario específico
const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    
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
    console.error('Error al obtener información del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del usuario'
    });
  }
};

// Obtener listas compartidas con un usuario específico
const getSharedLists = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;
    
    // Verificar que el usuario existe
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    // Obtener listas donde participan ambos usuarios
    const listUsers = await ListUser.findAll({
      where: {
        userId: currentUserId
      },
      attributes: ['listId']
    });
    
    const listIds = listUsers.map(lu => lu.listId);
    
    const sharedListUsers = await ListUser.findAll({
      where: {
        userId,
        listId: {
          [Op.in]: listIds
        }
      },
      include: [
        {
          model: List,
          attributes: ['id', 'name', 'createdBy']
        }
      ]
    });
    
    const sharedLists = sharedListUsers.map(slu => ({
      id: slu.List.id,
      name: slu.List.name,
      createdBy: slu.List.createdBy,
      role: slu.role
    }));
    
    res.json({
      success: true,
      sharedLists
    });
  } catch (error) {
    console.error('Error al obtener listas compartidas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener listas compartidas'
    });
  }
};

// Cambiar el rol de un usuario en una lista
const changeUserRole = async (req, res) => {
  try {
    const { listId, userId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.id;
    
    // Verificar roles válidos
    const validRoles = ['owner', 'editor', 'viewer'];
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Los roles permitidos son: owner, editor, viewer'
      });
    }
    
    // Verificar si el usuario actual es propietario de la lista
    const currentUserList = await ListUser.findOne({
      where: {
        userId: currentUserId,
        listId,
        role: 'owner'
      }
    });
    
    if (!currentUserList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cambiar roles en esta lista'
      });
    }
    
    // Verificar si el usuario a modificar existe en la lista
    const targetUserList = await ListUser.findOne({
      where: {
        userId,
        listId
      }
    });
    
    if (!targetUserList) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no pertenece a esta lista'
      });
    }
    
    // No permitir cambiar el rol de uno mismo (para no quedarse sin propietarios)
    if (parseInt(userId) === currentUserId && role !== 'owner') {
      return res.status(400).json({
        success: false,
        message: 'No puedes cambiar tu propio rol de propietario'
      });
    }
    
    // Cambiar el rol
    targetUserList.role = role;
    await targetUserList.save();
    
    res.json({
      success: true,
      message: 'Rol de usuario actualizado correctamente',
      userList: {
        userId: targetUserList.userId,
        listId: targetUserList.listId,
        role: targetUserList.role
      }
    });
  } catch (error) {
    console.error('Error al cambiar rol de usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar rol de usuario'
    });
  }
};

// Eliminar un usuario de una lista
const removeUserFromList = async (req, res) => {
  try {
    const { listId, userId } = req.params;
    const currentUserId = req.user.id;
    
    // Verificar si el usuario actual es propietario de la lista
    const currentUserList = await ListUser.findOne({
      where: {
        userId: currentUserId,
        listId,
        role: 'owner'
      }
    });
    
    if (!currentUserList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar usuarios de esta lista'
      });
    }
    
    // No permitir eliminar al propietario de la lista
    const targetUserList = await ListUser.findOne({
      where: {
        userId,
        listId
      }
    });
    
    if (!targetUserList) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no pertenece a esta lista'
      });
    }
    
    // No permitir eliminar a uno mismo
    if (parseInt(userId) === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminarte a ti mismo de la lista. Transfiere la propiedad primero'
      });
    }
    
    // Eliminar al usuario de la lista
    await targetUserList.destroy();
    
    res.json({
      success: true,
      message: 'Usuario eliminado de la lista correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario de la lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario de la lista'
    });
  }
};

module.exports = {
  searchUsersByEmail,
  getUserInfo,
  getSharedLists,
  changeUserRole,
  removeUserFromList
};