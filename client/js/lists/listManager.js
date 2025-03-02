// Gestor de listas
import { makeApiRequest } from '../utils/api.js';

export class ListManager {
  constructor() {
    this.lists = [];
  }
  
  // Obtener todas las listas del usuario
//   async fetchLists() {
//     try {
//       const response = await makeApiRequest('/api/lists', 'GET');
//       this.lists = response.lists || [];
//       return this.lists;
//     } catch (error) {
//       console.error('Error al obtener listas:', error);
//       throw error;
//     }
//   }

  // Obtener todas las listas del usuario
  async fetchLists() {
    try {
      const response = await makeApiRequest('/api/lists', 'GET');
      this.lists = response.lists || [];
      
      // También obtener invitaciones pendientes
      await this.fetchPendingInvitations();
      
      return this.lists;
    } catch (error) {
      console.error('Error al obtener listas:', error);
      throw error;
    }
  }

  // Obtener invitaciones pendientes
  async fetchPendingInvitations() {
    try {
      const response = await makeApiRequest('/api/lists/invitations', 'GET');
      return response.invitations || [];
    } catch (error) {
      console.error('Error al obtener invitaciones pendientes:', error);
      return [];
    }
  }

  
  // Obtener detalle de una lista específica
// Obtener detalle de una lista específica
async fetchListDetail(listId) {
  try {
    console.log(`Obteniendo detalles de la lista ${listId}...`);
    const response = await makeApiRequest(`/api/lists/${listId}`, 'GET');
    
    if (!response.success || !response.list) {
      throw new Error('No se pudo obtener el detalle de la lista');
    }
    
    // Actualizar la lista en el array local
    const listIndex = this.lists.findIndex(list => list.id === parseInt(listId));
    if (listIndex !== -1) {
      this.lists[listIndex] = {
        ...this.lists[listIndex],
        ...response.list
      };
    } else {
      this.lists.push(response.list);
    }
    
    console.log(`Detalles de lista recibidos:`, response.list);
    return response.list;
  } catch (error) {
    console.error(`Error al obtener detalle de lista ${listId}:`, error);
    throw error;
  }
}

  // async __fetchListDetail(listId) {
  //   try {
  //     const response = await makeApiRequest(`/api/lists/${listId}`, 'GET');
      
  //     // Actualizar la lista en el array local
  //     const listIndex = this.lists.findIndex(list => list.id === parseInt(listId));
  //     if (listIndex !== -1) {
  //       this.lists[listIndex] = {
  //         ...this.lists[listIndex],
  //         ...response.list
  //       };
  //     } else {
  //       this.lists.push(response.list);
  //     }
      
  //     return response.list;
  //   } catch (error) {
  //     console.error(`Error al obtener detalle de lista ${listId}:`, error);
  //     throw error;
  //   }
  // }
  
  // Crear una nueva lista
  async createList(name) {
    try {
      const response = await makeApiRequest('/api/lists', 'POST', { name });
      this.lists.push(response.list);
      return response.list;
    } catch (error) {
      console.error('Error al crear lista:', error);
      throw error;
    }
  }
  
  // Invitar a un usuario a una lista
  async inviteUserToList(listId, email) {
    try {
      const response = await makeApiRequest(`/api/lists/${listId}/invite`, 'POST', { email });
      return response;
    } catch (error) {
      console.error(`Error al invitar usuario a lista ${listId}:`, error);
      throw error;
    }
  }
  
  // Aceptar una invitación
  async acceptInvitation(token) {
    try {
      const response = await makeApiRequest(`/api/lists/invitation/${token}`, 'GET');
      return response;
    } catch (error) {
      console.error('Error al aceptar invitación:', error);
      throw error;
    }
  }
  
  // Actualizar una lista
  async updateList(listId, data) {
    try {
      const response = await makeApiRequest(`/api/lists/${listId}`, 'PUT', data);
      
      // Actualizar la lista en el array local
      const listIndex = this.lists.findIndex(list => list.id === parseInt(listId));
      if (listIndex !== -1) {
        this.lists[listIndex] = {
          ...this.lists[listIndex],
          ...data
        };
      }
      
      return response;
    } catch (error) {
      console.error(`Error al actualizar lista ${listId}:`, error);
      throw error;
    }
  }

    // Cancelar una invitación
    async cancelInvitation(invitationId) {
      try {
        const response = await makeApiRequest(`/api/lists/invitation/${invitationId}`, 'DELETE');
        return response;
      } catch (error) {
        console.error(`Error al cancelar invitación ${invitationId}:`, error);
        throw error;
      }
    }
    
    // Reenviar una invitación
    async resendInvitation(invitationId) {
      try {
        const response = await makeApiRequest(`/api/lists/invitation/${invitationId}/resend`, 'POST');
        return response;
      } catch (error) {
        console.error(`Error al reenviar invitación ${invitationId}:`, error);
        throw error;
      }
    }

   // Abandonar una lista
   async leaveList(listId) {
    try {
      const response = await makeApiRequest(`/api/lists/${listId}/leave`, 'POST');
      
      // Eliminar la lista del array local si la respuesta es exitosa
      if (response.success) {
        this.lists = this.lists.filter(list => list.id !== parseInt(listId));
      }
      
      return response;
    } catch (error) {
      console.error(`Error al abandonar la lista ${listId}:`, error);
      throw error;
    }
  }

    // Rechazar una invitación
    async rejectInvitation(invitationId) {
      try {
        const response = await makeApiRequest(`/api/lists/invitation/${invitationId}/reject`, 'POST');
        return response;
      } catch (error) {
        console.error(`Error al rechazar invitación ${invitationId}:`, error);
        throw error;
      }
    }
  
  // Obtener una lista por su ID
  getListById(listId) {
    console.log("🚀 ~ ListManager ~ getListById ~ this.lists:", this.lists)
    
    return this.lists.find(list => list.id === parseInt(listId));
  }
  
  // Actualizar lista en memoria
  updateListInMemory(listId, data) {
    const listIndex = this.lists.findIndex(list => list.id === parseInt(listId));
    if (listIndex !== -1) {
      this.lists[listIndex] = {
        ...this.lists[listIndex],
        ...data
      };
    }
  }
  
  // Formatear fecha
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
  
  // Formatear tiempo transcurrido
  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return `${diffDay} ${diffDay === 1 ? 'dia' : 'dies'}`;
    }
    if (diffHour > 0) {
      return `${diffHour} ${diffHour === 1 ? 'hora' : 'hores'}`;
    }
    if (diffMin > 0) {
      return `${diffMin} ${diffMin === 1 ? 'minut' : 'minuts'}`;
    }
    return 'ara mateix';
  }
}