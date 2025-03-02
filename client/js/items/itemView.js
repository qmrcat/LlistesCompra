// Controlador de vista para los ítems
import { showModal, closeModal } from '../app.js';
import { showNotification } from '../ui/notification.js';

export class ItemViewController {
  constructor(itemManager) {
    this.itemManager = itemManager;
    this.itemsContainer = document.getElementById('items-container');
  }
  
  // Mostrar indicador de carga
  showLoading() {
    this.itemsContainer.innerHTML = `
      <div class="flex justify-center items-center py-8">
        <div class="loader"></div>
      </div>
    `;
  }
  
  // Mostrar mensaje de error
  showError(message) {
    this.itemsContainer.innerHTML = `
      <div class="text-center py-8 text-red-500">
        <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
        <p>${message}</p>
        <button id="btn-retry-load-items" class="mt-4 px-4 py-2 bg-primary text-white rounded">
          Reintentar
        </button>
      </div>
    `;
    
    document.getElementById('btn-retry-load-items')?.addEventListener('click', () => {
      this.itemManager.loadItems();
    });
  }
  
  // Renderizar todos los ítems
  renderItems(items) {
    if (items.length === 0) {
      this.itemsContainer.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-shopping-basket text-4xl mb-2"></i>
          <p>No hi ha ítems en aquesta llista</p>
          <p class="text-sm mt-2">Afegeix un nou ítem per començar</p>
        </div>
      `;
      return;
    }
    
    this.itemsContainer.innerHTML = '';
    
    // Ordenar ítems: primero no completados, luego por fecha
    const sortedItems = [...items].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    
    sortedItems.forEach(item => {
      this.addItemToView(item, false);
    });
  }
  
  // Añadir un ítem a la vista
  addItemToView(item, prepend = true) {
    // Eliminar mensaje de "no hay ítems" si existe
    if (this.itemsContainer.querySelector('.text-center')) {
      this.itemsContainer.innerHTML = '';
    }
    
    const itemElement = document.createElement('div');
    itemElement.className = `item-container bg-card rounded-lg shadow p-4 ${item.completed ? 'item-completed' : ''} fade-in`;
    itemElement.dataset.itemId = item.id;
    
    // Preparar notas (si existen)
    const notesHtml = item.notes ? `
      <div class="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
        ${item.notes}
      </div>
    ` : '';
    
    // Preparar badge de usuario creador
    const creatorBadge = `
      <span class="flex items-center text-xs text-gray-500 mt-2">
        <i class="fas fa-user text-primary mr-1"></i>
        ${item.addedBy ? item.addedBy.alias : 'Usuari'}
      </span>
    `;
    
    itemElement.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 mr-3">
          <button class="toggle-completed w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center ${item.completed ? 'bg-primary text-white' : 'bg-white'}">
            ${item.completed ? '<i class="fas fa-check"></i>' : ''}
          </button>
        </div>
        
        <div class="flex-grow">
          <div class="flex items-start justify-between">
            <h3 class="font-medium item-name">${item.name}</h3>
            <div class="flex items-center space-x-2">
              <div class="quantity-control flex items-center">
                <button class="decrease-quantity quantity-btn w-6 h-6 rounded-full flex items-center justify-center ${item.quantity <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}">
                  <i class="fas fa-minus"></i>
                </button>
                <span class="quantity mx-2 font-medium">${item.quantity}</span>
                <button class="increase-quantity quantity-btn w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
              <div class="dropdown relative">
                <button class="item-menu w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
                  <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="dropdown-menu hidden absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                  <button class="edit-notes block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <i class="fas fa-edit mr-2"></i>Editar notes
                  </button>
                  <button class="delete-item block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
                    <i class="fas fa-trash-alt mr-2"></i>Eliminar ítem
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          ${notesHtml}
          ${creatorBadge}
        </div>
      </div>
    `;
    
    // Añadir eventos para cada elemento
    this.addItemEvents(itemElement, item);
    
    // Añadir al contenedor (al principio o al final)
    if (prepend && this.itemsContainer.children.length > 0) {
      this.itemsContainer.insertBefore(itemElement, this.itemsContainer.firstChild);
    } else {
      this.itemsContainer.appendChild(itemElement);
    }
  }
  
  // Actualizar un ítem en la vista
  updateItemInView(itemId, item) {
    const itemElement = this.itemsContainer.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
      // Actualizar estado completado
      if (item.completed) {
        itemElement.classList.add('item-completed');
        itemElement.querySelector('.toggle-completed').classList.add('bg-primary', 'text-white');
        itemElement.querySelector('.toggle-completed').innerHTML = '<i class="fas fa-check"></i>';
      } else {
        itemElement.classList.remove('item-completed');
        itemElement.querySelector('.toggle-completed').classList.remove('bg-primary', 'text-white');
        itemElement.querySelector('.toggle-completed').innerHTML = '';
      }
      
      // Actualizar nombre
      itemElement.querySelector('.item-name').textContent = item.name;
      
      // Actualizar cantidad
      itemElement.querySelector('.quantity').textContent = item.quantity;
      
      // Activar/desactivar botón de disminuir
      const decreaseBtn = itemElement.querySelector('.decrease-quantity');
      if (item.quantity <= 1) {
        decreaseBtn.classList.add('text-gray-300', 'cursor-not-allowed');
        decreaseBtn.classList.remove('text-gray-600', 'hover:bg-gray-100');
      } else {
        decreaseBtn.classList.remove('text-gray-300', 'cursor-not-allowed');
        decreaseBtn.classList.add('text-gray-600', 'hover:bg-gray-100');
      }
      
      // Actualizar notas
      const existingNotes = itemElement.querySelector('.text-sm.text-gray-600.bg-gray-50');
      if (item.notes) {
        if (existingNotes) {
          existingNotes.textContent = item.notes;
        } else {
          // Crear el elemento de notas si no existe
          const creatorBadge = itemElement.querySelector('.flex.items-center.text-xs.text-gray-500');
          const notesElement = document.createElement('div');
          notesElement.className = 'mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded';
          notesElement.textContent = item.notes;
          
          // Insertar antes del badge de creador
          if (creatorBadge) {
            creatorBadge.parentNode.insertBefore(notesElement, creatorBadge);
          } else {
            itemElement.querySelector('.flex-grow').appendChild(notesElement);
          }
        }
      } else {
        // Eliminar notas si existen
        if (existingNotes) {
          existingNotes.remove();
        }
      }
      
      // Reordenar si es necesario (completado/no completado)
      this.reorderItems();
    }
  }
  
