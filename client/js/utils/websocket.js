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

  //   // Guardar els tipus d'esdeveniments registrats
  //   const registeredEvents = new Set();
  
  //   // Afegir un listener per a tots els esdeveniments
  //   socket.onAny((eventName, ...args) => {
  //     if (!registeredEvents.has(eventName)) {
  //       console.warn(`Esdeveniment no registrat rebut: ${eventName}`, args[0]);
  //       // Pots afegir aquí la lògica per gestionar esdeveniments desconeguts
  //     }
  //   });

  // // Capturar el typus de missatge
  //   // Guardar la referència original al mètode 'on' de socket.io
  //   const originalOn = socket.on;
  
  //   // Sobreescriure el mètode 'on' per interceptar tots els tipus d'esdeveniments
  //   socket.on = function(eventName, callback) {
  //     // Interceptar l'esdeveniment original i afegir el nostre propi processament
  //     return originalOn.call(this, eventName, function(...args) {
  //       // Registrar o processar el tipus d'esdeveniment abans de la gestió
  //       console.log(`Tipus d'esdeveniment rebut: ${eventName}`);
        
  //       // Aquí pots afegir qualsevol lògica per processar el tipus d'esdeveniment
  //       if (eventName === 'item:added' || eventName === 'user:joined' || eventName === 'invitation:rejected') {
  //         // Fes alguna cosa específica amb aquests tipus d'esdeveniments
  //         console.log(`Esdeveniment important detectat: ${eventName}`, args[0]);
  //         // Pots emmagatzemar-lo, processar-lo o fer qualsevol altra acció
  //       }
        
  //       // Cridar al callback original amb els arguments originals
  //       callback.apply(this, args);
  //     });
  //   };



  
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

  // Eventos de mensajes de chat
  socket.on('message:new', handleNewMessage);
  socket.on('message:read', handleMessagesRead);
  socket.on('message:deleted', handleMessagesDelete);

  // Eventos de mensajes de chat de llista
  socket.on('message-list:new', handleNewMessageList);
  socket.on('message-list:read', handleMessagesReadList);
  socket.on('message-list:deleted', handleMessagesDeleteList);

  socket.on('vote:taken', handleVoteItem);
  

  // 'message:deleted' : 'message-list:deleted'
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

/**
 * Manejador para evento de conexión
 */
function handleSocketConnect() {
  console.log('WebSocket connectat');
  isConnected = true;
  reconnectAttempts = 0;
  
  // Uniu-vos a les sales de totes les llistes de l'usuari
  const listManagerCopy = listManager;
  if (listManagerCopy && listManagerCopy.lists) {
    
    const listIds = listManagerCopy.lists.map(list => list.id);
    const listName = listManagerCopy.lists.map(list => list.name);
    console.log('Unint-se a les sales de llistes:', listIds[0], listName[0]);
    joinListRooms(listIds);
  }
  
  // Uniu-vos a la llista actual si està oberta
  const currentListId = getCurrentListId();
  if (currentListId) {
    console.log('Unint-se a la sala de la llista actual:', currentListId);
    joinListRoom(currentListId);
  }
  
  // Mostrar notificació si s'estava intentant reconnectar
  if (reconnectAttempts > 0) {
    showNotification('Connexió restablerta', 'success');
  }
}



/**
 * Manejador per a esdeveniment de desconnexió
 */
function handleSocketDisconnect(reason) {
  console.log(`WebSocket desconnectat: ${reason}`);
  isConnected = false;
  
  // Intentar reconnectar si no va ser una desconnexió intencional
  if (reason !== 'io client disconnect') {
    attemptReconnect();
  }
}

/**
 * Manejador per esdeveniment d'error de connexió
 */
function handleSocketError(error) {
  console.error('Error de WebSocket:', error);
  
  // Si l'error és d'autenticació, no intenteu reconnectar
  if (error.message === 'Autenticació requerida' || error.message === 'Token invalit') {
    showNotification('Error d\'autenticació en temps real', 'error');
  } else {
    attemptReconnect();
  }
}

/**
 * Intentar reconnectar el WebSocket
 */
function attemptReconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    reconnectAttempts++;
    
    setTimeout(() => {
      console.log(`Intentant reconnectar WebSocket (intent ${reconnectAttempts})...`);
      socket.connect();
    }, reconnectInterval);
  } else {
    console.error('No s\'ha pogut reconnectar WebSocket després de diversos intents');
    showNotification('S\'ha pardut la connexió a temps real. Recarrega la pàgina.', 'warning', 10000);
  }
}

// ===== Manejadors d'esdeveniments de dades =====

/**
 * Manejador per a actualitzacions de llistes
 */
function handleListUpdated(data) {
  const { listId, list } = data;
  
  // Actualitzar la llista al gestor si està disponible
  if (listManager) {
    listManager.updateListInMemory(listId, list);
    
    // Actualitzar vista si està disponible
    if (listViewController) {
      listViewController.updateListCard(list);
    }
  }
}


/**
 * Manejador per a nous ítems
 */
function handleItemAdded(data) {
  const { listId, item } = data;
  const currentListId = getCurrentListId();
  
  console.log('WebSocket: Itrm afegit', data, 'Llista actual:', currentListId);
  
  // Si estem a la llista on s'ha afegit l'ítem
  if (currentListId && parseInt(currentListId) === parseInt(listId) && itemManager) {
    itemManager.addWebSocketItem(item);
    
    // Mostrar notificació si l'ítem no ha estat afegit per l'usuari actual
    const currentUser = getLoggedUser();
    if (currentUser && item.addedBy && item.addedBy.id !== currentUser.id) {
      showNotification(`${item.addedBy.alias} ha afegit "${item.name}"`, 'info');
    }
  }
}


/**
 * Manejador per a ítems actualitzats
 */
function handleItemUpdated(data) {
  const { listId, item } = data;
  const currentListId = getCurrentListId();
  
  console.log('WebSocket: Item actualitzat', data);
  
  // Si estem a la llista on es va actualitzar l'ítem
  if (currentListId && parseInt(currentListId) === parseInt(listId) && itemManager) {
    itemManager.updateWebSocketItem(item);
    
    // Mostrar notificació si l'ítem no ha estat actualitzat per l'usuari actual
    const currentUser = getLoggedUser();
    if (currentUser && item.addedBy && item.addedBy.id !== currentUser.id) {
      showNotification(`${item.addedBy.alias} ha actualitzat "${item.name}"`, 'info');
    }
  }
}


/**
 * Manejador per a ítems eliminats
 */
function handleItemDeleted(data) {
  const { listId, itemId } = data;
  const currentListId = getCurrentListId();
  
  console.log('WebSocket: Item eliminat', data);
  
  // Si estem a la llista on es va eliminar l'ítem
  if (currentListId && parseInt(currentListId) === parseInt(listId) && itemManager) {
    // Obtenir informació de l'ítem abans d'eliminar-lo (per mostrar en notificació)
    const item = itemManager.getItemById(itemId);
    const itemName = item ? item.name : 'un ítem';
    
    itemManager.deleteWebSocketItem(itemId);
    
    // Mostrar la notificació de l'ítem eliminat per l'usuari actual
    showNotification(`S'ha eliminat "${itemName}"`, 'info');
  }
}


function handleMessagesDelete(data) {

    // Importar dinàmicament el servei de missatges per evitar dependències circulars
    import('./messageService.js').then(messageService => {
      messageService.removeMessageFromView(data.messageId);
    });
    
}


function handleMessagesDeleteList(data) {

    // Importar dinàmicament el servei de missatges per evitar dependències circulars
    import('./messageService.js').then(messageService => {
      messageService.removeMessageFromView(data.messageId);
    });

}


