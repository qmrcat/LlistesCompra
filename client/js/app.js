// Punto de entrada principal de la aplicación
import { isAuthenticated, getAuthToken, getLoggedUser, logout } from './auth/auth.js';
import { setupUIComponents } from './ui/modal.js';
import { showNotification } from './ui/notification.js';
import { ListManager } from './lists/listManager.js';
import { ListViewController } from './lists/listView.js';
import { ItemManager } from './items/itemManager.js';
import { setupWebSocket } from './utils/websocket.js';
import { sendChatMessageAutomatic } from './ui/chatComponent.js';

// Elementos del DOM
const headerApp = document.getElementById('header-app');
const authContainer = document.getElementById('auth-container');
const listsContainer = document.getElementById('lists-container');
const listDetailContainer = document.getElementById('list-detail-container');
const userMenu = document.getElementById('user-menu');
const userAlias = document.getElementById('user-alias');
const btnProfile = document.getElementById('btn-profile');
const btnLogout = document.getElementById('btn-logout');
const btnNewList = document.getElementById('btn-new-list');
const btnBackToLists = document.getElementById('btn-back-to-lists');
const btnListConfig = document.getElementById('btn-list-config');
const newItemForm = document.getElementById('new-item-form');
const authLoader = document.getElementById('auth-loader');

// Botón de chat
const chatButtonList = document.querySelector('.chat-button-list');
const messageBadgeList = chatButtonList.querySelector('.message-badge-list');



// Instancias de gestores
export let listManager = null;
export let listViewController = null;
export let itemManager = null;
export let currentListId = null;
export let aliasUsuari = null;

// Obrir chat de la llista
function openChatList(listId) {
  import('./ui/chatComponent.js').then(module => {
    
    module.openChatModal(listId, true);
  });
}

chatButtonList.addEventListener('click', () => {
  openChatList(currentListId);
});

// Suscribirse a actualizaciones de contador de mensajes no leídos
import('./utils/messageService.js').then(messageService => {
  const unsubscribe = messageService.subscribeToUnreadCount(currentListId, (count) => {
    if (count > 0) {
      messageBadgeList.textContent = count > 9 ? '9+' : count;
      messageBadgeList.classList.remove('hidden');
    } else {
      messageBadgeList.classList.add('hidden');
    }
  }, true);
  
  // Almacenar función para cancelar suscripción (se podría usar para limpiar)
  // itemElement.dataset.unsubscribeMessages = true;
});


// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', async () => {
  setupUIComponents();
  
  // Comprobar autenticación
  await checkAuth();
  
  // Configurar eventos
  setupEventListeners();
});

// Verificar estado de autenticación
async function checkAuth() {
  if (isAuthenticated()) {
    try {
      const user = getLoggedUser();
      // Actualizar UI para usuario autenticado
      userAlias.textContent = user.alias;
      aliasUsuari = user.alias;
      console.log("Connectat l'usuari:", aliasUsuari)
      userMenu.classList.remove('hidden');
      
      // Inicializar gestores
      listManager = new ListManager();
      listViewController = new ListViewController(listManager);
      
      // Cargar listas del usuario
      await listViewController.loadLists();
      
      // Mostrar sección de listas
      authContainer.classList.add('hidden');
      listsContainer.classList.remove('hidden');
      
      // Configurar WebSocket
      setupWebSocket();
    } catch (error) {
      console.error('Error al inicializar la aplicación:', error);
      redirectToLogin();
    }
  } else {
    // Redirigir a login si no está autenticado
    redirectToLogin();
  }
}

