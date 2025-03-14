const { Item, List, ListUser, User } = require('../models');
const { emitToList } = require('../config/websocket');
const { Op } = require('sequelize');

// Agregar un nuevo ítem a la lista
const addItem = async (req, res) => {
  try {
    const { listId } = req.params;
    const { name, quantity = 1, notes = '', typesUnits = 'unitat' } = req.body;
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
      completed: false,
      typesUnits,
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
      updatedAt: newItem.updatedAt,
      typesUnits: newItem.typesUnits
    };

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
    const { name, quantity, completed, notes, typesUnits } = req.body;
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

    // Verificar que el usuario sea el propietario de la lista o quien agregó el ítem
    const isOwner = userList.role === 'owner';
    const isCreator = item.addedBy === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario de la lista o quien creó el ítem puede modificarlo'
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
    if (typesUnits !== undefined) updatedFields.typesUnits = typesUnits;

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
      updatedAt: item.updatedAt,
      typesUnits: item.typesUnits
    };

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
    

    if (!userList) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar ítems de esta lista'
      });
    }
    
    // Verificar que el usuario sea el propietario de la lista o quien agregó el ítem
    const isOwner = userList.role === 'owner';
    const isCreator = item.addedBy === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({
        success: false,
        message: 'Solo el propietario de la lista o quien creó el ítem puede eliminarlo'
      });
    }


    // Guardar el listId antes de eliminar el ítem
    const listId = item.listId;
    const itemIdList = item.id;

    // Notificar a todos los usuarios de la lista vía WebSocket
    const websocketService = require('../services/websocketService');
    websocketService.notifyItemDeleted(listId, itemId);

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


// FUNCIONS INTERNES

/**
 * Funció interna per llegir un ítem per ID
 * @param {string} itemId - ID de l'ítem a llegir
 * @param {object} userId - ID de l'usuari que fa la petició
 * @returns {Promise<object>} - Informació completa de l'ítem o error
 */
const getItemById = async (itemId) => {
  try {
    // Trobar l'ítem
    const item = await Item.findByPk(itemId);
    if (!item) {
      return {
        success: false,
        status: 404,
        message: 'Ítem no trobat'
      };
    }

    // // Verificar si l'usuari té accés a la llista
    // const userList = await ListUser.findOne({
    //   where: {
    //     userId,
    //     listId: item.listId
    //   }
    // });

    // if (!userList) {
    //   return {
    //     success: false,
    //     status: 403,
    //     message: 'No tens permís per accedir a aquest ítem'
    //   };
    // }

    // // Obtenir informació de l'usuari que va afegir l'ítem
    // const creator = await User.findByPk(item.addedBy, {
    //   attributes: ['id', 'alias']
    // });

    // Preparar resposta amb dades completes
    const itemResponse = {
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      completed: item.completed,
      notes: item.notes,
      listId: item.listId,
      addedBy: {
        id: creator.id,
        alias: creator.alias
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      typesUnits: item.typesUnits
    };

    return {
      success: true,
      item: itemResponse
    };
  } catch (error) {
    console.error('Error al llegir ítem:', error);
    return {
      success: false,
      status: 500,
      message: 'Error al llegir ítem'
    };
  }
};


module.exports = {
  addItem,
  updateItem,
  deleteItem,
  getItemById
};