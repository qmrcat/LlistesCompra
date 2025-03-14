const { Message, User, Item, List, ListUser } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const websocketService = require('../services/websocketService');
const { getListById } = require('./listController');
const { getItemById } = require('./itemController');

// Enviar un nuevo mensaje
const sendMessage = async (req, res) => {

  // '/list/:listId'
  try {
    const fullPath = req.originalUrl; 
    const basePath = req.baseUrl + req.path;
    // Comprovar si la ruta conté '/list'
    const isList = fullPath.includes('/list/');

    let itemId, listId


    if(!isList) itemId = req.params.itemId;
          else  listId = req.params.listId;

          const { content } = req.body;
    const userId = req.user.id;

    let item, list;

    if(!isList) {
      // Verificar si el ítem existe
      item = await Item.findByPk(itemId, {
        include: [{ model: List }]
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Ítem no trobat'
        });
      }
      listId = item.listId

    } else {
          // Obtener detalles de la lista
      list = await List.findByPk(listId, {
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
          }
        ]
      });

      if (!list) {
        return res.status(404).json({
          success: false,
          message: 'Llista no trobada'
        });
      }
    }

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
          message: 'No tens permís per enviar missatges en aquesta llista'
        });
      }


    // Crear el mensaje
    const message = await Message.create({
      content,
      itemId: !isList ? parseInt(itemId) : null,
      listId: !isList ? null : parseInt(listId),
      senderId: userId,
      readBy: [userId], // El remitent ja ha llegit el missatge
      deleteBy: []
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
      listId: messageWithSender.listId,
      sender: {
        id: messageWithSender.sender.id,
        alias: messageWithSender.sender.alias
      },
      readBy: messageWithSender.readBy,
      deleteBy: messageWithSender.deleteBy,
      createdAt: messageWithSender.createdAt
    };

    // Notificar por WebSocket
    websocketService.notifyNewMessage((!isList ? item.listId : listId), (isList ? null : parseInt(listId)), formattedMessage, isList);

    res.status(201).json({
      success: true,
      message: 'Missatge enviat correctament',
      data: formattedMessage
    });
  } catch (error) {
    console.error('Error al enviar missatge:', error);
    res.status(500).json({
      success: false,
      message: 'Error al enviar missatge'
    });
  }
    
    
};

// Obtener mensajes de un ítem
const getItemMessages = async (req, res) => {
  try {

    const fullPath = req.originalUrl; 
    const basePath = req.baseUrl + req.path;
    // Comprovar si la ruta conté '/list'
    const isList = fullPath.includes('/list/');

    // const { itemId } = req.params;
    // const userId = req.user.id;

    let itemId, listId

    if(!isList) itemId = req.params.itemId;
          else  listId = req.params.listId;

    const { content } = req.body;
    const userId = req.user.id;

    let item, list;

    if(!isList) {
      // Verificar si el ítem existe
      item = await Item.findByPk(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Ítem no encontrado'
        });
      }
      listId = item.listId
    } else {
          // Obtener detalles de la lista
          list = await List.findByPk(listId, {
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
              }
            ]
          });
    
          if (!list) {
            return res.status(404).json({
              success: false,
              message: 'Llista no trobada'
            });
          }
    }
    

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
        message: 'No tens permís per veure missatges en aquesta llista'
      });
    }

    let messages;

    if(!isList) {
        // Obtener mensajes del ítem
        messages = await Message.findAll({
          where: { itemId: parseInt(itemId) },
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'alias']
          }],
          order: [['createdAt', 'ASC']] // Ordenar del más antiguo al más reciente
        });
    } else {
        // Obtener mensajes del ítem
        messages = await Message.findAll({
          where: { listId: parseInt(listId) },
          include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'alias']
          }],
          order: [['createdAt', 'ASC']] // Ordenar del más antiguo al más reciente
        });      
    }

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
        listId: message.listId,
        sender: {
          id: message.sender.id,
          alias: message.sender.alias
        },
        readBy,
        deleteBy: message.deleteBy,
        createdAt: message.createdAt
      };
    });

    // Actualizar los mensajes que han sido leídos
    if (messagesToUpdate.length > 0) {
      await Promise.all(messagesToUpdate.map(msg => 
        Message.update({ readBy: msg.readBy }, { where: { id: msg.id } })
      ));

      // Notificar que los mensajes han sido leídos
      websocketService.notifyMessagesRead(( !isList ? item.listId : listId ), (!isList ? parseInt(listId) : null ), userId);
      
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

    const fullPath = req.originalUrl; 
    const basePath = req.baseUrl + req.path;
    // Comprovar si la ruta conté '/list'
    const isList = fullPath.includes('/unread-list/');


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
        message: 'No tens permís per veure missatges en aquesta llista'
      });
    }

    if (!isList){
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
            listId: null,
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
    } else {
        // Obtener mensajes no leídos para la lista
        const messages = await Message.findAll({
          where: { 
            listId,
            inteId: null,
            senderId: { [Op.ne]: userId } // Mensajes que no son del usuario actual
          },
          attributes: ['id', 'listId', 'readBy']
        });

        res.json({
          success: true,
          data: messages.length
        });

    }

    

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
    const fullPath = req.originalUrl; 
    const basePath = req.baseUrl + req.path;
    // Comprovar si la ruta conté '/list'
    const isList = fullPath.includes('/list/');
    
    
    let itemId, listId
        
    if(!isList) itemId = req.params.itemId;
          else  listId = req.params.listId;

    // const { itemId } = req.params;
    const userId = req.user.id;

    let item, list;

    if(!isList) {
      // Verificar si el ítem existe
      item = await Item.findByPk(itemId);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Ítem no trobat'
        });
      }
    } else {
      list = await List.findByPk(listId);
      if (!list) {
        return res.status(404).json({
          success: false,
          message: 'list no trobat'
        });
      }
    }

    // Verificar si el usuario pertenece a la lista
    const userList = await ListUser.findOne({
      where: {
        userId,
        listId: !isList ? item.listId : listId
      }
    });

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tens permís per marcar missatges com a llegits en aquesta llista'
      });
    }

    // Obtener mensajes no leídos del ítem
    const messages = await Message.findAll({
      where: { 
        itemId: !isList ? parseInt(itemId) : null,
        listId: !isList ? null : parseInt(listId)
      }
    });
    // const messages = await Message.findAll({
    //   where: { 
    //     itemId: parseInt(itemId),
    //     [Op.and]: [
    //       sequelize.literal(`NOT JSON_CONTAINS(readBy, '${userId}')`)
    //     ]
    //   }
    // });

    // Filtrar mensajes que el usuario no ha leído
    const unreadMessages = messages.filter(message => {
      const readBy = message.readBy || [];
      return !readBy.includes(userId);
    });


    for (const message of unreadMessages) {
      const readBy = message.readBy || [];
      if (!readBy.includes(userId)) {
        readBy.push(userId);
        await message.update({ readBy });
      }
    }

    // Notificar por WebSocket
    if (unreadMessages.length > 0) {
      websocketService.notifyMessagesRead((!isList ? item.listId : listId), (!isList ? parseInt(itemId) : null), userId, isList);
    }

    res.json({
      success: true,
      message: 'Mensajes marcados como leídos',
      count: unreadMessages.length
    });
  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al marcar mensajes como leídos'
    });
  }
};


