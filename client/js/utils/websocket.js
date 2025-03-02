// Gestión de WebSocket para actualizaciones en tiempo real
import { getAuthToken, getLoggedUser } from '../auth/auth.js';
import { showNotification } from '../ui/notification.js';

import { currentListId, itemManager, listManager, listViewController } from '../app.js';

let socket;
let isConnected = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectInterval = 3000; // 3 segundos

/**
 * Configurar la conexión WebSocket
 */
export function setupWebSocket() {
  const token = getAuthToken();
  
  if (!token) {
    console.error('No se puede establecer conexión WebSocket: Token no disponible');
    return;
  }
  
  // Crear instancia de Socket.IO con autenticación
  socket = io(window.location.origin, {
    auth: {
      token
    }
  });
  
  // Eventos del socket
  socket.on('connect', handleSocketConnect);
  socket.on('disconnect', handleSocketDisconnect);
  socket.on('connect_error', handleSocketError);
  
  // Eventos de actualización de listas
  socket.on('list:updated', handleListUpdated);
  
  // Eventos de actualización de ítems
  socket.on('item:added', handleItemAdded);
  socket.on('item:updated', handleItemUpdated);
  socket.on('item:deleted', handleItemDeleted);
  
  // Eventos de usuarios
  socket.on('user:joined', handleUserJoined);
  socket.on('user:removed', handleUserRemoved);

  // Eventos de invitaciones
  socket.on('invitation:rejected', handleInvitationRejected)

}

/**
 * Unirse a una sala para una lista específica
 * @param {number} listId - ID de la lista
 */
export function joinListRoom(listId) {
  if (socket && isConnected) {
    socket.emit('joinList', listId);
  }
}

/**
 * Unirse a múltiples salas de listas
 * @param {Array<number>} listIds - Array con IDs de listas
 */
export function joinListRooms(listIds) {
  if (socket && isConnected && Array.isArray(listIds)) {
    socket.emit('joinLists', listIds);
  }
}

/**
 * Abandonar una sala de lista
 * @param {number} listId - ID de la lista
 */
export function leaveListRoom(listId) {
  if (socket && isConnected) {
    socket.emit('leaveList', listId);
  }
}

// ===== Manejadores de eventos del socket =====

// /**
//  * Manejador para evento de conexión
//  */
// function handleSocketConnect() {
//   console.log('WebSocket conectado');
//   isConnected = true;
//   reconnectAttempts = 0;
  
//   // Unirse a las salas de todas las listas del usuario
//   const listManager = window.listManager;
//   if (listManager && listManager.lists) {
//     const listIds = listManager.lists.map(list => list.id);
//     joinListRooms(listIds);
//   }
// }


/**
 * Manejador para evento de conexión
 */
function handleSocketConnect() {
  console.log('WebSocket conectado');
  isConnected = true;
  reconnectAttempts = 0;
  
  // Unirse a las salas de todas las listas del usuario
  const listManagerCopy = listManager;
  if (listManagerCopy && listManagerCopy.lists) {
    const listIds = listManagerCopy.lists.map(list => list.id);
    console.log('Uniéndose a las salas de listas:', listIds);
    joinListRooms(listIds);
  }
  
  // Unirse a la lista actual si está abierta
  const currentListId = getCurrentListId();
  if (currentListId) {
    console.log('Uniéndose a la sala de la lista actual:', currentListId);
    joinListRoom(currentListId);
  }
  
  // Mostrar notificación si se estaba intentando reconectar
  if (reconnectAttempts > 0) {
    showNotification('Connexió restablerta', 'success');
  }
}



/**
 * Manejador para evento de desconexión
 */
function handleSocketDisconnect(reason) {
  console.log(`WebSocket desconectado: ${reason}`);
  isConnected = false;
  
  // Intentar reconectar si no fue una desconexión intencional
  if (reason !== 'io client disconnect') {
    attemptReconnect();
  }
}

/**
 * Manejador para evento de error de conexión
 */
function handleSocketError(error) {
  console.error('Error de WebSocket:', error);
  
  // Si el error es de autenticación, no intentar reconectar
  if (error.message === 'Autenticación requerida' || error.message === 'Token inválido') {
    showNotification('Error de autenticación en tiempo real', 'error');
  } else {
    attemptReconnect();
  }
}

/**
 * Intentar reconectar el WebSocket
 */
function attemptReconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`Intentando reconectar WebSocket (intento ${reconnectAttempts})...`);
      socket.connect();
    }, reconnectInterval);
  } else {
    console.error('No se pudo reconectar WebSocket después de varios intentos');
    showNotification('Se perdió la conexión en tiempo real. Recarga la página.', 'warning', 10000);
  }
}

// ===== Manejadores de eventos de datos =====

/**
 * Manejador para actualizaciones de listas
 */
function handleListUpdated(data) {
  const { listId, list } = data;
  
  // Actualizar la lista en el gestor si está disponible
  if (listManager) {
    listManager.updateListInMemory(listId, list);
    
    // Actualizar vista si está disponible
    if (listViewController) {
      listViewController.updateListCard(list);
    }
  }
}

// /**
//  * Manejador para nuevos ítems
//  */
// function handleItemAdded(data) {
//   const { listId, item } = data;
//   const currentListId = getCurrentListId();
  
//   // Si estamos en la lista donde se añadió el ítem
//   if (currentListId === listId && window.itemManager) {
//     window.itemManager.addWebSocketItem(item);
    
//     // Mostrar notificación si el ítem no fue añadido por el usuario actual
//     const currentUser = getLoggedUser();
//     if (currentUser && item.addedBy && item.addedBy.id !== currentUser.id) {
//       showNotification(`${item.addedBy.alias} ha afegit "${item.name}"`, 'info');
//     }
//   }
// }


/**
 * Manejador para nuevos ítems
 */
function handleItemAdded(data) {
  const { listId, item } = data;
  const currentListId = getCurrentListId();
  
  console.log('WebSocket: Ítem añadido', data, 'Lista actual:', currentListId);
  
  // Si estamos en la lista donde se añadió el ítem
  if (currentListId && parseInt(currentListId) === parseInt(listId) && itemManager) {
    itemManager.addWebSocketItem(item);
    
    // Mostrar notificación si el ítem no fue añadido por el usuario actual
    const currentUser = getLoggedUser();
    if (currentUser && item.addedBy && item.addedBy.id !== currentUser.id) {
      showNotification(`${item.addedBy.alias} ha afegit "${item.name}"`, 'info');
    }
  }
}



// /**
//  * Manejador para ítems actualizados
//  */
// function handleItemUpdated(data) {
//   const { listId, item } = data;
//   const currentListId = getCurrentListId();
  
//   // Si estamos en la lista donde se actualizó el ítem
//   if (currentListId === listId && window.itemManager) {
//     window.itemManager.updateWebSocketItem(item);
    
//     // Mostrar notificación si el ítem no fue actualizado por el usuario actual
//     const currentUser = getLoggedUser();
//     if (currentUser && item.addedBy && item.addedBy.id !== currentUser.id) {
//       showNotification(`${item.addedBy.alias} ha actualitzat "${item.name}"`, 'info');
//     }
//   }
// }


/**
 * Manejador para ítems actualizados
 */
function handleItemUpdated(data) {
  const { listId, item } = data;
  const currentListId = getCurrentListId();
  
  console.log('WebSocket: Ítem actualizado', data);
  
  // Si estamos en la lista donde se actualizó el ítem
  if (currentListId && parseInt(currentListId) === parseInt(listId) && itemManager) {
    itemManager.updateWebSocketItem(item);
    
    // Mostrar notificación si el ítem no fue actualizado por el usuario actual
    const currentUser = getLoggedUser();
    if (currentUser && item.addedBy && item.addedBy.id !== currentUser.id) {
      showNotification(`${item.addedBy.alias} ha actualitzat "${item.name}"`, 'info');
    }
  }
}


// /**
//  * Manejador para ítems eliminados
//  */
// function handleItemDeleted(data) {
//   const { listId, itemId } = data;
//   const currentListId = getCurrentListId();
  
//   // Si estamos en la lista donde se eliminó el ítem
//   if (currentListId === listId && window.itemManager) {
//     // Obtener información del ítem antes de eliminarlo (para mostrar en notificación)
//     const item = window.itemManager.getItemById(itemId);
//     const itemName = item ? item.name : 'un ítem';
    
//     window.itemManager.deleteWebSocketItem(itemId);
    
//     // Mostrar notificación
//     showNotification(`S'ha eliminat "${itemName}"`, 'info');
//   }
// }


/**
 * Manejador para ítems eliminados
 */
