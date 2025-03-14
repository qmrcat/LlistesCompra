const { List, ListUser, Item, User, Invitation } = require('../models');
const { Op } = require('sequelize');
const { emitToList } = require('../config/websocket');
const crypto = require('crypto');

// Crear una nueva lista
const createList = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la lista no puede estar vacío'
      });
    }

    // Crear nueva lista
    const newList = await List.create({
      name,
      createdBy: userId
    });

    // Agregar al usuario como propietario de la lista
    await ListUser.create({
      userId,
      listId: newList.id,
      role: 'owner'
    });

    res.status(201).json({
      success: true,
      message: 'Lista creada correctamente',
      list: newList
    });
  } catch (error) {
    console.error('Error al crear lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear lista'
    });
  }
};

// Obtener todas las listas del usuario
const getUserLists = async (req, res) => {
  try {
    const userId = req.user.id;

    // Obtener IDs de las listas donde participa el usuario
    const userLists = await ListUser.findAll({
      where: { userId },
      attributes: ['listId', 'role']
    });

    const listIds = userLists.map(ul => ul.listId);

    // Si no tiene listas, devolver arreglo vacío
    if (listIds.length === 0) {
      return res.json({
        success: true,
        lists: []
      });
    }

    // Obtener información de las listas y el último ítem
    const lists = await List.findAll({
      where: { id: listIds },
      include: [
        {
          model: User,
          attributes: ['id', 'alias'],
          through: { attributes: [] }
        }
      ]
    });

    // Formatear respuesta
    const formattedLists = lists.map(list => {
      const role = userLists.find(ul => ul.listId === list.id)?.role;
      return {
        id: list.id,
        name: list.name,
        createdBy: list.createdBy,
        participantCount: list.Users.length,
        role,
        lastItemAddedAt: list.lastItemAddedAt,
        lastItemId: list.lastItemId,
        createdAt: list.createdAt
      };
    });

    res.json({
      success: true,
      lists: formattedLists
    });
  } catch (error) {
    console.error('Error al obtener listas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener listas'
    });
  }
};

// Obtener detalle de una lista específica
const getListDetail = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;

    // Verificar si el usuario tiene acceso a la lista
    const userList = await ListUser.findOne({
      where: { userId, listId }
    });

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta lista'
      });
    }


    // Obtener detalles de la lista
    const list = await List.findByPk(listId, {
      include: [
        {
          model: User,
          attributes: ['id', 'alias'],
          through: { attributes: ['role'] }
        },
        {
          model: Item,
          include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'alias']
          }]
        },
        {
          model: Invitation,
          where: {
            accepted: false,
            expiresAt: {
              [Op.gt]: new Date()
            }
          },
          required: false,
          include: [
            {
              model: User,
              as: 'inviter',
              attributes: ['id', 'alias']
            }
          ]
        }
      ]
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        message: 'Lista no encontrada'
      });
    }

    // Formatear respuesta
    const formattedList = {
      id: list.id,
      name: list.name,
      createdBy: list.createdBy,
      createdAt: list.createdAt,
      participants: list.Users.map(user => ({
        id: user.id,
        alias: user.alias,
        role: user.ListUser.role
      })),
      items: list.Items.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        completed: item.completed,
        notes: item.notes,
        addedBy: {
          id: item.creator.id,
          alias: item.creator.alias
        },
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        typesUnits: item.typesUnits
      })),
      pendingInvitations: list.Invitations ? list.Invitations.map(invitation => ({
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        expiresAt: invitation.expiresAt,
        invitedBy: invitation.inviter ? {
          id: invitation.inviter.id,
          alias: invitation.inviter.alias
        } : null,
        createdAt: invitation.createdAt
      })) : [],
      participantCount: list.Users.length,
      userRole: userList.role
    };

    res.json({
      success: true,
      list: formattedList
    });
  } catch (error) {
    console.error('Error al obtener detalle de lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de lista'
    });
  }
};

