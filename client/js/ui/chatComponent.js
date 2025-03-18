// Componente para gestionar el chat de un ítem
import { showModal, closeModal } from '../app.js';
import { sendMessage, getItemMessages, markMessagesAsRead, deleteMessageIndividual, deleteMessageAll } from '../utils/messageService.js';
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

    const nameInput = document.getElementById('list-name');
    
    // Mostrar loading mientras se cargan los mensajes
    //<div id="chat-modal-${item.id}" class="bg-white rounded-lg shadow-xl w-full max-w-xl flex flex-col h-[80vh] z-40">
    //  <div class="p-4 border-b bg-primary text-white flex justify-between items-center">

    const itemId = !isList ? item.id : item;
    const modalID = !isList ? item.id : 'list';
    const titolModal = !isList  ? `Xat del producte: ${item.name} de la llista ${nameInput.textContent}` 
                                : `Xat de la llista actual: ${nameInput.textContent}`; 
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

      // Configurar botón de cierre
      const modalContainer = document.getElementById('modal-container');
      
      // document.getElementById('btn-close-chat').addEventListener('click', closeModal);
      const chatModalId = !isList ? `chat-form-${itemId}` : `chat-form-list`;
      // Configurar formulario para enviar mensajes
      const chatForm = document.getElementById( chatModalId );

      //chatForm.getElementById('btn-close-chat').addEventListener('click', closeModal);
      const btnCloseChat = document.getElementById('btn-close-chat')

      chatForm.addEventListener('submit', (e) => {
        //console.log("🚀 ~ showModal chatForm.addEventListener ~ e:", e)
        e.preventDefault();
        const isList = (e.id === 'chat-form-list')
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
    } else {
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

          let typeMessage = 'normal';
          if (message.deleteBy.includes(currentUser.id)){
            typeMessage = 'delete';
          }
          

          const isOwnMessage = currentUser && message.sender.id === currentUser.id;
          const positionMenu = isOwnMessage ? 'right' : 'left';
          const positionBorderRadius = isOwnMessage ? 'borderTopRightRadius' : 'borderTopLeftRadius';


          // .borderTopRightRadius{
          //   border-top-right-radius: 0;
          // }
        
          // .borderTopLeftRadius{

          // Preparar menú de opciones
          let menuHtml = '';
          if(typeMessage !== 'delete'){
            menuHtml = `
              <div class="dropdown relative ms-4">
                <button class="message-menu w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu-message hidden absolute ${positionMenu}-0 w-64 bg-zinc-100 rounded-md shadow-lg z-10 ${positionBorderRadius}">
                  <button class="delete-message block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-300">
                    <i class="fas fa-trash-alt mr-2"></i>Eliminar només per a mi 
                  </button>
              `
            menuHtml += isOwnMessage ? `
                  <button class="delete-message-tothom block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-300">
                    <i class="fas fa-trash-alt mr-2"></i>Eliminar per a tothom 
                  </button>
              ` : '';
            menuHtml += `
                  <button class="delete-message-cancel block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-zinc-300">
                    Cancelar
                  </button>
                </div>
              </div>
            `;
          }

          const messageElement = document.createElement('div');

          if(typeMessage !== 'delete'){
              messageElement.className = `chat-message ${isOwnMessage ? 'chat-message-own' : 'chat-message-other'}`;

              messageElement.setAttribute("messageId", message.id); 
              messageElement.innerHTML = `
                <div class="chat-bubble">
                  ${!isOwnMessage ? `<span class="chat-sender">${message.sender.alias}</span>` : ''}
                  <p>${message.content}</p>
                  <div class="flex justify-between items-center mt-2">
                    <span class="chat-time">${new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    ${menuHtml}
                  </div>
                </div>
              `;

              // messageElement.querySelector('.message-menu').addEventListener('click', () => {
              //   console.log("🚀 ~ loadChatMessages ~ messageElement", messageElement)
              //   console.log("🚀 ~ loadChatMessages ~ messageElement", messageElement.getAttribute("messageId"))
              // });

                  // Menú desplegable
              const menuBtnMessage = messageElement.querySelector('.message-menu');
              const dropdownMenuMessage = messageElement.querySelector('.dropdown-menu-message');

              menuBtnMessage.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenuMessage.classList.toggle('hidden');
                
                // Cerrar al hacer clic fuera
                const closeDropdownMessage = () => {
                  dropdownMenuMessage.classList.add('hidden');
                  document.removeEventListener('click', closeDropdownMessage);
                };
                
                // Añadir listener con pequeño delay para evitar que se cierre inmediatamente
                setTimeout(() => {
                  document.addEventListener('click', closeDropdownMessage);
                }, 0);
              });

              // Botón de eliminar ítem
              const deleteMessageBtn = messageElement.querySelector('.delete-message');
              if (deleteMessageBtn) {
                deleteMessageBtn.addEventListener('click', async () => {
                  //this.showDeleteConfirmationModal(item);
                  console.log("🚀 ~ loadChatMessages ~ deleteMessageBtn", deleteMessageBtn)
                  console.log("🚀 ~ loadChatMessages ~ messageElement", messageElement.getAttribute("messageId"))
                  try {
                    // await this.itemManager.deleteItem(item.id);
                    await deleteMessageIndividual(messageElement.getAttribute("messageId"), isList)
                    showNotification('Missatge eliminat correctament', 'success');
                  } catch (error) {
                    // El error ya se maneja en itemManager
                  }
                });
              }

              const deleteMessageTothomBtn = messageElement.querySelector('.delete-message-tothom');
              if (deleteMessageTothomBtn) {
                deleteMessageTothomBtn.addEventListener('click', async () => {
                  //this.showDeleteConfirmationModal(item);
                  console.log("🚀 ~ loadChatMessages ~ deleteMessageTothomBtn", deleteMessageTothomBtn)
                  console.log("🚀 ~ loadChatMessages ~ messageElement", messageElement.getAttribute("messageId"))
                  try {
                    // await this.itemManager.deleteItem(item.id);
                    await deleteMessageAll(messageElement.getAttribute("messageId"), isList)
                    showNotification('Missatge eliminat correctament per a tothom', 'success');
                  } catch (error) {
                    // El error ya se maneja en itemManager
                  }
                });
              }
            } else {
              messageElement.className = `chat-message ${isOwnMessage ? 'chat-message-own' : 'chat-message-other'}`;

              messageElement.innerHTML = `
                <div class="chat-bubble-delete">
                  <p>Missatge eliminat </p>
                </div>
              `;
            }
            chatContainer.appendChild(messageElement);
          });
        }
      
        // Scroll al final
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
      
      // Marcar mensajes como leídos
      await markMessagesAsRead(itemId, isList);
        
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