function handleVoteItem(data) { 
  //{ userId, itemId, voteType, countUp, countDown }
  console.log("🚀 ~ handleVoteItem ~ data:", data)

  const { userId, itemId, voteType, countUp, countDown } = data;
  console.log("🚀 ~ handleVoteItem ~ countDown:", countDown)
  console.log("🚀 ~ handleVoteItem ~ countUp:", countUp)

  const currentUser = getLoggedUser();

  const voteElement = document.querySelector(`.item-container[data-item-id="${itemId}"]`);
  const voteContainerElement = voteElement.querySelector('.container-vote-item');
  const voteUpElement = voteContainerElement.querySelector('.vote-up');
  const voteDownElement = voteContainerElement.querySelector('.vote-down');
  const voteUpCountElement = voteContainerElement.querySelector('.vote-up-count');
  const voteDownCountElement = voteContainerElement.querySelector('.vote-down-count');
  voteUpCountElement.innerHTML = countUp
  voteDownCountElement.innerHTML = countDown

  if (currentUser.id === userId) {
    voteUpElement.disabled = ( voteType === 'up');
    voteDownElement.disabled = ( voteType === 'down');
  }
  //container-vote-item
}

/**
 * Manejador per a usuaris que s'uneixen a una llista
 */
function handleUserJoined(data) {
  const { listId, user } = data;
  
  // Actualitzar comptador de participants si cal
  if (listManager) {
    const list = listManager.getListById(listId);
    if (list) {
      list.participantCount = (list.participantCount || 1) + 1;
      
      // Actualitzar vista si està disponible
      if (listViewController) {
        listViewController.updateListCard(list);
      }
      
      // Mostrar notificació
      showNotification(`${user.alias} s'ha unit a la llista "${list.name}"`, 'info');
    }
  }
}

/**
 * Manejador per a usuaris que abandonen una llista
 */
function handleUserRemoved(data) {
  const { listId, user } = data;
  
  console.log('WebSocket: Usuari ha abandonat la llista', data);
  
  // Actualitzar comptador de participants si cal
  if (listManager) {
    const list = listManager.getListById(listId);
    if (list) {
      // Decrementar comptador de participants
      if (list.participantCount > 0) {
        list.participantCount -= 1;
      }
      
      // Actualitzar vista si està disponible
      if (listViewController) {
        listViewController.updateListCard(list);
      }
      
      // Si estem a la vista de detall d'aquesta llista, actualitzeu el comptador
      const currentListId = getCurrentListId();
      if (currentListId && parseInt(currentListId) === parseInt(listId)) {
        const participantsElement = document.getElementById('list-participants');
        if (participantsElement) {
          participantsElement.innerHTML = `
            <i class="fas fa-users mr-1"></i>${list.participantCount || 0}
          `;
        }
      }
      
      // Mostrar notificació
      showNotification(`${user.alias} ha abandonat la llista "${list.name}"`, 'info');
    }
  }
}


/**
 * Manejador per a invitacions rebutjades
 */
function handleInvitationRejected(data) {
  const { listId, listName, rejectedBy } = data;
  
  console.log('WebSocket: Invitació rebutjada', data);
  
  // Mostrar notificació a l'usuari que havia enviat la invitació
  if (rejectedBy && rejectedBy.email) {
    showNotification(`${rejectedBy.email} ha rebutjat la invitació a la llista "${listName}"`, 'info');
  }
  
  // Si el modal de configuració de la llista està obert i és la mateixa llista,
  // actualitzar la llista d'invitacions pendents
  const modalContainer = document.getElementById('modal-container');
  const currentListId = getCurrentListId();
  
  if (modalContainer && !modalContainer.classList.contains('hidden') && 
      currentListId && parseInt(currentListId) === parseInt(listId)) {
    
    // Intentar recarregar els detalls de la llista per actualitzar invitacions
    if (window.listManager) {
      window.listManager.fetchListDetail(listId)
        .then(listDetails => {
          // Actualitzar la secció d'invitacions pendents
          const pendingInvitationsContainer = document.getElementById('pending-invitations-list');
          if (pendingInvitationsContainer && listDetails.pendingInvitations) {
            // Actualitzar el comptador
            const pendingInvitationsTitle = document.querySelector('h3:contains("Invitacions pendents")');
            if (pendingInvitationsTitle) {
              pendingInvitationsTitle.textContent = `Invitacions pendents (${listDetails.pendingInvitations.length})`;
            }
            
            // Si no hi ha invitacions pendents, mostrar missatge
            if (listDetails.pendingInvitations.length === 0) {
              pendingInvitationsContainer.innerHTML = '<div class="text-gray-500 text-center p-2">No hi ha invitacions pendents</div>';
            }
          }
        })
        .catch(error => console.error('Error en actualitzar detalls de llista després de rebuig:', error));
    }
  }
}