// Invitar a un usuario a una lista
const inviteUserToList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    // Verificar si el usuario tiene permiso para invitar (debe ser owner o editor)
    const userList = await ListUser.findOne({
      where: { 
        userId, 
        listId,
        role: {
          [Op.in]: ['owner', 'editor']
        }
      }
    });

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para invitar usuarios a esta lista'
      });
    }

    // Verificar si el email ya existe como usuario
    const invitedUser = await User.findOne({ where: { email } });
    
    // Si el usuario ya existe y ya está en la lista
    if (invitedUser) {
      const alreadyInList = await ListUser.findOne({
        where: { userId: invitedUser.id, listId }
      });

      if (alreadyInList) {
        return res.status(400).json({
          success: false,
          message: 'Este usuario ya participa en la lista'
        });
      }
    }

    // Verificar si ya existe una invitación pendiente para este email
    const existingInvitation = await Invitation.findOne({
      where: {
        email,
        listId,
        accepted: false,
        expiresAt: {
          [Op.gt]: new Date()
        }
      }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una invitación pendiente para este correo electrónico'
      });
    }

    // Generar token de invitación
    const token = crypto.randomBytes(20).toString('hex');

        // Obtener información de la lista para el email
        const list = await List.findByPk(listId, {
            attributes: ['name']
          });
      
          // Obtener información del usuario que invita
          const user = await User.findByPk(userId, {
            attributes: ['alias']
          });
    
    // Crear invitación
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // Expira en 7 días
    
    const invitation = await Invitation.create({
      email,
      listId,
      invitedBy: userId,
      token,
      expiresAt: expirationDate
    });

    // Aquí normalmente enviaríamos un correo electrónico, pero está fuera del alcance de este ejemplo
    // emailService.sendInvitation(email, token, req.user.alias);
    
    // Enviar email de invitación
    const emailService = require('../services/emailService');
    await emailService.sendInvitation(
      email,
      token,
      user.alias,
      list.name
    );

    res.json({
      success: true,
      message: 'Invitación enviada correctamente',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error al invitar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar invitación'
    });
  }
};

// Aceptar invitación a una lista
const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.user.id;

    // Buscar invitación válida
    const invitation = await Invitation.findOne({
      where: {
        token,
        accepted: false,
        expiresAt: {
          [Op.gt]: new Date()
        }
      },
      include: [{ model: List }]
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitación no válida o expirada'
      });
    }

    // Verificar que el email de la invitación coincide con el del usuario
    const user = await User.findByPk(userId);
    if (user.email !== invitation.email) {
      return res.status(403).json({
        success: false,
        message: 'Esta invitación no está dirigida a tu correo electrónico'
      });
    }

    // Verificar si el usuario ya está en la lista
    const existingMember = await ListUser.findOne({
      where: { userId, listId: invitation.listId }
    });

    if (existingMember) {
      invitation.accepted = true;
      await invitation.save();
      
      return res.status(400).json({
        success: false,
        message: 'Ya eres miembro de esta lista'
      });
    }

    // Agregar usuario a la lista
    await ListUser.create({
      userId,
      listId: invitation.listId,
      role: 'editor' // Por defecto, los invitados son editores
    });

    // Marcar invitación como aceptada
    invitation.accepted = true;
    await invitation.save();

    // Notificar a los miembros de la lista vía WebSocket
    emitToList(invitation.listId, 'user:joined', {
      listId: invitation.listId,
      user: {
        id: user.id,
        alias: user.alias
      }
    });

    res.json({
      success: true,
      message: 'Te has unido a la lista correctamente',
      list: {
        id: invitation.List.id,
        name: invitation.List.name
      }
    });
  } catch (error) {
    console.error('Error al aceptar invitación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aceptar invitación'
    });
  }
};