// Configurar eventos
function setupEventListeners() {
  // Botón de perfil
  btnProfile.addEventListener('click', showProfileModal);
  
  // Botón de logout
  btnLogout.addEventListener('click', handleLogout);
  
  // Botón de nueva lista
  btnNewList.addEventListener('click', showNewListModal);
  
  // Botón de volver a listas
  btnBackToLists.addEventListener('click', () => {
    listDetailContainer.classList.add('hidden');
    headerApp.classList.remove('hidden');
    listsContainer.classList.remove('hidden');
    currentListId = null;
  });
  
  // Botón de configuración de lista
  btnListConfig.addEventListener('click', () => {
    if (currentListId) {
      showListConfigModal(currentListId);
    }
  });
  
  // Formulario de nuevo ítem
  newItemForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (currentListId && itemManager) {
      const nameInput = document.getElementById('new-item-name');
      const quantityInput = document.getElementById('new-item-quantity');
      const typesUnits = document.getElementById('new-item-typesUnits');
      
      await itemManager.addItem(currentListId, {
        name: nameInput.value,
        quantity: quantityInput.value,
        typesUnits: typesUnits.value
      });
      
      nameInput.value = '';
      quantityInput.value = '1';
      typesUnits.value = 'unitat';
    }
  });
}

  // Botón de refrescar ítems
  document.getElementById('btn-refresh-items').addEventListener('click', () => {
    // if (currentListId && itemManager) {
    //   showNotification('Actualitzant ítems...', 'info');
    //   itemManager.loadItems().then(() => {
    //     showNotification('Ítems actualitzats', 'success');
    //   }).catch(() => {
    //     showNotification('Error al actualitzar els ítems', 'error');
    //   });
    // }
    refreshItems()
  });


function refreshItems() {
  if (currentListId && itemManager) {
    showNotification('Actualitzant ítems...', 'info');
    itemManager.loadItems().then(() => {
      showNotification('Ítems actualitzats', 'success');
    }).catch(() => {
      showNotification('Error al actualitzar els ítems', 'error');
    });
  }
}


// Mostrar modal de perfil
function showProfileModal() {
  const user = getLoggedUser();
  
  const modalContent = `
    <!-- ProfileModal -->
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">El meu perfil</h2>
      
      <div class="mb-4">
        <label for="profile-email" class="block text-sm font-medium text-gray-700 mb-1">Correu electrònic</label>
        <input 
          type="email" 
          id="profile-email" 
          class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200 bg-gray-100" 
          value="${user.email}"
          disabled
        >
      </div>
      
      <div class="mb-4">
        <label for="profile-alias" class="block text-sm font-medium text-gray-700 mb-1">Àlies</label>
        <input 
          type="text" 
          id="profile-alias" 
          class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200" 
          value="${user.alias}"
        >
      </div>
      
      <div class="flex justify-end space-x-2">
        <button 
          id="btn-cancel-profile" 
          class="px-4 py-2 border rounded bg-red-100 text-gray-600 hover:bg-red-300  hover:text-white transition"
        >Cancel·lar</button>
        <button 
          id="btn-save-profile" 
          class="px-4 py-2 bg-blue-400 hover:bg-blue-600 text-white rounded shadow transition"
          >Desar</button>
      </div>
    </div>
  `;

  showModal(modalContent, () => {
    document.getElementById('btn-cancel-profile').addEventListener('click', closeModal);
    document.getElementById('btn-save-profile').addEventListener('click', updateProfile);
  });
}

// Actualizar perfil
async function updateProfile() {
  const aliasInput = document.getElementById('profile-alias');
  const newAlias = aliasInput.value.trim();
  
  if (!newAlias) {
    showNotification('L\'àlies no pot estar buit', 'error');
    return;
  }
  
  try {
    // Implementar llamada a API para actualizar el alias
    const token = getAuthToken();
    const response = await fetch('/api/auth/update-alias', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ alias: newAlias })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar usuario en localStorage
      const user = getLoggedUser();
      user.alias = newAlias;
      localStorage.setItem('user', JSON.stringify(user));
      
      // Actualizar UI
      userAlias.textContent = newAlias;
      
      showNotification('Perfil actualitzat correctament', 'success');
      closeModal();
    } else {
      showNotification(data.message || 'Error al actualitzar el perfil', 'error');
    }
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    showNotification('Error al actualitzar el perfil', 'error');
  }
}