  // Eliminar un ítem de la vista
  removeItemFromView(itemId) {
    const itemElement = this.itemsContainer.querySelector(`[data-item-id="${itemId}"]`);
    if (itemElement) {
      // Añadir animación de salida
      itemElement.classList.add('opacity-0');
      itemElement.style.transition = 'opacity 0.3s ease';
      
      // Eliminar después de la animación
      setTimeout(() => {
        itemElement.remove();
        
        // Mostrar mensaje si no hay ítems
        if (this.itemsContainer.children.length === 0) {
          this.itemsContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-shopping-basket text-4xl mb-2"></i>
              <p>No hi ha ítems en aquesta llista</p>
              <p class="text-sm mt-2">Afegeix un nou ítem per començar</p>
            </div>
          `;
        }
      }, 300);
    }
  }
  
  // Añadir eventos a un elemento de ítem
  addItemEvents(itemElement, item) {
    // Botón para alternar completado
    const toggleCompletedBtn = itemElement.querySelector('.toggle-completed');
    toggleCompletedBtn.addEventListener('click', () => {
      this.itemManager.toggleItemCompleted(item.id);
    });
    
    // Botones de cantidad
    const increaseBtn = itemElement.querySelector('.increase-quantity');
    const decreaseBtn = itemElement.querySelector('.decrease-quantity');
    
    increaseBtn.addEventListener('click', () => {
      this.itemManager.increaseItemQuantity(item.id);
    });
    
    decreaseBtn.addEventListener('click', () => {
      if (item.quantity > 1) {
        this.itemManager.decreaseItemQuantity(item.id);
      }
    });
    
    // Menú desplegable
    const menuBtn = itemElement.querySelector('.item-menu');
    const dropdownMenu = itemElement.querySelector('.dropdown-menu');
    
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle('hidden');
      
      // Cerrar al hacer clic fuera
      const closeDropdown = () => {
        dropdownMenu.classList.add('hidden');
        document.removeEventListener('click', closeDropdown);
      };
      
      // Añadir listener con pequeño delay para evitar que se cierre inmediatamente
      setTimeout(() => {
        document.addEventListener('click', closeDropdown);
      }, 0);
    });
    
    // Botón de editar notas
    const editNotesBtn = itemElement.querySelector('.edit-notes');
    editNotesBtn.addEventListener('click', () => {
      this.showEditNotesModal(item);
    });
    
    // Botón de eliminar ítem
    const deleteItemBtn = itemElement.querySelector('.delete-item');
    deleteItemBtn.addEventListener('click', () => {
      this.showDeleteConfirmationModal(item);
    });
  }
  
  // Mostrar modal para editar notas
  showEditNotesModal(item) {
    const modalContent = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Editar notes</h2>
        
        <div class="mb-4">
          <label for="item-notes" class="block text-sm font-medium text-gray-700 mb-1">Notes (màx. 240 caràcters)</label>
          <textarea 
            id="item-notes" 
            class="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:ring-blue-200" 
            maxlength="240"
            rows="4"
          >${item.notes || ''}</textarea>
          <div class="flex justify-end mt-1">
            <span id="notes-counter" class="text-xs text-gray-500">
              ${(item.notes || '').length}/240
            </span>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2">
          <button id="btn-cancel-notes" class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 transition">Cancel·lar</button>
          <button id="btn-save-notes" class="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded shadow transition">Desar</button>
        </div>
      </div>
    `;
    
    showModal(modalContent, () => {
      const notesTextarea = document.getElementById('item-notes');
      const notesCounter = document.getElementById('notes-counter');
      
      // Actualizar contador al escribir
      notesTextarea.addEventListener('input', () => {
        notesCounter.textContent = `${notesTextarea.value.length}/240`;
      });
      
      document.getElementById('btn-cancel-notes').addEventListener('click', closeModal);
      document.getElementById('btn-save-notes').addEventListener('click', () => {
        const notes = notesTextarea.value.trim();
        this.itemManager.updateItemNotes(item.id, notes);
        closeModal();
      });
      
      // Enfocar el textarea
      notesTextarea.focus();
    });
  }
  
  // Mostrar modal de confirmación para eliminar ítem
  showDeleteConfirmationModal(item) {
    const modalContent = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Eliminar ítem</h2>
        
        <p class="mb-6">
          Estàs segur que vols eliminar l'ítem <strong>"${item.name}"</strong>?
        </p>
        
        <div class="flex justify-end space-x-2">
          <button id="btn-cancel-delete" class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 transition">Cancel·lar</button>
          <button id="btn-confirm-delete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded shadow transition">Eliminar</button>
        </div>
      </div>
    `;
    
    showModal(modalContent, () => {
      document.getElementById('btn-cancel-delete').addEventListener('click', closeModal);
      document.getElementById('btn-confirm-delete').addEventListener('click', async () => {
        try {
          await this.itemManager.deleteItem(item.id);
          closeModal();
          showNotification('Ítem eliminat correctament', 'success');
        } catch (error) {
          // El error ya se maneja en itemManager
        }
      });
    });
  }
  
  // Reordenar ítems (completados al final)
  reorderItems() {
    const items = Array.from(this.itemsContainer.querySelectorAll('.item-container'));
    if (items.length <= 1) return;
    
    // Ordenar elementos: primero no completados, luego completados
    items.sort((a, b) => {
      const aCompleted = a.classList.contains('item-completed');
      const bCompleted = b.classList.contains('item-completed');
      
      if (aCompleted !== bCompleted) {
        return aCompleted ? 1 : -1;
      }
      
      // Si ambos tienen el mismo estado, mantener el orden actual
      return 0;
    });
    
    // Reinsertar en el orden correcto
    items.forEach(item => {
      this.itemsContainer.appendChild(item);
    });
  }
}