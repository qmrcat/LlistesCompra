const { Message, User, Item, List, ListUser } = require('../models');
const { Op } = require('sequelize');
const websocketService = require('../services/websocketService');

// Enviar un nuevo mensaje
const sendMessage = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Verificar si el ítem existe
    const item = await Item.findByPk(itemId, {
      include: [{ model: List }]
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Ítem no encontrado'
      });
    }

    // Verificar si el usuario pertenece a la lista
    const userList = await ListUser.findOne({
      where: {
        userId,
        listId: item.listId
      }
    });

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para enviar mensajes en esta lista'
      });
    }

    // Crear el mensaje
    const message = await Message.create({
      content,
      itemId: parseInt(itemId),
      senderId: userId,
      readBy: [userId] // El remitente ya lo ha leído
    });

    // Obtener el mensaje con información del remitente
    const messageWithSender = await Message.findByPk(message.id, {
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'alias']
      }]
    });

    // Formatear la respuesta
    const formattedMessage = {
      id: messageWithSender.id,
      content: messageWithSender.content,
      itemId: messageWithSender.itemId,
      sender: {
        id: messageWithSender.sender.id,
        alias: messageWithSender.sender.alias
      },
      readBy: messageWithSender.readBy,
      createdAt: messageWithSender.createdAt
    };

    // Notificar por WebSocket
    websocketService.notifyNewMessage(item.listId, parseInt(itemId), formattedMessage);

    res.status(201).json({
      success: true,
      message: 'Mensaje enviado correctamente',
      data: formattedMessage
    });
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar mensaje'
    });
  }
};

// Obtener mensajes de un ítem
const getItemMessages = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Verificar si el ítem existe
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Ítem no encontrado'
      });
    }

    // Verificar si el usuario pertenece a la lista
    const userList = await ListUser.findOne({
      where: {
        userId,
        listId: item.listId
      }
    });

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver mensajes en esta lista'
      });
    }

    // Obtener mensajes del ítem
    const messages = await Message.findAll({
      where: { itemId: parseInt(itemId) },
      include: [{
        model: User,
        as: 'sender',
        attributes: ['id', 'alias']
      }],
      order: [['createdAt', 'ASC']] // Ordenar del más antiguo al más reciente
    });

    // Marcar mensajes como leídos
    const messagesToUpdate = [];
    const updatedMessages = messages.map(message => {
      const readBy = message.readBy || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        messagesToUpdate.push({
          id: message.id,
          readBy
        });
      }
      return {
        id: message.id,
        content: message.content,
        itemId: message.itemId,
        sender: {
          id: message.sender.id,
          alias: message.sender.alias
        },
        readBy,
        createdAt: message.createdAt
      };
    });

    // Actualizar los mensajes que han sido leídos
    if (messagesToUpdate.length > 0) {
      await Promise.all(messagesToUpdate.map(msg => 
        Message.update({ readBy: msg.readBy }, { where: { id: msg.id } })
      ));

      // Notificar que los mensajes han sido leídos
      websocketService.notifyMessagesRead(item.listId, parseInt(itemId), userId);
    }

    res.json({
      success: true,
      data: updatedMessages
    });
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener mensajes'
    });
  }
};

// Obtener conteo de mensajes no leídos por ítem
const getUnreadMessageCount = async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user.id;

    // Verificar si el usuario pertenece a la lista
    const userList = await ListUser.findOne({
      where: {
        userId,
        listId
      }
    });

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver mensajes en esta lista'
      });
    }

    // Obtener todos los ítems de la lista
    const items = await Item.findAll({
      where: { listId },
      attributes: ['id']
    });

    const itemIds = items.map(item => item.id);

    // Obtener mensajes no leídos para los ítems de la lista
    const messages = await Message.findAll({
      where: { 
        itemId: { [Op.in]: itemIds },
        senderId: { [Op.ne]: userId } // Mensajes que no son del usuario actual
      },
      attributes: ['id', 'itemId', 'readBy']
    });

    // Contar mensajes no leídos por ítem
    const unreadCounts = {};
    itemIds.forEach(itemId => {
      unreadCounts[itemId] = 0;
    });

    messages.forEach(message => {
      const readBy = message.readBy || [];
      if (!readBy.includes(userId)) {
        unreadCounts[message.itemId] = (unreadCounts[message.itemId] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: unreadCounts
    });
  } catch (error) {
    console.error('Error al obtener conteo de mensajes no leídos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener conteo de mensajes no leídos'
    });
  }
};

// Marcar mensajes como leídos
const markMessagesAsRead = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Verificar si el ítem existe
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Ítem no encontrado'
      });
    }

    // Verificar si el usuario pertenece a la lista
    const userList = await ListUser.findOne({
      where: {
        userId,
        listId: item.listId
      }
    });

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para marcar mensajes en esta lista'
      });
    }

    // Obtener mensajes no leídos del ítem
    const messages = await Message.findAll({
      where: { 
        itemId: parseInt(itemId),
        [Op.and]: [
          sequelize.literal(`NOT JSON_CONTAINS(readBy, '${userId}')`)
        ]
      }
    });

    // Actualizar cada mensaje para añadir al usuario a readBy
    for (const message of messages) {
      const readBy = message.readBy || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await message.update({ readBy });
      }
    }

    // Notificar por WebSocket
    if (messages.length > 0) {
      websocketService.notifyMessagesRead(item.listId, parseInt(itemId), userId);
    }

    res.json({
      success: true,
      message: 'Mensajes marcados como leídos',
      count: messages.length
    });
  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar mensajes como leídos'
    });
  }
};

module.exports = {
  sendMessage,
  getItemMessages,
  getUnreadMessageCount,
  markMessagesAsRead
};