// Mostrar modal de nueva lista
function showNewListModal() {
  const modalContent = `
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Nova llista de compra</h2>
      
      <div class="mb-4">
        <label for="new-list-name" class="block text-sm font-medium text-gray-700 mb-1">Nom de la llista</label>
        <input 
          type="text" 
          id="new-list-name" 
          class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200" 
          placeholder="Ex: Compra setmanal"
        >
      </div>
      
      <div class="flex justify-end space-x-2">
        <button id="btn-cancel-list" class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 transition">Cancel·lar</button>
        <button id="btn-create-list" class="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded shadow transition">Crear</button>
      </div>
    </div>
  `;
  
  showModal(modalContent, () => {
    document.getElementById('btn-cancel-list').addEventListener('click', closeModal);
    document.getElementById('btn-create-list').addEventListener('click', createNewList);
    
    // Enfocar input
    document.getElementById('new-list-name').focus();
  });
}

// Mostrar modal de confirmación para abandonar lista
function confirmLeaveList(listId) {
  const list = listManager.getListById(listId);
  if (!list) return;
  
  const modalContent = `
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Abandonar llista</h2>
      
      <p class="mb-6">
        Estàs segur que vols abandonar la llista <strong>"${list.name}"</strong>?
        <br><br>
        Si abandones la llista, ja no podràs veure ni modificar els seus ítems.
      </p>
      
      <div class="flex justify-end space-x-2">
        <button id="btn-cancel-leave" class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 transition">Cancel·lar</button>
        <button id="btn-confirm-leave" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow transition">Abandonar</button>
      </div>
    </div>
  `;
  
  showModal(modalContent, () => {
    document.getElementById('btn-cancel-leave').addEventListener('click', closeModal);
    document.getElementById('btn-confirm-leave').addEventListener('click', async () => {
      try {
        document.getElementById('btn-confirm-leave').innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Abandonant...';
        document.getElementById('btn-confirm-leave').disabled = true;
        
        await listManager.leaveList(listId);
        
        closeModal();
        showNotification('Has abandonat la llista correctament', 'success');
        
        // Volver a la pantalla de listas
        listDetailContainer.classList.add('hidden');
        listsContainer.classList.remove('hidden');
        currentListId = null;
        
        // Recargar listas
        await listViewController.loadLists();
      } catch (error) {
        console.error('Error al abandonar la lista:', error);
        showNotification(error.message || 'Error al abandonar la llista', 'error');
      }
    });
  });
}

// Crear nueva lista
async function createNewList() {
  const nameInput = document.getElementById('new-list-name');
  const listName = nameInput.value.trim();
  
  if (!listName) {
    showNotification('El nom de la llista no pot estar buit', 'error');
    return;
  }
  
  try {
    await listManager.createList(listName);
    await listViewController.loadLists();
    
    closeModal();
    showNotification('Llista creada correctament', 'success');
  } catch (error) {
    console.error('Error al crear lista:', error);
    showNotification('Error al crear la llista', 'error');
  }
}

