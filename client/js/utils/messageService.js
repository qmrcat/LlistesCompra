// Servicio para gestionar los mensajes de chat
import { makeApiRequest } from './api.js';
import { showNotification } from '../ui/notification.js';

// Mapa para almacenar contadores de mensajes no leídos por ítem
let unreadMessageCounts = {};

// Mapa para almacenar las funciones callback de notificación por ítem
const messageCallbacks = {};

/**
 * Obtiene los mensajes de un ítem
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Array>} - Promesa con los mensajes
 */
export async function getItemMessages(itemId) {
  try {
    const response = await makeApiRequest(`/api/messages/item/${itemId}`, 'GET');
    return response.data || [];
  } catch (error) {
    console.error(`Error al obtener mensajes del ítem ${itemId}:`, error);
    throw error;
  }
}

/**
 * Envía un nuevo mensaje para un ítem
 * @param {number} itemId - ID del ítem
 * @param {string} content - Contenido del mensaje
 * @returns {Promise<Object>} - Promesa con el mensaje enviado
 */
export async function sendMessage(itemId, content) {
  try {
    const response = await makeApiRequest(`/api/messages/item/${itemId}`, 'POST', { content });
    return response.data;
  } catch (error) {
    console.error(`Error al enviar mensaje al ítem ${itemId}:`, error);
    throw error;
  }
}

/**
 * Marca los mensajes de un ítem como leídos
 * @param {number} itemId - ID del ítem
 * @returns {Promise<Object>} - Promesa con el resultado
 */
export async function markMessagesAsRead(itemId) {
  try {
    const response = await makeApiRequest(`/api/messages/read/item/${itemId}`, 'PUT');
    
    // Actualizar contador local
    if (unreadMessageCounts[itemId]) {
      unreadMessageCounts[itemId] = 0;
      notifyUnreadCountChange(itemId, 0);
    }
    
    return response;
  } catch (error) {
    console.error(`Error al marcar mensajes como leídos para el ítem ${itemId}:`, error);
    throw error;
  }
}

/**
 * Obtiene el contador de mensajes no leídos para todos los ítems de una lista
 * @param {number} listId - ID de la lista
 * @returns {Promise<Object>} - Promesa con los contadores por ítem
 */
export async function getUnreadMessageCounts(listId) {
  try {
    const response = await makeApiRequest(`/api/messages/unread/list/${listId}`, 'GET');
    unreadMessageCounts = response.data || {};
    
    // Notificar a todos los ítems registrados
    Object.keys(unreadMessageCounts).forEach(itemId => {
      notifyUnreadCountChange(itemId, unreadMessageCounts[itemId]);
    });
    
    return unreadMessageCounts;
  } catch (error) {
    console.error(`Error al obtener contadores de mensajes no leídos para la lista ${listId}:`, error);
    throw error;
  }
}

/**
 * Maneja la notificación de un nuevo mensaje recibido por WebSocket
 * @param {Object} data - Datos del mensaje
 */
export function handleNewMessage(data) {
  const { itemId, message } = data;
  
  // Incrementar contador si no es nuestro propio mensaje
  const currentUser = JSON.parse(localStorage.getItem('user'));
  if (currentUser && message.sender.id !== currentUser.id) {
    const currentCount = unreadMessageCounts[itemId] || 0;
    unreadMessageCounts[itemId] = currentCount + 1;
    
    // Notificar cambio en el contador
    notifyUnreadCountChange(itemId, unreadMessageCounts[itemId]);
    
    // Mostrar notificación si no estamos viendo el chat
    if (!document.getElementById(`chat-modal-${itemId}`)) {
      showNotification(`Nou missatge de ${message.sender.alias} a l'ítem`, 'info');
    }
  }
}

/**
 * Maneja la notificación de mensajes leídos por WebSocket
 * @param {Object} data - Datos de la notificación
 */
export function handleMessagesRead(data) {
  // Esta función se usaría para actualizar los indicadores de "leído" en un chat abierto
  // Actualmente solo registramos el evento
  console.log('Mensajes marcados como leídos:', data);
}

/**
 * Registra una función callback para recibir notificaciones de cambios en el contador de mensajes no leídos
 * @param {number} itemId - ID del ítem
 * @param {Function} callback - Función a llamar cuando cambie el contador
 */
export function subscribeToUnreadCount(itemId, callback) {
  messageCallbacks[itemId] = callback;
  
  // Notificar inmediatamente con el valor actual
  const count = unreadMessageCounts[itemId] || 0;
  callback(count);
  
  return () => {
    // Función para cancelar la suscripción
    delete messageCallbacks[itemId];
  };
}

/**
 * Notifica a los suscriptores sobre cambios en el contador de mensajes no leídos
 * @param {number} itemId - ID del ítem
 * @param {number} count - Nuevo contador
 */
function notifyUnreadCountChange(itemId, count) {
  const callback = messageCallbacks[itemId];
  if (callback) {
    callback(count);
  }
}

/**
 * Obtiene el contador de mensajes no leídos para un ítem específico
 * @param {number} itemId - ID del ítem
 * @returns {number} - Número de mensajes no leídos
 */
export function getUnreadCount(itemId) {
  return unreadMessageCounts[itemId] || 0;
}