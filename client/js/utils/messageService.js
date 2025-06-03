// Servicio para gestionar los mensajes de chat
import { makeApiRequest } from './api.js';
import { showNotification } from '../ui/notification.js';

// Mapa para almacenar contadores de mensajes no leídos por ítem
export let unreadMessageCounts = {};
export let unreadMessageCountsList = {};

// Mapa para almacenar las funciones callback de notificación por ítem
const messageCallbacks = {};
const messageCallbacksList = {};

/**
 * Obtiene los mensajes de un ítem
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Array>} - Promesa con los mensajes
 */
export async function getItemMessages(itemId, isList = false) {
  try {
    
    const response = !isList  ? await makeApiRequest(`/api/messages/item/${itemId}`, 'GET')
                              : await makeApiRequest(`/api/messages/list/${itemId}`, 'GET')

    return response.data || [];
  } catch (error) {
    console.error(`Error al obtener mensajes ${!isList ? 'del ítem' : 'de la llista'} ${itemId}:`, error);
    throw error;
  }
}

/**
 * Envía un nuevo mensaje para un ítem
 * @param {number} itemId - ID del ítem
 * @param {string} content - Contenido del mensaje
 * @returns {Promise<Object>} - Promesa con el mensaje enviado
 */
export async function sendMessage(itemId, content, isList = false) {
  try {
    const response = !isList  ? await makeApiRequest(`/api/messages/item/${itemId}`, 'POST', { content })
                              : await makeApiRequest(`/api/messages/list/${itemId}`, 'POST', { content })
    return response.data;
  } catch (error) {
    console.error(`Error al enviar mensaje ${!isList ? 'al ítem' : 'a la llista'}:`, error);
    throw error;
  }
}

/**
 * Marca los mensajes de un ítem como leídos
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Object>} - Promesa con el resultado
 */
export async function markMessagesAsRead(itemId, isList = false) {

  try {
    const response = !isList  ? await makeApiRequest(`/api/messages/read/item/${itemId}`, 'PUT') 
                              : await makeApiRequest(`/api/messages/read/list/${itemId}`, 'PUT')
    // Actualizar contador local
    if(isList){
        if (unreadMessageCountsList[itemId]) {
          unreadMessageCountsList[itemId] = 0;
          notifyUnreadCountChange(itemId, 0, isList);
        }
    } else {
        if (unreadMessageCounts[itemId]) {
          unreadMessageCounts[itemId] = 0;
          notifyUnreadCountChange(itemId, 0, isList);
        }
    }
    
    return response;
  } catch (error) {
    console.error(`Error al marcar mensajes como leídos para ${!isList ? 'el ítem' : 'la llista'} ${itemId}:`, error);
    throw error;
  }
}

/**
 * Obtiene el contador de mensajes no leídos para todos los ítems de una lista
 * @param {number} listId - ID de la lista
 * @returns {Promise<Object>} - Promesa con los contadores por ítem
 */
export async function getUnreadMessageCounts(listId, isList = false) {
  try {
    const response = !await makeApiRequest(`/api/messages/unread/list/${listId}`, 'GET') // tots els missatges dels items de la llista
                      
    unreadMessageCounts = response.data || {};
    
    // Notificar a todos los ítems registrados
    Object.keys(unreadMessageCounts).forEach(listId => {
          notifyUnreadCountChange(listId, unreadMessageCounts[listId], isList);
    });

    return unreadMessageCounts;
    
  } catch (error) {
    console.error(`Error al obtener contadores de mensajes no leídos de los items de la llista:`, error);
    throw error;
  }
}


/**
 * Obtiene el contador de mensajes no leídos de una lista
 * @param {number} listId - ID de la lista
 * @returns {Promise<Object>} - Promesa con los contadores por ítem
 */
export async function getUnreadMessageCountsList(listId, isList = true) {
  try {

    const response = await makeApiRequest(`/api/messages/unread-list/${listId}`, 'GET')
    response.data
    
    unreadMessageCountsList[listId] = response.data || {};
    
    // Notificar a todos los ítems registrados

    Object.keys(unreadMessageCountsList).forEach(listId => {
        notifyUnreadCountChange(listId, unreadMessageCountsList[listId], true);
    });
    return unreadMessageCountsList;    
    
  } catch (error) {
    console.error(`Error al obtener contadores de mensajes no leídos de la llista:`, error);
    throw error;
  }
}


/**
 * Maneja la notificación de un nuevo mensaje recibido por WebSocket
 * @param {Object} data - Datos del mensaje
 */
export function handleNewMessage(data, isList = false) {
  const { itemId, listId, message } = data;
  // Incrementar contador si no es nuestro propio mensaje
  const currentUser = JSON.parse(localStorage.getItem('user'));
  if (currentUser && message.sender.id !== currentUser.id) {
      const currentCount = unreadMessageCounts[itemId] || 0;
      unreadMessageCounts[itemId] = currentCount + 1;
      
      // Notificar cambio en el contador
      notifyUnreadCountChange(itemId, unreadMessageCounts[itemId], isList);

      // Mostrar notificación si no estamos viendo el chat
      if (!document.getElementById(`chat-modal-${itemId}`)) {
        const itemName = "cercar nom de l'item"
        showNotification(`Nou missatge de ${message.sender.alias} a l'ítem ${itemName}`, 'info');
      }
  }
}


/**
 * Maneja la notificación de un nuevo mensaje recibido por WebSocket
 * @param {Object} data - Datos del mensaje
 */
