/**
 * Servicio para gestionar las comunicaciones WebSocket
 */

const { getIO } = require('../config/websocket');
const { User } = require('../models');

/**
 * Envía una actualización a todos los miembros de una lista
 * @param {number} listId - ID de la lista
 * @param {string} event - Nombre del evento WebSocket
 * @param {object} data - Datos a enviar
 */
const notifyListMembers = (listId, event, data) => {
  const io = getIO();
  if (io) {
    io.to(`list:${listId}`).emit(event, data);
  }
};

/**
 * Notifica que se ha añadido un ítem a una lista
 * @param {number} listId - ID de la lista
 * @param {object} item - Datos del ítem añadido
 */
const notifyItemAdded = async (listId, item) => {
  // Si es necesario, enriquecer el ítem con datos adicionales
  notifyListMembers(listId, 'item:added', {
    listId,
    item
  });
};

/**
 * Notifica que se ha actualizado un ítem en una lista
 * @param {number} listId - ID de la lista
 * @param {object} item - Datos del ítem actualizado
 */
const notifyItemUpdated = (listId, item) => {
  notifyListMembers(listId, 'item:updated', {
    listId,
    item
  });
};

/**
 * Notifica que se ha eliminado un ítem de una lista
 * @param {number} listId - ID de la lista
 * @param {number} itemId - ID del ítem eliminado
 */
const notifyItemDeleted = (listId, itemId) => {
  notifyListMembers(listId, 'item:deleted', {
    listId,
    itemId
  });
};

/**
 * Notifica que se ha eliminado un ítem de una lista
 * @param {number} listId - ID de la lista associada al mensaje eliminado
 * @param {number} itemId - ID del ítem associado al mensaje eliminado
 * @param {number} messageId - ID del message eliminado
 * @param {number} userId - sI es null se elimina el mensaje de todos los usuarios, si no solo del usuario
 * @param {number} isList - Si es un caht de lista o de ítem
 */
const notifyMessageDeleted = (listId, itemId, messageId, userId, isList = false) => {
  notifyListMembers(listId, isList ? 'message:deleted' : 'message-list:deleted', {
    listId,
    itemId: isList ? null : itemId,
    userId,
    messageId
  });
};

/**
 * Notifica que se ha actualizado una lista
 * @param {number} listId - ID de la lista
 * @param {object} list - Datos de la lista actualizada
 */
const notifyListUpdated = (listId, list) => {
  notifyListMembers(listId, 'list:updated', {
    listId,
    list
  });
};

/**
 * Notifica que un usuario se ha unido a una lista
 * @param {number} listId - ID de la lista
 * @param {number} userId - ID del usuario
 */
const notifyUserJoined = async (listId, userId) => {
  try {
    // Obtener información del usuario para incluir en la notificación
    const user = await User.findByPk(userId, {
      attributes: ['id', 'alias']
    });
    
    if (user) {
      notifyListMembers(listId, 'user:joined', {
        listId,
        user: {
          id: user.id,
          alias: user.alias
        }
      });
    }
  } catch (error) {
    console.error('Error al notificar que un usuario se unió a la lista:', error);
  }
};

/**
 * Notifica que un usuario ha sido eliminado de una lista
 * @param {number} listId - ID de la lista
 * @param {number} userId - ID del usuario
 */
const notifyUserRemoved = async (listId, userId) => {
  try {
    // Obtener información del usuario para incluir en la notificación
    const user = await User.findByPk(userId, {
      attributes: ['id', 'alias']
    });
    
    if (user) {
      notifyListMembers(listId, 'user:removed', {
        listId,
        user: {
          id: user.id,
          alias: user.alias
        }
      });
    }
  } catch (error) {
    console.error('Error al notificar que un usuario ha sido eliminado de la lista:', error);
  }
};

/**
 * Notifica que se ha cambiado el rol de un usuario en una lista
 * @param {number} listId - ID de la lista
 * @param {number} userId - ID del usuario
 * @param {string} role - Nuevo rol del usuario
 */
const notifyUserRoleChanged = async (listId, userId, role) => {
  try {
    // Obtener información del usuario para incluir en la notificación
    const user = await User.findByPk(userId, {
      attributes: ['id', 'alias']
    });
    
    if (user) {
      notifyListMembers(listId, 'user:role-changed', {
        listId,
        user: {
          id: user.id,
          alias: user.alias
        },
        role
      });
    }
  } catch (error) {
    console.error('Error al notificar cambio de rol de usuario:', error);
  }
};

/**
 * Notifica a un usuario específico que su invitación ha sido rechazada
 * @param {number} listId - ID de la lista
 * @param {number} userId - ID del usuario que envió la invitación
 * @param {object} data - Datos sobre la invitación rechazada
 */
const notifyInvitationRejected = (listId, userId, data) => {
  const io = getIO();
  if (io) {
    // Emitir evento solo a todas las sesiones del usuario que envió la invitación
    const userSockets = getUserSockets(userId);
    if (userSockets.length > 0) {
      userSockets.forEach(socket => {
        socket.emit('invitation:rejected', data);
      });
      console.log(`Notificación de invitación rechazada enviada a usuario ${userId}`);
    }
  }
};

/**
 * Obtiene todos los sockets/sesiones de un usuario específico
 * @param {number} userId - ID del usuario
 * @returns {Array} - Array de sockets del usuario
 */
const getUserSockets = (userId) => {
  const io = getIO();
  if (!io) return [];
  
  const userSockets = [];
  // Recorrer todos los sockets conectados
  for (const [socketId, socket] of io.sockets.sockets) {
    if (socket.user && socket.user.id === userId) {
      userSockets.push(socket);
    }
  }
  
  return userSockets;
};



/**
 * Notifica un nuevo mensaje a todos los miembros de una lista
 * @param {number} listId - ID de la lista
 * @param {number} itemId - ID del ítem al que pertenece el mensaje
 * @param {object} message - Datos del mensaje
 */
const notifyNewMessage = (listId, itemId, message, isList = false) => {
  console.log("🚀 ~ notifyNewMessage ~ message:", message)
  const io = getIO();
  if (io) {
    io.to(`list:${listId}`).emit((!isList ? 'message:new' : 'message-list:new'), {
      listId,
      itemId: isList ? null : itemId,
      message
    });
    console.log(`Notificación de nuevo mensaje enviada a la lista ${listId}, ítem ${itemId}`);
  }
};

/**
 * Notifica que los mensajes han sido leídos por un usuario
 * @param {number} listId - ID de la lista
 * @param {number} itemId - ID del ítem
 * @param {number} userId - ID del usuario que leyó los mensajes
 */
const notifyMessagesRead = (listId, itemId, userId, isList = false) => {
  const io = getIO();
  if (io) {
    io.to(`list:${listId}`).emit('message:read', {
      listId,
      itemId: isList ? null : itemId,
      userId
    });
    console.log(`Notificación de mensajes leídos enviada a la lista ${listId}, ítem ${itemId}`);
  }
};


module.exports = {
  notifyItemAdded,
  notifyItemUpdated,
  notifyItemDeleted,
  notifyListUpdated,
  notifyUserJoined,
  notifyUserRemoved,
  notifyUserRoleChanged,
  notifyInvitationRejected,
  notifyNewMessage,
  notifyMessagesRead,
  notifyMessageDeleted,
};