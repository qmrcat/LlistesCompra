// Componente para gestionar el chat de un ítem
import { showModal, closeModal } from '../app.js';
import { sendMessage, getItemMessages, markMessagesAsRead } from '../utils/messageService.js';
import { showNotification } from './notification.js';
import { getLoggedUser } from '../auth/auth.js';

/**
 * Crea el modal de chat para un ítem específico
 * @param {Object} item - Información del ítem
 */
export function openChatModal(item, isList = false) {
    if (!item) return;
    
    let existingModal;
    // Si ya existe un modal de chat abierto, cerrarlo
    if (!isList){
        existingModal = document.getElementById(`chat-modal-${item.id}`);
    }else{
        existingModal = document.getElementById(`chat-modal-list`);
    }
    if (existingModal) return;
    
    // Mostrar loading mientras se cargan los mensajes
    //<div id="chat-modal-${item.id}" class="bg-white rounded-lg shadow-xl w-full max-w-xl flex flex-col h-[80vh] z-40">
    //  <div class="p-4 border-b bg-primary text-white flex justify-between items-center">

    const itemId = !isList ? item.id : item;
    const modalID = !isList ? item.id : 'list';
    const titolModal = !isList ? `Xat del producte: ${item.name}` : 'Xat de la llista actual'; 
    const formModal = !isList ? `chat-form-${item.id}` : 'chat-form-list';
    const inputModal = !isList ? `chat-input-${item.id}` : 'chat-input-list'
    const colorFons = !isList ? 'bg-gray-50' : 'bg-lime-100';

    const modalContent = `    
      <div id="chat-modal-${modalID}" class="bg-white rounded-lg shadow-xl w-full h-full md:h-[80vh] flex flex-col">
        <!-- Cabecera del chat -->
        
        <div class="p-4 border-b bg-primary text-white flex justify-between items-center flex-shrink-0">
          <h2 class="text-lg text-gray-600 font-bold">${titolModal}</h2>
          <button id="btn-close-chat" class="text-gray-600 hover:text-gray-200 text-lg cursor-pointer">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <!-- Contenedor de mensajes (scrollable) -->
        <div class="chat-messages flex-grow overflow-y-auto p-4 ${colorFons}">
          <div class="text-center py-8">
            <div class="loader"></div>
            <p class="mt-2 text-sm text-gray-500">Carregant missatges...</p>
          </div>
        </div>
        
        <!-- Formulario para enviar mensajes -->
        <div class="p-3 border-t bg-white">
          <form id="${formModal}" class="flex space-x-2">
            <input 
              type="text" 
              id="${inputModal}" 
              class="flex-grow px-3 py-3 border rounded focus:outline-none focus:ring focus:ring-blue-200" 
              placeholder="Escriu un missatge..."
              autocomplete="off"
              required
            >
            <input type="hidden" id="tipusXat" name="tipusXat" value="${isList ? 'list' : 'item'}">
            <button
              type="submit" 
              class="px-3 py-2 bg-blue-400 hover:bg-blue-600 text-white rounded shadow transition">
                <i class="fas fa-paper-plane"></i>
              </button>
          </form>
        </div>
      </div>
    `;
    
    // Mostrar el modal
    // showModal(modalContent, async (modalID, inputModal, itemId, isList = false) => {
    showModal(modalContent, async () => {
    console.log("🚀 ~ showModal ~ itemId:", itemId)

      // Configurar botón de cierre
      const modalContainer = document.getElementById('modal-container');
      
      // document.getElementById('btn-close-chat').addEventListener('click', closeModal);
      const chatModalId = !isList ? `chat-form-${itemId}` : `chat-form-list`;
      // Configurar formulario para enviar mensajes
      const chatForm = document.getElementById( chatModalId );

      //chatForm.getElementById('btn-close-chat').addEventListener('click', closeModal);
      const btnCloseChat = document.getElementById('btn-close-chat')

      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        sendChatMessage(itemId, isList);
      });
      
      btnCloseChat.addEventListener('click', closeModal)

      // Enfocar input
      document.getElementById(inputModal).focus();
      
      // Cargar mensajes
      try {
        await loadChatMessages(itemId, isList);
      } catch (error) {
        showNotification('Error al carregar els missatges', 'error');
      }
    });
}

/**
 * Carga los mensajes de un ítem
 * @param {number} itemId - ID del ítem
 */
async function loadChatMessages(itemId, isList = false) {
  try {
    const messages = await getItemMessages(itemId, isList);
    let chatContainer;

    if (!isList){
        chatContainer = document.querySelector(`#chat-modal-${itemId} .chat-messages`);
    }else{
        chatContainer = document.querySelector(`#chat-modal-list .chat-messages`);
    }
    
    if (chatContainer) {
      // Limpiar contenedor
      chatContainer.innerHTML = '';
      
      const currentUser = getLoggedUser();
      
      if (messages.length === 0) {
        chatContainer.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <i class="fas fa-comments text-4xl mb-2"></i>
            <p>No hi ha missatges</p>
            <p class="text-sm mt-1">Sigues el primer en escriure!</p>
          </div>
        `;
      } else {
        // Renderizar mensajes
        messages.forEach(message => {
          const isOwnMessage = currentUser && message.sender.id === currentUser.id;
          
          const messageElement = document.createElement('div');
          messageElement.className = `chat-message ${isOwnMessage ? 'chat-message-own' : 'chat-message-other'}`;
          messageElement.setAttribute("messageId", message.id); 
          messageElement.innerHTML = `
            <div class="chat-bubble">
              ${!isOwnMessage ? `<span class="chat-sender">${message.sender.alias}</span>` : ''}
              <p>${message.content}</p>
              <div class="flex justify-between items-center mt-2">
                <span class="chat-time">${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <button class="delete-message text-sm/8 ms-2 text-red-600 cursor-pointer">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          `;

          messageElement.querySelector('.delete-message').addEventListener('click', () => {
            console.log("🚀 ~ loadChatMessages ~ messageElement", messageElement)
            console.log("🚀 ~ loadChatMessages ~ messageElement", messageElement.getAttribute("messageId"))
          });

          chatContainer.appendChild(messageElement);
        });
        
        // Scroll al final
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      
      // Marcar mensajes como leídos
      await markMessagesAsRead(itemId);
    }
  } catch (error) {
    console.error(`Error al cargar mensajes para el ítem ${itemId}:`, error);
    throw error;
  }
}

/**
 * Envía un mensaje en el chat
 * @param {number} itemId - ID del ítem
 */
async function sendChatMessage(itemId, isList = false) {

  let inputElement
  const tipusXat = document.getElementById('tipusXat').value;
  
  if (tipusXat === 'item'){
    inputElement = document.getElementById(`chat-input-${itemId}`);
  }else{
    inputElement = document.getElementById(`chat-input-list`);
  } 

  const content = inputElement.value.trim();
  
  if (!content) return;
  
  try {
    // Desactivar input mientras se envía
    inputElement.disabled = true;
    
    // Enviar mensaje
    await sendMessage(itemId, content, (tipusXat === 'list'));
    
    // Limpiar input
    inputElement.value = '';
    
    // Rehabilitar input
    inputElement.disabled = false;
    inputElement.focus();
  } catch (error) {
    console.error(`Error al enviar mensaje para el ítem/list ${itemId}:`, error);
    showNotification('Error al enviar el missatge', 'error');
    
    // Rehabilitar input en caso de error
    inputElement.disabled = false;
  }
}