// Mostrar modal de configuración de lista
// Mostrar modal de configuración de lista
async function showListConfigModal(listId) {
  // Mostrar un indicador de carga mientras obtenemos los detalles de la lista
  showModal(`
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Configuració de la llista</h2>
      <div class="flex justify-center items-center py-4">
        <div class="loader"></div>
      </div>
    </div>
  `);
  
  try {
    // Obtener detalles completos de la lista para asegurar que tenemos los participantes
    const listDetails = await listManager.fetchListDetail(listId);

    const disabledVoting = listDetails.participantCount < 2 ? 'disabled' : '';
    
    // Crear el contenido del modal con los datos actualizados
    const modalContent = `
     <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Configuració de la llista</h2>
        
        <div class="mb-4">
          <label for="list-name-input" class="block text-sm font-medium text-gray-700 mb-1">Nom de la llista</label>
          <input 
            type="text" 
            id="list-name-input" 
            name="list-name-input" 
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
            value="${listDetails.name}"
          >
          <input  type="hidden" 
                  id="list-name-input-old" 
                  name="list-name-input-old" 
                  value="${listDetails.name}" 
          >
        </div>
        <!-- Checkbox amb Toggle Switch -->
        <div class="pt-2">
          <div class="flex justify-between items-center">
            <label class="block text-sm font-medium text-gray-700">Activar la votació</label>
            <div id="checkbox-voting" class="flex items-center space-x-3 cursor-pointer">
              <div id="toggle-voting" class="relative w-10 h-6 bg-gray-300 rounded-full transition-colors duration-300">
                <div id="toggle-circle-voting" class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300"></div>
                <input  type="hidden" 
                        id="activate-voting" 
                        name="activate-voting" 
                        value="${listDetails.activateVoting ? 1 : 0}" 
                        valueOld="${listDetails.activateVoting ? 1 : 0}" 
                >
                <input  type="hidden" 
                        id="activate-voting-old" 
                        name="activate-voting-old" 
                        value="${listDetails.activateVoting ? 1 : 0}" 
                >
                <input  type="hidden" 
                        id="activate-locked" 
                        name="activate-locked" 
                        value="${disabledVoting}" 
                >
              </div>
              <span id="status-voting" class="text-gray-700 text-sm">Desactivat</span>
            </div>
          </div>
          <p id="description-voting" class="text-xs text-gray-500 mt-1">
            Marca aquesta casella per activar la votació d'ítems en aquesta llista.
          </p>
        </div>      
        
        <div class="my-4 ">
          <h3 class="font-medium text-gray-700 mb-2">Participants (${listDetails.participants ? listDetails.participants.length : 0})</h3>
          <div id="participant-list" class="space-y-2 max-h-40 overflow-y-auto">
            ${listDetails.participants ? listDetails.participants.map(p => `
              <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>${p.alias}</span>
                <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">${p.role}</span>
              </div>
            `).join('') : '<div class="text-gray-500 text-center p-2">No hi ha participants</div>'}
          </div>
        </div>
        
        <!-- Invitaciones pendientes -->
        <div class="mb-4">
          <h3 class="font-medium text-gray-700 mb-2">Invitacions pendents (${listDetails.pendingInvitations ? listDetails.pendingInvitations.length : 0})</h3>
          <div id="pending-invitations-list" class="space-y-2 max-h-40 overflow-y-auto">
            ${listDetails.pendingInvitations && listDetails.pendingInvitations.length > 0 ? 
              listDetails.pendingInvitations.map(inv => `
                <div class="flex items-center justify-between p-2 bg-gray-50 rounded invitation-item" data-invitation-id="${inv.id}">
                  <div>
                    <span class="block">${inv.email}</span>
                    <span class="text-xs text-gray-500">Expira: ${new Date(inv.expiresAt).toLocaleDateString('ca-ES')}</span>
                  </div>
                  <div class="flex space-x-1">
                    <button class="resend-invitation p-1 text-blue-600 hover:text-blue-800" title="Reenviar invitació">
                      <i class="fas fa-paper-plane"></i>
                    </button>
                    <button class="cancel-invitation p-1 text-red-600 hover:text-red-800" title="Cancel·lar invitació">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              `).join('') 
              : 
              '<div class="text-gray-500 text-center p-2">No hi ha invitacions pendents</div>'
            }
          </div>
        </div>
        
        <div class="mb-4">
          <h3 class="font-medium text-gray-700 mb-2">Convidar participant</h3>
          <div class="flex space-x-2">
            <input 
              type="email" 
              id="invite-email" 
              name="invite-email" 
              class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              placeholder="Correu electrònic"
            >
            <button id="btn-send-invite" class="px-3 py-2 bg-blue-400 hover:bg-blue-600 text-white rounded shadow transition">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
        
        <div class="flex justify-between items-center mt-6">
          ${listDetails.userRole !== 'owner' ? `
            <button id="btn-leave-list" class="px-4 py-2 border border-red-600 text-red-600 rounded hover:bg-red-50 transition">
              Abandonar llista
            </button>
          ` : `
            <div></div>
          `}
          
          <div class="flex space-x-2">
            <button 
              id="btn-cancel-config" 
              class="px-4 py-2 border rounded bg-red-100 text-gray-600 hover:bg-red-300  hover:text-white transition"
            >Cancel·lar</button>
            <button id="btn-save-config" class="px-4 py-2 bg-blue-400 hover:bg-blue-600 text-white rounded shadow transition">Desar</button>
          </div>
        </div>
      </div>
    `;
    
    // Mostrar el modal actualizado
    // showModal(modalContent, () => {
    //   // document.getElementById('btn-cancel-config').addEventListener('click', closeModal);
    //   // document.getElementById('btn-save-config').addEventListener('click', () => updateListConfig(listId));
    //   // document.getElementById('btn-send-invite').addEventListener('click', () => sendInvitation(listId));
    // });

    // Mostrar el modal actualizado
    showModal(modalContent, () => {
      document.getElementById('btn-cancel-config').addEventListener('click', closeModal);
      document.getElementById('btn-save-config').addEventListener('click', () => {

          const nameInput = document.getElementById('list-name-input');

          const nameInputOld = document.getElementById('list-name-input-old');
                    
          const newName = nameInput.value.trim();
          const nameOld = nameInputOld.value.trim();
          const activateVoting = document.getElementById('activate-voting').value
          const activateVotingOld = document.getElementById('activate-voting-old').value
          
          if (!newName) {
            showNotification('El nom de la llista no pot estar buit', 'error');
            return;
          }
          updateListConfig(listId, newName, activateVoting, nameOld, activateVotingOld)
      });
      document.getElementById('btn-send-invite').addEventListener('click', () => sendInvitation(listId));

      
      const checkboxVoting = document.getElementById('checkbox-voting');
      const toggleVoting = document.getElementById('toggle-voting');
      const toggleCircleVoting = document.getElementById('toggle-circle-voting');
      const statusTextVoting = document.getElementById('status-voting');
      const descriptionVoting = document.getElementById('description-voting');
      
      const activateVoting = document.getElementById('activate-voting');
      const activateLocked = document.getElementById('activate-locked');

      // Valor inicial
      let isCheckedVoting = activateVoting.value === '1';
          // Variable per controlar si el checkbox està bloquejat. disabled
      let isLocked = activateLocked.value === 'disabled';

          // Funció per obtenir el valor (0 o 1)
      function getValueVoting() {
        return isCheckedVoting ? 1 : 0;
      }
     
      
      // Funció per actualitzar la UI
      function updateUIVoting() {
          const value = getValueVoting();
          
          // Actualitzar l'estat visual
          if (isCheckedVoting ) {
            toggleVoting.classList.remove('bg-gray-300');
            toggleVoting.classList.add('bg-blue-500');
            toggleCircleVoting.classList.add('transform', 'translate-x-4');
            statusTextVoting.textContent = 'Activat';
            descriptionVoting.textContent = 'Desmarca aquesta casella per desactivar la votació d\'ítems en aquesta llista.';
          } else {
            toggleVoting.classList.remove('bg-blue-500');
            toggleVoting.classList.add('bg-gray-300');
            toggleCircleVoting.classList.remove('transform', 'translate-x-4');
            statusTextVoting.textContent = 'Desactivat';
            descriptionVoting.textContent = isLocked  ? 'Aquesta opció no es pot modificar actualment, necessites almenys 2 participants.' 
                                                      : 'Marca aquesta casella per activar la votació d\'ítems en aquesta llista.';
          }

          // Aplicar estil de bloquejat si és necessari
          if (isLocked) {
            checkboxVoting.classList.add('opacity-50', 'cursor-not-allowed');
            checkboxVoting.classList.remove('cursor-pointer');
          } else {
            checkboxVoting.classList.remove('opacity-50', 'cursor-not-allowed');
            checkboxVoting.classList.add('cursor-pointer');
          }
          
          // Actualitzar el valor del camp ocult
          activateVoting.value = value;
          
          return value;
      }

      // Funció per bloquejar/desbloquejar el checkbox
      function lockCheckboxVoting(lock = true) {
        isLocked = lock;
        
        // Si estem bloquejant, assegurem-nos que estigui desactivat
        if (lock && isChecked) {
          isChecked = false;
        }
        
        updateUIVoting();
      }

      // Event listener per al checkbox
      checkboxVoting.addEventListener('click', function() {
        // Si està bloquejat, mostrar missatge i no canviar l'estat
        if (isLocked) {
          // Crear i mostrar tooltip amb missatge
          // showLockedMessage();
          return;
        }
        isCheckedVoting = !isCheckedVoting;
        updateUIVoting();
      });

      

      // Añadir evento para abandonar la lista si no es propietario
      const leaveListBtn = document.getElementById('btn-leave-list');
      if (leaveListBtn) {
        leaveListBtn.addEventListener('click', () => confirmLeaveList(listId));
      }

      // Añadir eventos a los botones de invitaciones pendientes
      document.querySelectorAll('.resend-invitation').forEach(button => {
        button.addEventListener('click', async (e) => {
          e.preventDefault();
          const invitationItem = e.target.closest('.invitation-item');
          const invitationId = invitationItem.dataset.invitationId;
          
          try {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            await listManager.resendInvitation(invitationId);
            showNotification('Invitació reenviada correctament', 'success');
            button.innerHTML = '<i class="fas fa-paper-plane"></i>';
          } catch (error) {
            showNotification('Error al reenviar la invitació', 'error');
            button.innerHTML = '<i class="fas fa-paper-plane"></i>';
          }
        });
      });
      
      document.querySelectorAll('.cancel-invitation').forEach(button => {
        button.addEventListener('click', async (e) => {
          e.preventDefault();
          const invitationItem = e.target.closest('.invitation-item');
          const invitationId = invitationItem.dataset.invitationId;
          
          try {
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            await listManager.cancelInvitation(invitationId);
            invitationItem.remove();
            
            // Actualizar contador de invitaciones pendientes
            const pendingInvitationsTitle = document.querySelector('h3:contains("Invitacions pendents")');
            const pendingCount = document.querySelectorAll('.invitation-item').length;
            if (pendingInvitationsTitle) {
              pendingInvitationsTitle.textContent = `Invitacions pendents (${pendingCount})`;
            }
            
            // Si no quedan invitaciones, mostrar mensaje
            if (pendingCount === 0) {
              document.getElementById('pending-invitations-list').innerHTML = 
                '<div class="text-gray-500 text-center p-2">No hi ha invitacions pendents</div>';
            }
            
            showNotification('Invitació cancel·lada correctament', 'success');
          } catch (error) {
            showNotification('Error al cancel·lar la invitació', 'error');
            button.innerHTML = '<i class="fas fa-times"></i>';
          }
        });
      });
      updateUIVoting();
    });
  } catch (error) {
    console.error('Error al obtener detalles de la lista:', error);
    showNotification('Error al carregar la configuració de la llista', 'error');
    closeModal();
  }
}


