const { Item, List, ListUser, User } = require('../models');
const { emitToList } = require('../config/websocket');
const { Op } = require('sequelize');

// Agregar un nuevo ítem a la lista
const addItem = async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, quantity = 1, notes = '' } = req.body;
    const userId = req.user.id;

    // Verificar si el usuario tiene acceso a la lista
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
        message: 'No tienes permiso para agregar ítems a esta lista'
      });
    }

    // Validar datos
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre del ítem no puede estar vacío'
      });
    }

    if (notes && notes.length > 240) {
      return res.status(400).json({
        success: false,
        message: 'Las notas no pueden exceder los 240 caracteres'
      });
    }

    // Crear el ítem
    const newItem = await Item.create({
      name,
      quantity,
      notes,
      addedBy: userId,
      listId: parseInt(listId),
      completed: false
    });

    // Actualizar referencia del último ítem en la lista
    await List.update({
      lastItemAddedAt: new Date(),
      lastItemId: newItem.id
    }, {
      where: { id: listId }
    });

    // Obtener información del usuario para incluir en la respuesta
    const user = await User.findByPk(userId, {
      attributes: ['id', 'alias']
    });

    // Preparar respuesta con datos completos
    const itemResponse = {
      id: newItem.id,
      name: newItem.name,
      quantity: newItem.quantity,
      completed: newItem.completed,
      notes: newItem.notes,
      addedBy: {
        id: user.id,
        alias: user.alias
      },
      createdAt: newItem.createdAt,
      updatedAt: newItem.updatedAt
    };

    // // Notificar a todos los usuarios de la lista vía WebSocket
    // emitToList(listId, 'item:added', {
    //   listId: parseInt(listId),
    //   item: itemResponse
    // });

    // Notificar a todos los usuarios de la lista vía WebSocket
    const websocketService = require('../services/websocketService');
    websocketService.notifyItemAdded(parseInt(listId), itemResponse);

    res.status(201).json({
      success: true,
      message: 'Ítem agregado correctamente',
      item: itemResponse
    });
  } catch (error) {
    console.error('Error al agregar ítem:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar ítem'
    });
  }
};

// Actualizar un ítem
const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, quantity, completed, notes } = req.body;
    const userId = req.user.id;

    // Encontrar el ítem
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Ítem no encontrado'
      });
    }

    // Verificar si el usuario tiene acceso a la lista
    const userList = await ListUser.findOne({
      where: { 
        userId, 
        listId: item.listId,
        role: {
          [Op.in]: ['owner', 'editor']
        }
      }
    });

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar ítems en esta lista'
      });
    }

    // Validar datos
    if (name !== undefined && (name === null || name.trim() === '')) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del ítem no puede estar vacío'
      });
    }

    if (notes !== undefined && notes && notes.length > 240) {
      return res.status(400).json({
        success: false,
        message: 'Las notas no pueden exceder los 240 caracteres'
      });
    }

    // Actualizar el ítem
    const updatedFields = {};
    if (name !== undefined) updatedFields.name = name;
    if (quantity !== undefined) updatedFields.quantity = quantity;
    if (completed !== undefined) updatedFields.completed = completed;
    if (notes !== undefined) updatedFields.notes = notes;

    await item.update(updatedFields);

    // Obtener información del usuario que agregó el ítem
    const creator = await User.findByPk(item.addedBy, {
      attributes: ['id', 'alias']
    });

    // Preparar respuesta con datos completos
    const itemResponse = {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      completed: item.completed,
      notes: item.notes,
      addedBy: {
        id: creator.id,
        alias: creator.alias
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };

    // // Notificar a todos los usuarios de la lista vía WebSocket
    // emitToList(item.listId, 'item:updated', {
    //   listId: item.listId,
    //   item: itemResponse
    // });

    // Notificar a todos los usuarios de la lista vía WebSocket
    const websocketService = require('../services/websocketService');
    websocketService.notifyItemUpdated(item.listId, itemResponse);

    res.json({
      success: true,
      message: 'Ítem actualizado correctamente',
      item: itemResponse
    });
  } catch (error) {
    console.error('Error al actualizar ítem:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar ítem'
    });
  }
};

// Eliminar un ítem
const deleteItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    // Encontrar el ítem
    const item = await Item.findByPk(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Ítem no encontrado'
      });
    }

    // Verificar si el usuario tiene acceso a la lista
    const userList = await ListUser.findOne({
      where: { 
        userId, 
        listId: item.listId,
        role: {
          [Op.in]: ['owner', 'editor']
        }
      }
    });


    // Guardar el listId antes de eliminar el ítem
    const listId = item.listId;
    const itemIdList = item.id;

    // if (!userList) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'No tienes permiso para eliminar ítems de esta lista'
    //   });
    // }
    // Notificar a todos los usuarios de la lista vía WebSocket
    const websocketService = require('../services/websocketService');
    websocketService.notifyItemDeleted(listId, itemId);
    // websocketService.notifyItemDeleted(listId, itemId);



    // Eliminar el ítem
    await item.destroy();

    // Notificar a todos los usuarios de la lista vía WebSocket
    emitToList(listId, 'item:deleted', {
      listId,
      itemIdList
    });

    res.json({
      success: true,
      message: 'Ítem eliminado correctamente'
    });
  } catch (error) {
    console.error('Error al eliminar ítem:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ítem'
    });
  }
};

module.exports = {
  addItem,
  updateItem,
  deleteItem
};