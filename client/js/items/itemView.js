// Controlador de vista para los ítems
import { showModal, closeModal, aliasUsuari } from '../app.js';
import { showNotification } from '../ui/notification.js';
import { truncateText } from '../utils/validation.js';

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
    let marginIntemAlias = ''
    if(aliasUsuari === item.addedBy.alias){
      marginIntemAlias = 'bg-green-200 ms-14'
    } else {
      marginIntemAlias = 'bg-blue-200 me-14'
    }



  /*
  
<div class="grid grid-cols-6 grid-rows-5">
    <div >1</div>
    <div class="col-span-3">2</div>
    <div class="col-start-5">4</div>
    <div class="col-start-6">5</div>
    <div class="col-span-5 col-start-2 row-start-2">6</div>
    <div class="col-start-2 row-start-3">7</div>
    <div class="col-span-3 col-start-3 row-start-3">8</div>
    <div class="col-start-6 row-start-3">9</div>
</div>
      
  */


    const itemElement = document.createElement('div');
    itemElement.className = `item-container rounded-lg shadow p-2 ${item.completed ? 'item-completed' : ''} fade-in ${marginIntemAlias}`;
    itemElement.dataset.itemId = item.id;

    // Determinar si el usuario puede editar este ítem
    const canEdit = this.itemManager.canUserEditItem(item);
    
    // Preparar notas (si existen)
    const notesHtml = item.notes ? `
      <div class="edit-notes-text text-sm text-gray-600 p-2 rounded">
      ${truncateText(item.notes, 100)}
      </div>
    ` : '';

      
    // Preparar badge de usuario creador
    const creatorBadge = `
      <div class="flex items-start justify-between">
        <span class="flex items-center text-xs text-gray-500 mt-2">
          <i class="fas fa-user text-primary mr-1"></i>
          ${item.addedBy ? item.addedBy.alias : 'Usuari'}
        </span>
        <button id="btn-send-invite" class="p-2 bg-blue-400 hover:bg-blue-600 text-white rounded shadow transition text-xs">
            <i class="fas fa-paper-plane text-xs"></i>
        </button>
      </div>
    `;

    // Preparar menú de opciones (solo visible si puede editar)
    const menuHtml = canEdit ? `
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
    ` : '';

    const itemQuantity = item.quantity.toFixed(3).replace('.', ',')

    itemElement.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0 mr-3">
          <button class="toggle-completed w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center ${item.completed ? 'bg-primary text-white' : 'bg-white'}">
            ${item.completed ? '<i class="fas fa-check text-gray-600"></i>' : ''}
          </button>
        </div>
        
        <div class="flex-grow">
          <div class="flex items-start justify-between">
            <h3 class="edit-name-text font-medium item-name">${item.name}</h3>
            <div class="flex items-center space-x-2">
              <div class="flex flex-col items-center space-x-1">
                <div class="quantity-control flex items-center">
                  <button class="decrease-quantity quantity-btn w-6 h-6 rounded-full flex items-center justify-center ${item.quantity <= 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-100'}">
                    <i class="fas fa-minus"></i>
                  </button>
                  <span class="quantity quantity-value mx-2 font-medium">${itemQuantity}</span>
                  <button class="increase-quantity quantity-btn w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100">
                    <i class="fas fa-plus"></i>
                  </button>
                </div>
                <div class="flex items-center space-x-2">
                  <h5 class="types-units text-sm">${item.typesUnits}</h5>
                </div>
              </div>
              ${menuHtml}
            </div>

          </div>
          
          ${notesHtml}
          ${creatorBadge}
        </div>
      </div>
    `;
    

    // Añadir eventos para cada elemento
    this.addItemEvents(itemElement, item, canEdit);
    
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
      // Determinar si el usuario puede editar este ítem
      const canEdit = this.itemManager.canUserEditItem(item);
      
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
      itemElement.querySelector('.quantity').textContent = item.quantity.toFixed(3).replace('.', ',');

      //types-units
      itemElement.querySelector('.types-units').textContent = item.typesUnits;

      // Activar/desactivar botón de disminuir
      const decreaseBtn = itemElement.querySelector('.decrease-quantity');
      if (item.quantity <= 0) {
        decreaseBtn.classList.add('text-gray-300', 'cursor-not-allowed');
        decreaseBtn.classList.remove('text-gray-600', 'hover:bg-gray-100');
      } else {
        decreaseBtn.classList.remove('text-gray-300', 'cursor-not-allowed');
        decreaseBtn.classList.add('text-gray-600', 'hover:bg-gray-100');
      }
      
      // Actualizar menú desplegable según permisos
      const dropdownContainer = itemElement.querySelector('.dropdown');
      if (dropdownContainer) {
        if (!canEdit) {
          // Si no puede editar, eliminar el menú
          dropdownContainer.remove();
        }
      } else if (canEdit) {
        // Si puede editar y no existe el menú, añadirlo
        const quantityControl = itemElement.querySelector('.quantity-control');
        if (quantityControl) {
          const menuHtml = `
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
          `;
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = menuHtml;
          const menuElement = tempDiv.firstChild;
          
          quantityControl.parentNode.appendChild(menuElement);
          this.addItemEvents(itemElement, item, canEdit);
        }
      }
      
      // Actualizar notas
      // const existingNotes = itemElement.querySelector('.text-sm.text-gray-600.bg-gray-50');
      const existingNotes = itemElement.querySelector('.edit-notes-text');
      if (item.notes) {
        if (existingNotes) {
          existingNotes.textContent = truncateText(item.notes, 100);
        } else {
          // Crear el elemento de notas si no existe
          const creatorBadge = itemElement.querySelector('edit-notes-text.flex.items-center.text-xs.text-gray-500');
          const notesElement = document.createElement('div');
          // notesElement.className = 'mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded';
          notesElement.className = 'edit-notes-text text-sm text-gray-600 p-2 rounded';
          notesElement.textContent = truncateText(item.notes, 100);
          
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
addItemEvents(itemElement, item, canEdit) {
  // Botón para alternar completado
  const toggleCompletedBtn = itemElement.querySelector('.toggle-completed');
  toggleCompletedBtn.addEventListener('click', () => {
    this.itemManager.toggleItemCompleted(item.id);
  });
  
  
  const editNameText = itemElement.querySelector('.edit-name-text');

  // Botones de cantidad
  const increaseBtn = itemElement.querySelector('.increase-quantity');
  const decreaseBtn = itemElement.querySelector('.decrease-quantity');

  //Qunatitat
  const quantityValue = itemElement.querySelector('.quantity-value');
  
  editNameText.addEventListener('click', () => {
    this.showEditNameText(item);
  });
  
  
  increaseBtn.addEventListener('click', () => {
    this.itemManager.increaseItemQuantity(item.id);
  });
  
  decreaseBtn.addEventListener('click', () => {
    if (item.quantity > 0) {
      this.itemManager.decreaseItemQuantity(item.id);
    }
  });

  quantityValue.addEventListener('click', () => {
    this.showEditQuantityModal(item)
    
  });


  if (item.notes){
    const editNotesText = itemElement.querySelector('div.edit-notes-text');
    console.log("🚀 ~ ItemViewController ~ addItemToView ~ editNotesText:", editNotesText)
    if (editNotesText) {
    editNotesText.addEventListener('click', () => {
      this.showEditNotesModal(item);
    });
    }
  }
  
  // Solo añadir eventos de edición si el usuario tiene permisos
  if (canEdit) {
    // Menú desplegable
    const menuBtn = itemElement.querySelector('.item-menu');
    const dropdownMenu = itemElement.querySelector('.dropdown-menu');
    
    if (menuBtn && dropdownMenu) {
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
      if (editNotesBtn) {
        editNotesBtn.addEventListener('click', () => {
          this.showEditNotesModal(item);
        });
      }
      
      // Botón de eliminar ítem
      const deleteItemBtn = itemElement.querySelector('.delete-item');
      if (deleteItemBtn) {
        deleteItemBtn.addEventListener('click', () => {
          this.showDeleteConfirmationModal(item);
        });
      }
    }
  }
}

  // Mostrar modal para editar cantidad
  showEditQuantityModal(item) {
  

    // const itemQuantity = parseFloat(item.quantity.replace('.', ','));
    const itemQuantity = item.quantity.toFixed(3).replace('.', ',');
    const modalContent = `
         <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Editar quantitat</h2>
        
        <div class="mb-4">
          <label for="item-quantity" class="block text-sm font-medium text-gray-700 mb-1">Quantitat</label>
           <input type="text" 
              id="item-quantity" 
              class="border rounded w-full p-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" 
              value=${itemQuantity}>          
        </div>
        
        <div class="flex justify-end space-x-2">
          <button 
            id="btn-cancel-quantity" 
            class="px-4 py-2 border rounded bg-red-100 text-gray-600 hover:bg-red-300  hover:text-white transition"
          >Cancel·lar</button>
          <button id="btn-save-quantity" class="px-4 py-2 bg-blue-400 hover:bg-blue-600 text-white rounded shadow transition">Desar</button>
        </div>
      </div>
    `;
    showModal(modalContent, () => {
      const itemQuantity = document.getElementById('item-quantity');
      
      document.getElementById('btn-cancel-quantity').addEventListener('click', closeModal);
      document.getElementById('btn-save-quantity').addEventListener('click', () => {
        const quantity = parseFloat(itemQuantity.value.replace(',', '.'));
        // this.itemManager.updateItemNotes(item.id, notes);
        this.itemManager.manualModifyItemQuantity(item.id, quantity);
        item.quantity = quantity;
        closeModal();
      });
      
      // Enfocar el input
      itemQuantity.focus();
      itemQuantity.select();
    });
  }
  
  showEditNameText(item){
    console.log("🚀 ~ ItemViewController ~ showEditNameText ~ item:", item)
    
    const modalContent = `
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h2 class="text-xl font-bold mb-4">Modificar nom</h2>
      
      <div class="mb-4">
        <input type="text" id="edit-item-name" class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6" placeholder="Nom de l'ítem" required=""
        value=${item.name}>  
      </div>
      
      <div class="flex justify-end space-x-2">
        <button 
          id="btn-cancel-notes" 
          class="px-4 py-2 border rounded bg-red-100 text-gray-600 hover:bg-red-300  hover:text-white transition"
        >Cancel·lar</button>
        <button id="btn-save-notes" class="px-4 py-2 bg-blue-400 hover:bg-blue-600 text-white rounded shadow transition">Desar</button>
      </div>
    </div>
    `;
    showModal(modalContent, () => {
      const itemName = document.getElementById('edit-item-name');
      
      document.getElementById('btn-cancel-notes').addEventListener('click', closeModal);
      document.getElementById('btn-save-notes').addEventListener('click', () => {
        const name = itemName.value.trim();
        this.itemManager.updateItemName(item.id, name);
        item.name = name;
        closeModal();
      });
      
      // Enfocar el input
      itemName.focus();
      itemName.select();
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
            class="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
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
          <button 
            id="btn-cancel-notes" 
            class="px-4 py-2 border rounded bg-red-100 text-gray-600 hover:bg-red-300  hover:text-white transition"
          >Cancel·lar</button>
          <button id="btn-save-notes" class="px-4 py-2 bg-blue-400 hover:bg-blue-600 text-white rounded shadow transition">Desar</button>
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
        item.notes = notes;
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