// Actualizar configuración de lista
async function updateListConfig(listId, name, activateVoting, nameInputOld, activateVotingOld) {
  try {
    // Implementar llamada a API para actualizar el nombre de la lista
    await listManager.updateList(listId, { name,  activateVoting});
    
    closeModal();
    showNotification('Llista actualitzada correctament', 'success');
    
    // Recargar listas
    await listViewController.loadLists();
    let messatge = ''
    let messatgeVoting = ''


    if (nameInputOld.trim() !== name.trim()) {
      sendChatMessageAutomatic(listId, true, 'list', `El nom de la llista ha canviat a: ${name}`)
    }

    if (activateVoting === '0' && activateVotingOld === '1') {
      document.querySelectorAll('.container-vote-item').forEach(el => el.remove());
      const containers = document.querySelectorAll('.item-container');
      
      // Elimina la classe 'mb-4' de cada div
      containers.forEach(container => { container.classList.remove('mb-4') })
      sendChatMessageAutomatic(listId, true, 'list', `La votació ha estat desactivada a la llista`)
    } else {
      if (activateVoting === '1' && activateVotingOld === '0') {
        refreshItems()
        sendChatMessageAutomatic(listId, true, 'list', `La votació ha estat activada a la llista`)
      }
    }
    

  } catch (error) {
    console.error('Error al actualizar lista:', error);
    showNotification('Error al actualitzar la llista', 'error');
  }
}




