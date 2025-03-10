// Servicio para gestionar los mensajes de chat
import { makeApiRequest } from './api.js';
import { showNotification } from '../ui/notification.js';

// Mapa para almacenar contadores de mensajes no leídos por ítem
let unreadMessageCounts = {};
let unreadMessageCountsList = {};

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
    const response = !isList  ? await makeApiRequest(`/api/messages/unread/list/${listId}`, 'GET')
                              : await makeApiRequest(`/api/messages/unread-list/${listId}`, 'GET')
    if(isList){
      unreadMessageCountsList = response.data || {};
    } else {
      unreadMessageCounts = response.data || {};
    }
    
    // Notificar a todos los ítems registrados
    if(isList){
      Object.keys(unreadMessageCountsList).forEach(itemId => {
         notifyUnreadCountChange(itemId, unreadMessageCountsList[itemId], isList);
      });
      return unreadMessageCountsList;
    } else {
      Object.keys(unreadMessageCounts).forEach(itemId => {
          notifyUnreadCountChange(itemId, unreadMessageCounts[itemId], isList);
      });
      return unreadMessageCounts;
    }
    
    
  } catch (error) {
    console.error(`Error al obtener contadores de mensajes no leídos ${!isList ? 'per a la llista' : 'de la llista'}:`, error);
    throw error;
  }
}

/**
 * Maneja la notificación de un nuevo mensaje recibido por WebSocket
 * @param {Object} data - Datos del mensaje
 */
export function handleNewMessage(data, isList = false) {
  const { itemId, message } = data;
  
  // Incrementar contador si no es nuestro propio mensaje
  const currentUser = JSON.parse(localStorage.getItem('user'));
  if (currentUser && message.sender.id !== currentUser.id) {
    if (isList){
      const currentCount = unreadMessageCountsList[itemId] || 0;
      unreadMessageCountsList[itemId] = currentCount + 1;
      
      // Notificar cambio en el contador
      notifyUnreadCountChange(itemId, unreadMessageCountsList[itemId], isList);

      // Mostrar notificación si no estamos viendo el chat
      if (!document.getElementById(`chat-modal-list-${itemId}`)) {
        showNotification(`Nou missatge de ${message.sender.alias} a la llista`, 'info');
      }
    } else {
      const currentCount = unreadMessageCountsList[itemId] || 0;
      unreadMessageCountsList[itemId] = currentCount + 1;
      
      // Notificar cambio en el contador
      notifyUnreadCountChange(itemId, unreadMessageCountsList[itemId], isList);

      // Mostrar notificación si no estamos viendo el chat
      if (!document.getElementById(`chat-modal-${itemId}`)) {
        showNotification(`Nou missatge de ${message.sender.alias} a l'ítem`, 'info');
      }
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
  console.log('Mensajes marcados como leídos:', data);
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