// Obtener invitaciones pendientes para el usuario actual
const getPendingInvitations = async (req, res) => {
    try {
      const userId = req.user.id;
      const userEmail = req.user.email;
      
      // Buscar invitaciones por email que no hayan sido aceptadas y no hayan expirado
      const invitations = await Invitation.findAll({
        where: {
          email: userEmail,
          accepted: false,
          expiresAt: {
            [Op.gt]: new Date()
          }
        },
        include: [
          {
            model: List,
            attributes: ['id', 'name']
          },
          {
            model: User,
            attributes: ['id', 'alias'],
            as: 'inviter'
          }
        ]
      });
      
      // Formatear respuesta
      const formattedInvitations = invitations.map(invitation => ({
        id: invitation.id,
        token: invitation.token,
        listId: invitation.listId,
        listName: invitation.List.name,
        invitedBy: invitation.inviter ? {
          id: invitation.inviter.id,
          alias: invitation.inviter.alias
        } : null,
        expiresAt: invitation.expiresAt
      }));
      
      res.json({
        success: true,
        invitations: formattedInvitations
      });
    } catch (error) {
      console.error('Error al obtener invitaciones pendientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener invitaciones pendientes'
      });
    }
  };

 // Cancelar una invitación
const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    // Buscar la invitación
    const invitation = await Invitation.findByPk(invitationId, {
      include: [{ model: List }]
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitación no encontrada'
      });
    }

    // Verificar si el usuario tiene permiso para cancelar la invitación (propietario de la lista o quien la envió)
    const userList = await ListUser.findOne({
      where: { 
        userId, 
        listId: invitation.listId,
        role: 'owner'
      }
    });

    if (!userList && invitation.invitedBy !== userId) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cancelar esta invitación'
      });
    }

    // Eliminar la invitación
    await invitation.destroy();

    res.json({
      success: true,
      message: 'Invitación cancelada correctamente'
    });
  } catch (error) {
    console.error('Error al cancelar invitación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar invitación'
    });
  }
};

// Reenviar una invitación
const resendInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    // Buscar la invitación existente
    const invitation = await Invitation.findByPk(invitationId, {
      include: [
        { model: List },
        { model: User, as: 'inviter', attributes: ['id', 'alias'] }
      ]
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitación no encontrada'
      });
    }

    // Verificar si el usuario tiene permiso para reenviar la invitación
    const userList = await ListUser.findOne({
      where: { 
        userId, 
        listId: invitation.listId,
        role: {
          [Op.in]: ['owner', 'editor']
        }
      }
    });

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para reenviar esta invitación'
      });
    }

    // Actualizar la fecha de expiración
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // Expira en 7 días
    
    invitation.expiresAt = expirationDate;
    await invitation.save();

    // Enviar email con la invitación renovada
    const emailService = require('../services/emailService');
    const user = await User.findByPk(userId, { attributes: ['alias'] });
    
    await emailService.sendInvitation(
      invitation.email,
      invitation.token,
      user.alias,
      invitation.List.name
    );

    res.json({
      success: true,
      message: 'Invitación reenviada correctamente',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error) {
    console.error('Error al reenviar invitación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al reenviar invitación'
    });
  }
};

// Abandonar una lista
const leaveList = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;

    // Verificar si el usuario participa en la lista
    const userList = await ListUser.findOne({
      where: { 
        userId, 
        listId
      }
    });

    if (!userList) {
      return res.status(404).json({
        success: false,
        message: 'No ets membre d\'aquesta llista'
      });
    }

    // Verificar que no sea el propietario
    if (userList.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'El propietari no pot abandonar la llista. Transfereix la propietat primer o elimina la llista.'
      });
    }

    // Eliminar al usuario de la lista
    await userList.destroy();

    // Notificar a los otros miembros
    const websocketService = require('../services/websocketService');
    await websocketService.notifyUserRemoved(listId, userId);

    res.json({
      success: true,
      message: 'Has abandonat la llista correctament'
    });
  } catch (error) {
    console.error('Error al abandonar la lista:', error);
    res.status(500).json({
      success: false,
      message: 'Error al abandonar la llista'
    });
  }
};