// Eliminar un ítem
const deleteMessage = async (req, res) => {
  
  try {

    const fullPath = req.originalUrl; 
    const basePath = req.baseUrl + req.path;
    // Comprovar si la ruta conté '/list'
    const isAll = fullPath.includes('/all/');
    const isList = fullPath.includes('/list/');

    const { messageId } = req.params;
    let listId, itemId

    const userId = req.user.id;

    if (itemId) {
        const data = getItemById(message.itemId)
        if (!data || !data.success) {
          return res.status(404).json({
            success: false,
            message: 'Item no trobat'
          });
        }
        listId = data.item.listId
    }

    // Encontrar el ítem
    const message = await Message.findByPk(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message no encontrado'
      });
    }

    listId = message.listId
    itemId = message.itemId

    // Verificar si el usuario tiene acceso a la lista
    const userList = await ListUser.findOne({
      where: { 
        userId, 
        listId: listId,
        role: {
          [Op.in]: ['owner', 'editor']
        }
      }
    });
    

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar el mensaje de esta lista'
      });
    }
 
    const websocketService = require('../services/websocketService');
    if(isAll) {

      // Eliminar el mensaje
      await message.destroy();

      // Notificar a todos los usuarios de la lista vía WebSocket
      //websocketService.notifyMessageDeleted(listId, messageId);
      websocketService.notifyMessageDeleted(listId, itemId, messageId, null, isList)
    } else {

      let userIdAll = userId
      const deleteBy = message.deleteBy || [];
      if (!deleteBy.includes(userId)) {
        deleteBy.push(userId);
        await message.update({ deleteBy });
      }
      console.log(deleteBy.length);
      const participants = getListById(listId, 'participants')
      const participantCount = participants.length
      if(deleteBy.length === participantCount) {
        // Eliminar el mensaje
        await message.destroy();
        userIdAll = null
      }

      websocketService.notifyMessageDeleted(listId, itemId, messageId, userIdAll, isList)
    }

    res.json({
      success: true,
      message: 'Missatge eliminat correctament'
    });
  } catch (error) {
    console.error('Error en eliminar el missatge', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el missatge'
    });
  }
};

module.exports = {
  sendMessage,
  getItemMessages,
  getUnreadMessageCount,
  markMessagesAsRead,
  deleteMessage
};