export function handleNewMessageList(data, isList = true) {

  const { itemId, listId, message } = data;
  
  // Incrementar contador si no es nuestro propio mensaje
  const currentUser = JSON.parse(localStorage.getItem('user'));
  if (currentUser && message.sender.id !== currentUser.id) {
      const currentCount = unreadMessageCountsList[listId] || 0;
      unreadMessageCountsList[listId] = currentCount + 1;
      
      // Notificar cambio en el contador
      notifyUnreadCountChange(listId, unreadMessageCountsList[listId], isList);

      // Mostrar notificación si no estamos viendo el chat
      if (!document.getElementById(`chat-modal-list-${listId}`)) {
        const listName = "cercar nom de la llista"
        showNotification(`Nou missatge de ${message.sender.alias} a la llista ${listName}`, 'info');
      }
  }
}


/**
 * Maneja la notificación de mensajes leídos por WebSocket
 * @param {Object} data - Datos de la notificación
 */
export function handleMessagesRead(data, isList = false) {

  // Esta función se usaría para actualizar los indicadores de "leído" en un chat abierto
  // Actualmente solo registramos el evento
// itemId: null
// listId: "1"
// userId: 2
  
  isList = data.itemId === null ? false : true
  
  let currentUser = JSON.parse(localStorage.getItem('user'));
  if(currentUser && data.userId === currentUser.id) {
      if(isList){
        if (unreadMessageCountsList[data.listId]) {
          unreadMessageCountsList[data.listId] = 0;
          notifyUnreadCountChange(data.listId, 0, isList);
        }
      } else {
        if (unreadMessageCounts[data.itemId]) {
          unreadMessageCounts[data.itemId] = 0;
          notifyUnreadCountChange(data.itemId, 0, isList);
        }
      }
    }


}

/**
 * Registra una función callback para recibir notificaciones de cambios en el contador de mensajes no leídos
 * @param {number} itemId - ID del ítem
 * @param {Function} callback - Función a llamar cuando cambie el contador
 */
export function subscribeToUnreadCount(itemId, callback, isList = false) {

  let count = 0;

  if (isList) {
    messageCallbacksList[itemId] = callback;
    // Notificar inmediatamente con el valor actual
    
    count = unreadMessageCountsList[itemId] || 0;
    
  } else {
    messageCallbacks[itemId] = callback;
    // Notificar inmediatamente con el valor actual
    count = unreadMessageCounts[itemId] || 0;
  }
  

  callback(count, isList);
  
  return ( isList ) => {
    // Función para cancelar la suscripción
    if (isList) {
      delete messageCallbacksList[itemId];
    } else {
      delete messageCallbacks[itemId];
    }
  };
}

/**
 * Notifica a los suscriptores sobre cambios en el contador de mensajes no leídos
 * @param {number} itemId - ID del ítem
 * @param {number} count - Nuevo contador
 */
function notifyUnreadCountChange(itemId, count, isList = false) {

  if (isList) {
    const callback = messageCallbacksList[itemId];
    if (callback) {
      callback(count, isList);
    }
  } else {
    const callback = messageCallbacks[itemId];
    if (callback) {
      callback(count, isList);
    }
  }
}

// Eliminar un missatge individual
export async function deleteMessageIndividual(messageId, isList = false) {
  try {
    !isList ? await makeApiRequest(`/api/messages/${messageId}`, 'DELETE') 
            : await makeApiRequest(`/api/messages/list/${messageId}`, 'DELETE')
    
    // Eliminar el ítem del array local
    // this.items = this.items.filter(item => item.id !== parseInt(itemId));
    
    // Actualizar vista
    removeMessageFromView(messageId, true);
    
    return true;
  } catch (error) {
    console.error(`Error al eliminar missatge ${messageId}:`, error);
    showNotification('Error al eliminar l\'ítem', 'error');
    throw error;
  }
}

// Eliminar un missatge individual
export async function deleteMessageAll(messageId, isList = false) {
  try {
    !isList ? await makeApiRequest(`/api/messages/all/${messageId}`, 'DELETE') 
            : await makeApiRequest(`/api/messages/list/all/${messageId}`, 'DELETE')
    // Eliminar el ítem del array local
    // this.items = this.items.filter(item => item.id !== parseInt(itemId));
    
    // Actualizar vista
    removeMessageFromView(messageId, false);
    
    return true;
  } catch (error) {
    console.error(`Error al eliminar missatge ${messageId}:`, error);
    showNotification('Error al eliminar l\'ítem', 'error');
    throw error;
  }
}

 // Eliminar un missatge de la vista
 export function removeMessageFromView(messageId, isIndividual = true) {
  
  const messageElement = document.querySelector(`.chat-message[messageid="${messageId}"]`);
  if (messageElement) {
    // // Añadir animación de salida
    // messageElement.classList.add('opacity-0');
    // messageElement.style.transition = 'opacity 0.3s ease';

    // // Elimina l'element trobat
    // messageElement.remove();
    if(isIndividual){
      messageElement.innerHTML = `
        <div class="chat-bubble-delete">
          <p>Missatge eliminat </p>
        </div>
      `;
      console.log(`Missatge amb ID ${messageId} eliminat amb èxit`);

    } else {
      messageElement.remove();
    }

    // messageElement.innerHTML = `
    //   <div class="chat-bubble-delete">
    //     <p>Missatge eliminat </p>
    //   </div>
    // `;
    
    
  }
}

/**
 * Obtiene el contador de mensajes no leídos para un ítem específico
 * @param {number} itemId - ID del ítem
 * @returns {number} - Número de mensajes no leídos
 */
export function getUnreadCount(itemId, isList = false) {
  if (isList) 
    return unreadMessageCountsList[itemId] || 0
  else
    return unreadMessageCounts[itemId] || 0;
}