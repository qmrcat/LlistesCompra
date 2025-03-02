// Cliente API para conectar con el backend
import { getAuthToken, logout } from '../auth/auth.js';

/**
 * Función para realizar peticiones a la API
 * @param {string} endpoint - Ruta de la API
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE)
 * @param {Object} data - Datos a enviar (para POST y PUT)
 * @returns {Promise<any>} - Promesa con la respuesta
 */
export async function makeApiRequest(endpoint, method = 'GET', data = null) {
  try {
    const token = getAuthToken();
    
    // Opciones para fetch
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Añadir token de autenticación si existe
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Añadir cuerpo para POST, PUT
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    // Realizar petición
    const response = await fetch(endpoint, options);
    
    // Convertir respuesta a JSON
    const responseData = await response.json();
    
    // Comprobar si la respuesta es correcta
    if (!response.ok) {
      // Si hay error de autenticación, cerrar sesión
      if (response.status === 401) {
        logout();
        window.location.href = 'login.html';
      }
      
      throw new Error(responseData.message || 'Error en la petición');
    }
    
    return responseData;
  } catch (error) {
    console.error('Error en la petición API:', error);
    throw error;
  }
}

/**
 * Función para realizar peticiones GET
 * @param {string} endpoint - Ruta de la API
 * @returns {Promise<any>} - Promesa con la respuesta
 */
export function get(endpoint) {
  return makeApiRequest(endpoint, 'GET');
}

/**
 * Función para realizar peticiones POST
 * @param {string} endpoint - Ruta de la API
 * @param {Object} data - Datos a enviar
 * @returns {Promise<any>} - Promesa con la respuesta
 */
export function post(endpoint, data) {
  return makeApiRequest(endpoint, 'POST', data);
}

/**
 * Función para realizar peticiones PUT
 * @param {string} endpoint - Ruta de la API
 * @param {Object} data - Datos a enviar
 * @returns {Promise<any>} - Promesa con la respuesta
 */
export function put(endpoint, data) {
  return makeApiRequest(endpoint, 'PUT', data);
}

/**
 * Función para realizar peticiones DELETE
 * @param {string} endpoint - Ruta de la API
 * @returns {Promise<any>} - Promesa con la respuesta
 */
export function del(endpoint) {
  return makeApiRequest(endpoint, 'DELETE');
}