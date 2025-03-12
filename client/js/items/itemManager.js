// Gestor de ítems
import { makeApiRequest } from '../utils/api.js';
import { ItemViewController } from './itemView.js';
import { showNotification } from '../ui/notification.js';
import { getLoggedUser } from '../auth/auth.js';

export class ItemManager {
  constructor(listId) {
    this.listId = listId;
    this.items = [];
    this.viewController = new ItemViewController(this);
  }
  
  // Cargar ítems de una lista
  async loadItems() {
    try {
      // Mostrar indicador de carga
      this.viewController.showLoading();
      
      // Obtener detalle de la lista (incluye ítems)
      const response = await makeApiRequest(`/api/lists/${this.listId}`, 'GET');
      
      // Guardar ítems y renderizar
      this.items = response.list.items || [];
            
      this.viewController.renderItems(this.items);

      // Cargar contadores de mensajes no leídos
      this.loadUnreadMessageCounts();
      
      return this.items;
    } catch (error) {
      console.error(`Error al cargar ítems para la lista ${this.listId}:`, error);
      this.viewController.showError('Error al cargar els ítems');
      throw error;
    }
  }
  
  // Añadir un nuevo ítem
  async addItem(listId, { name, quantity = 1, notes = '', typesUnits = 'unitat' }) {
    try {
      const response = await makeApiRequest(`/api/items/list/${listId}`, 'POST', {
        name,
        quantity,
        notes,
        typesUnits
      });
      
      // Añadir ítem al array local
      const newItem = response.item;
      this.items.push(newItem);
      
      // Actualizar vista
      //this.viewController.addItemToView(newItem);
      
      return newItem;
    } catch (error) {
      console.error(`Error al añadir ítem a la lista ${listId}:`, error);
      showNotification('Error al afegir l\'ítem', 'error');
      throw error;
    }
  }
  
  // Actualizar un ítem existente
  async updateItem(itemId, updates) {
    try {
      const response = await makeApiRequest(`/api/items/${itemId}`, 'PUT', updates);
      
      // Actualizar el ítem en el array local
      const itemIndex = this.items.findIndex(item => item.id === parseInt(itemId));
      if (itemIndex !== -1) {
        this.items[itemIndex] = {
          ...this.items[itemIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      
      // Actualizar vista
      this.viewController.updateItemInView(itemId, this.items[itemIndex]);
      
      return response.item;
    } catch (error) {
      console.error(`Error al actualizar ítem ${itemId}:`, error);
      showNotification('Error al actualitzar l\'ítem', 'error');
      throw error;
    }
  }
  
  // Cargar contadores de mensajes no leídos
  async loadUnreadMessageCounts() {
    try {
      // Importar dinámicamente para evitar dependencias circulares
      const messageService = await import('../utils/messageService.js');
      await messageService.getUnreadMessageCounts(this.listId);
    } catch (error) {
      console.error(`Error al cargar contadores de mensajes para la lista ${this.listId}:`, error);
    }
  }

  // Cambiar el estado completado de un ítem
  async toggleItemCompleted(itemId) {
    const item = this.getItemById(itemId);
    if (item) {
      return await this.updateItem(itemId, { completed: !item.completed });
    }
  }

   // Modificació manual de la quantita de l'ítem
   async manualModifyItemQuantity(itemId, quantity) {
    const item = this.getItemById(itemId);
    if (item) {
      return await this.updateItem(itemId, { quantity: quantity });
    }
  }
  
  // Aumentar cantidad de un ítem
  async increaseItemQuantity(itemId) {
    const item = this.getItemById(itemId);
    if (item) {
      return await this.updateItem(itemId, { quantity: item.quantity + 1 });
    }
  }
  
  // Disminuir cantidad de un ítem
  async decreaseItemQuantity(itemId) {
    const item = this.getItemById(itemId);
    if (item && item.quantity > 1) {
      return await this.updateItem(itemId, { quantity: item.quantity - 1 });
    }
  }
  
  // Actualizar notas de un ítem
  async updateItemNotes(itemId, notes) {
    return await this.updateItem(itemId, { notes });
  }

   // Actualizar nom del item
  async updateItemName(itemId, name) {
    return await this.updateItem(itemId, { name });
  }

  async updateItemTypesUnits(itemId, typesUnits){
    return await this.updateItem(itemId, { typesUnits });
  }
  
  // Eliminar un ítem
  async deleteItem(itemId) {
    try {
      await makeApiRequest(`/api/items/${itemId}`, 'DELETE');
      
      // Eliminar el ítem del array local
      this.items = this.items.filter(item => item.id !== parseInt(itemId));
      
      // Actualizar vista
      this.viewController.removeItemFromView(itemId);
      
      return true;
    } catch (error) {
      console.error(`Error al eliminar ítem ${itemId}:`, error);
      showNotification('Error al eliminar l\'ítem', 'error');
      throw error;
    }
  }
  
  // Obtener un ítem por su ID
  getItemById(itemId) {
    return this.items.find(item => item.id === parseInt(itemId));
  }
  
  // Añadir un ítem recibido por WebSocket
  addWebSocketItem(item) {
    // Comprobar si el ítem ya existe
    const existingIndex = this.items.findIndex(i => i.id === item.id);
    if (existingIndex === -1) {
      this.items.push(item);
      this.viewController.addItemToView(item);
    }
  }
  
  // Actualizar un ítem recibido por WebSocket
  updateWebSocketItem(item) {
    const itemIndex = this.items.findIndex(i => i.id === item.id);
    if (itemIndex !== -1) {
      this.items[itemIndex] = item;
      this.viewController.updateItemInView(item.id, item);
    }
  }
  
  // Eliminar un ítem recibido por WebSocket
  deleteWebSocketItem(itemId) {
    this.items = this.items.filter(item => item.id !== parseInt(itemId));
    this.viewController.removeItemFromView(itemId);
  }
  
  // Comprobar si el usuario actual es el creador del ítem
  isCurrentUserCreator(item) {
    const currentUser = getLoggedUser();
    return currentUser && item.addedBy && item.addedBy.id === currentUser.id;
  }

  // Comprobar si el usuario actual es el creador del ítem
  isCurrentUserCreator(item) {
    const currentUser = getLoggedUser();
    return currentUser && item.addedBy && item.addedBy.id === currentUser.id;
  }
  
  // Comprobar si el usuario puede editar el ítem (es propietario de la lista o creador del ítem)
  canUserEditItem(item) {
    
    const currentUser = getLoggedUser();
    if (!currentUser || !item) return false;
    
    // Verificar si es el creador del ítem
    const isCreator = this.isCurrentUserCreator(item);
    
    // Verificar si es propietario de la lista
    const list = window.listManager?.getListById(this.listId);
    const isOwner = list && list.userRole === 'owner';
    
    return isCreator || isOwner;
  }
}