function handleItemDeleted(data) {
  const { listId, itemId } = data;
  const currentListId = getCurrentListId();
  
  console.log('WebSocket: Ítem eliminado', data);
  
  // Si estamos en la lista donde se eliminó el ítem
  if (currentListId && parseInt(currentListId) === parseInt(listId) && itemManager) {
    // Obtener información del ítem antes de eliminarlo (para mostrar en notificación)
    const item = itemManager.getItemById(itemId);
    const itemName = item ? item.name : 'un ítem';
    
    itemManager.deleteWebSocketItem(itemId);
    
    // Mostrar notificación
    showNotification(`S'ha eliminat "${itemName}"`, 'info');
  }
}





/**
 * Manejador para usuarios que se unen a una lista
 */
function handleUserJoined(data) {
  const { listId, user } = data;
  
  // Actualizar contador de participantes si es necesario
  if (listManager) {
    const list = listManager.getListById(listId);
    if (list) {
      list.participantCount = (list.participantCount || 1) + 1;
      
      // Actualizar vista si está disponible
      if (listViewController) {
        listViewController.updateListCard(list);
      }
      
      // Mostrar notificación
      showNotification(`${user.alias} s'ha unit a la llista "${list.name}"`, 'info');
    }
  }
}

/**
 * Manejador para usuarios que abandonan una lista
 */
function handleUserRemoved(data) {
  const { listId, user } = data;
  
  console.log('WebSocket: Usuario ha abandonado la lista', data);
  
  // Actualizar contador de participantes si es necesario
  if (listManager) {
    const list = listManager.getListById(listId);
    if (list) {
      // Decrementar contador de participantes
      if (list.participantCount > 0) {
        list.participantCount -= 1;
      }
      
      // Actualizar vista si está disponible
      if (listViewController) {
        listViewController.updateListCard(list);
      }
      
      // Si estamos en la vista de detalle de esta lista, actualizar el contador
      const currentListId = getCurrentListId();
      if (currentListId && parseInt(currentListId) === parseInt(listId)) {
        const participantsElement = document.getElementById('list-participants');
        if (participantsElement) {
          participantsElement.innerHTML = `
            <i class="fas fa-users mr-1"></i>${list.participantCount || 0}
          `;
        }
      }
      
      // Mostrar notificación
      showNotification(`${user.alias} ha abandonat la llista "${list.name}"`, 'info');
    }
  }
}


/**
 * Manejador para invitaciones rechazadas
 */
function handleInvitationRejected(data) {
  const { listId, listName, rejectedBy } = data;
  
  console.log('WebSocket: Invitación rechazada', data);
  
  // Mostrar notificación al usuario que había enviado la invitación
  if (rejectedBy && rejectedBy.email) {
    showNotification(`${rejectedBy.email} ha rebutjat la invitació a la llista "${listName}"`, 'info');
  }
  
  // Si el modal de configuración de la lista está abierto y es la misma lista,
  // actualizar la lista de invitaciones pendientes
  const modalContainer = document.getElementById('modal-container');
  const currentListId = getCurrentListId();
  
  if (modalContainer && !modalContainer.classList.contains('hidden') && 
      currentListId && parseInt(currentListId) === parseInt(listId)) {
    
    // Intentar recargar los detalles de la lista para actualizar invitaciones
    if (window.listManager) {
      window.listManager.fetchListDetail(listId)
        .then(listDetails => {
          // Actualizar la sección de invitaciones pendientes
          const pendingInvitationsContainer = document.getElementById('pending-invitations-list');
          if (pendingInvitationsContainer && listDetails.pendingInvitations) {
            // Actualizar el contador
            const pendingInvitationsTitle = document.querySelector('h3:contains("Invitacions pendents")');
            if (pendingInvitationsTitle) {
              pendingInvitationsTitle.textContent = `Invitacions pendents (${listDetails.pendingInvitations.length})`;
            }
            
            // Si no hay invitaciones pendientes, mostrar mensaje
            if (listDetails.pendingInvitations.length === 0) {
              pendingInvitationsContainer.innerHTML = '<div class="text-gray-500 text-center p-2">No hi ha invitacions pendents</div>';
            }
          }
        })
        .catch(error => console.error('Error al actualizar detalles de lista tras rechazo:', error));
    }
  }
}



/**
 * Obtener el ID de la lista actual
 * @returns {number|null} - ID de la lista o null
 */
function getCurrentListId() {
  // return window.currentListId || null;
  console.log("🚀 ~ websocket getCurrentListId ~ currentListId:", currentListId)
  return currentListId || null;
}