// Rechazar una invitación
const rejectInvitation = async (req, res) => {
  try {
    // const { invitationId } = req.params;
    const { token } = req.params;

    const userId = req.user.id;
    const userEmail = req.user.email;

    // Buscar invitación válida
    const invitation = await Invitation.findOne({
      where: {
        token,
        accepted: false,
        expiresAt: {
          [Op.gt]: new Date()
        }
      },
      include: [
        { model: List },
        { model: User, as: 'inviter', attributes: ['id', 'alias'] }
      ]
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: 'Invitación no encontrada'
      });
    }

    // Verificar que la invitación es para este usuario
    if (invitation.email !== userEmail) {
      return res.status(403).json({
        success: false,
        message: 'Esta invitación no está dirigida a ti'
      });
    }

    // Guardar información antes de eliminar
    const inviterUserId = invitation.inviter ? invitation.inviter.id : null;
    const inviterAlias = invitation.inviter ? invitation.inviter.alias : 'Un usuari';
    const listId = invitation.listId;
    const listName = invitation.List ? invitation.List.name : 'una llista';

    // Eliminar la invitación
    await invitation.destroy();

    // Notificar al propietario si está conectado
    if (inviterUserId) {
      const websocketService = require('../services/websocketService');
      websocketService.notifyInvitationRejected(listId, inviterUserId, {
        listId,
        listName,
        rejectedBy: {
          id: userId,
          email: userEmail
        }
      });
    }

    res.json({
      success: true,
      message: 'Invitación rechazada correctamente'
    });
  } catch (error) {
    console.error('Error al rechazar invitación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al rechazar invitación'
    });
  }
};

///////////////////////////////////////////
// FUNCIONS INTERNES

/**
 * Obté els detalls d'una llista pel seu ID
 * @param {string} listId - ID de la llista a obtenir
 * @param {string} [section='all'] - Secció específica a retornar ('participants', 'items', 'pending', 'all')
 * @returns {Promise<Object>} - Objecte formatat amb la informació de la llista o secció sol·licitada
 */
const getListById = async (listId, section = 'all') => {
  // Obtenir detalls de la llista
  const list = await List.findByPk(listId, {
    include: [
      {
        model: User,
        attributes: ['id', 'alias'],
        through: { attributes: ['role'] }
      },
      {
        model: Item,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'alias']
        }]
      },
      {
        model: Invitation,
        where: {
          accepted: false,
          expiresAt: {
            [Op.gt]: new Date()
          }
        },
        required: false,
        include: [
          {
            model: User,
            as: 'inviter',
            attributes: ['id', 'alias']
          }
        ]
      }
    ]
  });
  
  if (!list) {
    throw new Error('Llista no trobada');
  }
  
  // Preparar les dades de cada secció
  const participants = list.Users.map(user => ({
    id: user.id,
    alias: user.alias,
    role: user.ListUser.role
  }));

  const items = list.Items.map(item => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    completed: item.completed,
    notes: item.notes,
    addedBy: {
      id: item.creator.id,
      alias: item.creator.alias
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    typesUnits: item.typesUnits
  }));

  const pendingInvitations = list.Invitations ? list.Invitations.map(invitation => ({
    id: invitation.id,
    email: invitation.email,
    token: invitation.token,
    expiresAt: invitation.expiresAt,
    invitedBy: invitation.inviter ? {
      id: invitation.inviter.id,
      alias: invitation.inviter.alias
    } : null,
    createdAt: invitation.createdAt
  })) : [];

  // Retornar només la secció sol·licitada o totes les dades
  switch (section) {
    case 'participants':
      return participants;
    case 'items':
      return items;
    case 'pending':
      return pendingInvitations;
    case 'all':
    default:
      // Formatear resposta amb totes les dades
      const formattedList = {
        id: list.id,
        name: list.name,
        createdBy: list.createdBy,
        createdAt: list.createdAt,
        participants,
        items,
        pendingInvitations,
        participantCount: participants.length
      };
      
      return formattedList;
  }
};

// Exportar funcions del controlador
module.exports = {
  createList,
  getUserLists,
  getListDetail,
  inviteUserToList,
  acceptInvitation,
  getPendingInvitations,
  cancelInvitation,
  resendInvitation,
  leaveList,
  rejectInvitation,
  getListById
};