/**
 * Manejador per a nous missatges de xat d'itens
 */
function handleNewMessage(data) {
    
  // Importar dinàmicament el servei de missatges per evitar dependències circulars
  import('./messageService.js').then(messageService => {
    messageService.handleNewMessage(data, false);
  });
  
  // Si el modal de xat està obert per a aquest ítem, actualitzeu la conversa
  // const chatModal = document.getElementById(`chat-modal-${data.itemId}`);
  const chatModal = document.getElementById(`chat-modal-${data.message.itemId}`);
  if (chatModal) {
    const chatContainer = chatModal.querySelector('.chat-messages');
    if (chatContainer) {
      // Actualitzar el xat dinàmicament
      updateChatWithNewMessage(chatContainer, data.message, false);
    }
  }
}

/**
 * Manejador per a nous missatges de xat per a les llites
 */
function handleNewMessageList(data) {
  console.log('WebSocket (List): Nou missatge rebut', data);
  
  // Importar dinàmicament el servei de missatges per evitar dependències circulars
  import('./messageService.js').then(messageService => {
    messageService.handleNewMessage(data, true);
  });
  
  // Si el modal de xat està obert per a aquest llista, actualitzeu la conversa
  const chatModal = document.getElementById(`chat-modal-list`);
  if (chatModal) {
    const chatContainer = chatModal.querySelector('.chat-messages');
    if (chatContainer) {
      // Actualitzar el xat dinàmicament
      updateChatWithNewMessage(chatContainer, data.message, true);
    }
  }
}

/**
 * Manejador per a missatges llegits dels items
 */
function handleMessagesRead(data) {
  console.log('WebSocket: Missatges marcats com a llegits', data);
  
  // Importar dinàmicament el servei de missatges per evitar dependències circulars
  import('./messageService.js').then(messageService => {
    messageService.handleMessagesRead(data);
  });
}


/**
 * Manejador per a missatges llegits de les llistes
 */
function handleMessagesReadList(data) {
  console.log('WebSocket: Missatges marcats com a llegits', data);
  
  // Importar dinàmicament el servei de missatges per evitar dependències circulars
  import('./messageService.js').then(messageService => {
    messageService.handleMessagesRead(data, true);
  });
}

/**
 * Actualitza el xat amb un missatge nou rebut
 * @param {HTMLElement} chatContainer - Contenidor del xat
 * @param {Object} message - Dades del missatge
 * @param {boolean} isList - Indica si és un missatge de llista
 */
function updateChatWithNewMessage(chatContainer, message, isList = false) {

  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isOwnMessage = currentUser && message.sender.id === currentUser.id;
  
  const messageElement = document.createElement('div');
  messageElement.className = `chat-message ${isOwnMessage ? 'chat-message-own' : 'chat-message-other'} fade-in`;
  messageElement.setAttribute("messageId", message.id); 
  messageElement.innerHTML = `
    <div class="chat-bubble">
      ${!isOwnMessage ? `<span class="chat-sender">${message.sender.alias}</span>` : ''}
      <p>${message.content}</p>
      <span class="chat-time">${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
    </div>
  `;
  
  chatContainer.appendChild(messageElement);
  
  // Scroll al final
  chatContainer.scrollTop = chatContainer.scrollHeight;
  
  // Si no es un missatge propi, marcar com a llegit
  if (!isOwnMessage) {
    import('./messageService.js').then(messageService => {
      messageService.markMessagesAsRead((!isList ? message.itemId : message.listId), isList).catch(console.error);
    });
  }
}


/**
 * Obtener l'ID de la llista actual
 * @returns {number|null} - ID de la llista actual o null si no hi ha cap
 */
function getCurrentListId() {
    return currentListId || null;
}
