// Controlador de vista para las listas
import { openListDetail, openChatList } from '../app.js';
import { showNotification } from '../ui/notification.js';

export class ListViewController {
  constructor(listManager) {
    this.listManager = listManager;
    this.listsGrid = document.getElementById('lists-grid');
}
  


  // Cargar y mostrar las listas
  async loadLists() {
    console.log('Cargando listas...');
    try {
      // Mostrar indicador de carga
      this.listsGrid.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-8">
          <div class="loader"></div>
        </div>
      `;
      
      // Obtener listas
      const lists = await this.listManager.fetchLists();
      
      // Obtener invitaciones pendientes
      const invitations = await this.listManager.fetchPendingInvitations();
      
      // Mostrar invitaciones pendientes si hay
      if (invitations && invitations.length > 0) {
        this.renderInvitationBanner(invitations);
      }
      
      // Mostrar listas o mensaje si no hay
      if (lists.length === 0 && (!invitations || invitations.length === 0)) {
        this.listsGrid.innerHTML = `
          <div class="col-span-full text-center py-8 text-gray-500">
            <i class="fas fa-list-ul text-4xl mb-2"></i>
            <p>No tens cap llista de compra</p>
            <p class="text-sm mt-2">Crea una nova llista per començar</p>
          </div>
        `;
      } else if (lists.length > 0) {
        this.renderLists(lists);
      } else {
        this.listsGrid.innerHTML = '';
      }
    } catch (error) {
      console.error('Error al cargar listas:', error);
      this.listsGrid.innerHTML = `
        <div class="col-span-full text-center py-8 text-red-500">
          <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
          <p>Error al carregar les llistes</p>
          <button id="btn-retry-load" class="mt-4 px-4 py-2 bg-primary text-white rounded">
            Reintentar
          </button>
        </div>
      `;
      
      document.getElementById('btn-retry-load')?.addEventListener('click', () => {
        this.loadLists();
      });
    }
  }

  // Renderizar banner de invitaciones pendientes
  renderInvitationBanner(invitations) {
    // Crear contenedor de invitaciones si no existe
    if (!document.getElementById('invitations-container')) {
      const invitationsContainer = document.createElement('div');
      invitationsContainer.id = 'invitations-container';
      invitationsContainer.className = 'col-span-full mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4';
      
      // Insertar antes del grid de listas
      this.listsGrid.parentNode.insertBefore(invitationsContainer, this.listsGrid);
    }
    
    const invitationsContainer = document.getElementById('invitations-container');
    
    // Renderizar contenido
    invitationsContainer.innerHTML = `
      <h3 class="text-lg font-semibold text-blue-800 mb-2">
        <i class="fas fa-envelope mr-2"></i>
        Invitacions pendents (${invitations.length})
      </h3>
      <div class="space-y-3">
        ${invitations.map(invitation => `
          <div class="bg-white rounded shadow-sm p-3 flex justify-between items-center invitation-item">
            <div>
              <p class="font-medium">${invitation.listName}</p>
              <p class="text-sm text-gray-600">
                Convidat per: ${invitation.invitedBy ? invitation.invitedBy.alias : 'Un usuari'}
              </p>
              <p class="text-xs text-gray-500">
                Expira: ${new Date(invitation.expiresAt).toLocaleDateString('ca-ES')}
              </p>
            </div>
            <div class="flex space-x-2">
              <button 
                class="accept-invitation px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                data-token="${invitation.token}"
              >
                Acceptar
              </button>
              <button 
                class="reject-invitation px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
                data-token="${invitation.token}"
              >
                Rebutjar
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Añadir eventos a los botones
    document.querySelectorAll('.accept-invitation').forEach(button => {
      button.addEventListener('click', async () => {
        const token = button.dataset.token;
        try {
          await this.listManager.acceptInvitation(token);
          // Recargar listas después de aceptar
          await this.loadLists();
          // Mostrar notificación
          showNotification('Invitació acceptada correctament', 'success');
        } catch (error) {
          console.error('Error al aceptar invitación:', error);
          showNotification('Error al acceptar la invitació', 'error');
        }
      });
    });
    
    // document.querySelectorAll('.reject-invitation').forEach(button => {
    //   button.addEventListener('click', () => {
    //     const token = button.dataset.token;
    //     // Eliminar item de invitación
    //     button.closest('.invitation-item').remove();
        
    //     // Si no quedan invitaciones, eliminar el contenedor
    //     if (!document.querySelector('.invitation-item')) {
    //       invitationsContainer.remove();
    //     }
        
    //     // Aquí iría la lógica para rechazar en el backend (no implementada aún)
    //     showNotification('Invitació rebutjada', 'info');
    //   });
    // });

    document.querySelectorAll('.reject-invitation').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const token = button.dataset.token;
        
        try {
          const invitationItem = button.closest('.invitation-item');
          button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
          button.disabled = true;
          
          // Llamar al backend para rechazar formalmente la invitación
          await this.listManager.rejectInvitation(token);
          
          // Eliminar item de invitación visualmente
          invitationItem.remove();
          
          // Si no quedan invitaciones, eliminar el contenedor
          if (!document.querySelector('.invitation-item')) {
            const invitationsContainer = document.getElementById('invitations-container');
            if (invitationsContainer) {
              invitationsContainer.remove();
            }
          }
          
          showNotification('Invitació rebutjada', 'info');
        } catch (error) {
          console.error('Error al rechazar invitación:', error);
          showNotification('Error al rebutjar la invitació', 'error');
          button.innerHTML = '<i class="fas fa-times"></i>';
          button.disabled = false;
        }
      });
    });
  }
  
  // Renderizar listas
  renderLists(lists) {
    console.log('Renderitzan la llistas...');
    this.listsGrid.innerHTML = '';
    
    lists.forEach(list => {
      const card = document.createElement('div');
      card.className = 'bg-slate-100 rounded-lg shadow-md p-4 list-card hover:shadow-lg transition-all';
      card.dataset.listId = list.id;
      
      // Determinar icono según rol
      let roleIcon = '';
      if (list.role === 'owner') {
        roleIcon = '<i class="fas fa-crown text-yellow-500 ml-2"></i>';
      } else if (list.role === 'editor') {
        roleIcon = '<i class="fas fa-edit text-blue-500 ml-2"></i>';
      } else {
        roleIcon = '<i class="fas fa-eye text-gray-500 ml-2"></i>';
      }
      
      // Formatear fecha de creación
      const createdAt = new Date(list.createdAt).toLocaleDateString('ca-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      // Determinar si hay información del último ítem
      let lastItemInfo = 'No hay ítems';
      if (list.lastItemAddedAt) {
        const timeAgo = this.listManager.formatTimeAgo(list.lastItemAddedAt);
        lastItemInfo = `Últim ítem afegit fa ${timeAgo}`;
      }

      const buttonXatList = `
         
          <div class="relative">
            <button class="chat-button-lists-list w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer relative" aria-label="Obrir el xat per aquesta llista" data-microtip-position="bottom-left" data-microtip-size="medium" role="tooltip">
              <i class="fas fa-comments"></i>
              <span class="message-badge-list-list absolute top-0 right-0 w-6 h-6 transform translate-x-1/3 -translate-y-1/3 shadow-md bg-red-500 text-white rounded-full text-sm/6 flex items-center justify-center hidden" 
              data-badge-id="${list.id}"
              ></span>
            </button>
          </div>

      `
      
      card.innerHTML = `
        <div class="flex flex-col">
            <div class="area-click-card cursor-pointer flex flex-col">
              <div class="flex justify-between items-start">
                <h3 class="text-lg font-semibold">
                  ${list.name}
                  ${roleIcon}
                </h3>
                <span class="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  <i class="fas fa-users mr-1"></i>${list.participantCount || 1}
                </span>
                
              </div>
              <p class="text-gray-500 text-sm mt-2">Creada el ${createdAt}</p>
            </div>
            <div class="flex justify-between items-center">
              <div class="area-click-card-info mt-2 pt-1 border-t border-gray-100 text-sm text-gray-600  cursor-pointer">
                ${lastItemInfo}
              </div>
              <div class="mt-2 pt-1 me-3">
                ${buttonXatList}  
              </div>
            </div>
        </div>
      `;
      

      // chat-button-lists-list

      // Añadir evento de clic para abrir la lista
      // card.addEventListener('click', () => {
      //   openListDetail(list.id);
      // });
      
      this.listsGrid.appendChild(card);
      const chatButtonListsList = card.querySelector('.chat-button-lists-list');
      
      const areaClickCard = card.querySelector('.area-click-card');
      const areaClickCardInfo = card.querySelector('.area-click-card-info'); 

      areaClickCard.addEventListener('click', () => {
        openListDetail(list.id);
      });
      areaClickCardInfo.addEventListener('click', () => {
        openListDetail(list.id);
      });

      chatButtonListsList.addEventListener('click', () => {
        console.log('Abrir chat para la lista', list.id);
        openChatList(list.id);

      });
    });
  }
  
  // Actualizar una tarjeta de lista específica
  updateListCard(list) {
    const card = this.listsGrid.querySelector(`[data-list-id="${list.id}"]`);
    if (card) {
      // Actualizar contenido relevante
      const nameElement = card.querySelector('h3');
      const participantsElement = card.querySelector('.bg-blue-100');
      const lastItemElement = card.querySelector('.border-t');
      
      if (nameElement) {
        nameElement.textContent = list.name;
      }
      
      if (participantsElement) {
        participantsElement.innerHTML = `
          <i class="fas fa-users mr-1"></i>${list.participantCount || 1}
        `;
      }
      
      if (lastItemElement && list.lastItemAddedAt) {
        const timeAgo = this.listManager.formatTimeAgo(list.lastItemAddedAt);
        lastItemElement.textContent = `Últim ítem afegit fa ${timeAgo}`;
      }
    }
  }
  
  // Añadir una nueva tarjeta de lista
  addListCard(list) {
    this.loadLists(); // Recargar todas las listas para mantener consistencia
  }
}