// Enviar invitación a la lista
async function sendInvitation(listId) {
  const emailInput = document.getElementById('invite-email');
  const email = emailInput.value.trim();
  
  if (!email) {
    showNotification('El correu electrònic no pot estar buit', 'error');
    return;
  }
  
  try {
    await listManager.inviteUserToList(listId, email);
    emailInput.value = '';
    showNotification('Invitació enviada correctament', 'success');
  } catch (error) {
    console.error('Error al enviar invitación:', error);
    showNotification('Error al enviar la invitació', 'error');
  }
}



// Mostrar modal de confirmación para rechazar invitación
async function confirmRejectInvitation(token) {
  try {
    const invitation = document.querySelector(`[data-token="${token}"]`).closest('.invitation-item');
    const listName = invitation.querySelector('.font-medium').textContent;
    
    // Construir modal de confirmación
    const modalContent = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Rebutjar invitació</h2>
        
        <p class="mb-6">
          Estàs segur que vols rebutjar la invitació a la llista <strong>"${listName}"</strong>?
        </p>
        
        <div class="flex justify-end space-x-2">
          <button id="btn-cancel-reject" class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 transition">Cancel·lar</button>
          <button id="btn-confirm-reject" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow transition">Rebutjar</button>
        </div>
      </div>
    `;
    
    showModal(modalContent, () => {
      document.getElementById('btn-cancel-reject').addEventListener('click', closeModal);
      document.getElementById('btn-confirm-reject').addEventListener('click', async () => {
        try {
          const rejectBtn = document.getElementById('btn-confirm-reject');
          rejectBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Rebutjant...';
          rejectBtn.disabled = true;
          
          // Llamar al backend para rechazar formalmente
          await listManager.rejectInvitation(token);
          
          // Remover la invitación del panel
          invitation.remove();
          
          // Si no quedan invitaciones, eliminar el contenedor
          if (!document.querySelector('.invitation-item')) {
            const invitationsContainer = document.getElementById('invitations-container');
            if (invitationsContainer) {
              invitationsContainer.remove();
            }
          }
          
          closeModal();
          showNotification('Invitació rebutjada correctament', 'success');
        } catch (error) {
          console.error('Error al rechazar invitación:', error);
          showNotification('Error al rebutjar la invitació', 'error');
        }
      });
    });
  } catch (error) {
    console.error('Error preparando rechazo de invitación:', error);
    showNotification('Error en processar la invitació', 'error');
  }
}



// Abrir detalle de lista
export function openListDetail(listId) {
  currentListId = listId;
  
  // Ocultar lista de listas y mostrar detalle
  headerApp.classList.add('hidden');
  listsContainer.classList.add('hidden');
  listDetailContainer.classList.remove('hidden');
  
  const list = listManager.getListById(listId);
  localStorage.setItem('currentList', JSON.stringify(list));
  if (list) {
    // Actualizar UI con detalles de la lista
    document.getElementById('list-name').textContent = list.name;
    document.getElementById('list-participants').innerHTML = `
      <i class="fas fa-users mr-1"></i>${list.participantCount || 0}
    `;


      // Cargar contadores de mensajes no leídos
      listManager.loadUnreadMessageCountsList(listId);
    

    // Inicializar gestor de ítems para esta lista
    itemManager = new ItemManager(listId);
    
    // Cargar ítems de la lista
    itemManager.loadItems();
    
    // Unirse a la sala WebSocket para esta lista
    import('./utils/websocket.js').then(module => {
      module.joinListRoom(listId);
    });
  }
}


// Cerrar modal
function closeModal() {
  const modalContainer = document.getElementById('modal-container');
  modalContainer.classList.add('hidden');
  modalContainer.innerHTML = '';
}



// Mostrar modal
function showModal(content, setupCallback) {
  const modalContainer = document.getElementById('modal-container');
  modalContainer.innerHTML = `
    <!-- modal-container -->
    <div class="modal-content bg-transparent p-4 max-w-screen-sm w-full flex items-center justify-center">
      ${content}
    </div>
  `;
  modalContainer.classList.remove('hidden');
  
  // Configurar eventos dentro del modal
  if (setupCallback) {
    setupCallback();
  }
}



// Cerrar sesión
function handleLogout() {
  logout();
  redirectToLogin();
}



// Redirigir a la página de login
function redirectToLogin() {
  window.location.href = 'login.html';
}



// Exportar funciones y variables globales necesarias
export {
  showModal,
  closeModal,
  showNotification,
  openChatList
};