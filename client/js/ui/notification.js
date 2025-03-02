// Componente de notificaciones

let activeNotificationTimeout;

/**
 * Muestra una notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duración en milisegundos (por defecto 3000ms)
 */
export function showNotification(message, type = 'info', duration = 3000) {
  // Cancelar notificación anterior si existe
  if (activeNotificationTimeout) {
    clearTimeout(activeNotificationTimeout);
  }
  
  const notificationElement = document.getElementById('notification');
  if (!notificationElement) return;
  
  // Determinar color según tipo
  let bgColor, textColor, icon;
  
  switch (type) {
    case 'success':
      bgColor = 'bg-green-500';
      textColor = 'text-white';
      icon = 'fas fa-check-circle';
      break;
    case 'error':
      bgColor = 'bg-red-500';
      textColor = 'text-white';
      icon = 'fas fa-exclamation-circle';
      break;
    case 'warning':
      bgColor = 'bg-yellow-500';
      textColor = 'text-white';
      icon = 'fas fa-exclamation-triangle';
      break;
    case 'info':
    default:
      bgColor = 'bg-blue-500';
      textColor = 'text-white';
      icon = 'fas fa-info-circle';
      break;
  }
  
  // Configurar contenido y estilo
  notificationElement.innerHTML = `
    <div class="flex items-center">
      <i class="${icon} mr-2"></i>
      <span>${message}</span>
    </div>
  `;
  
  notificationElement.className = `fixed bottom-4 right-4 p-4 rounded shadow-lg transform transition-transform duration-300 ${bgColor} ${textColor}`;
  
  // Mostrar notificación
  setTimeout(() => {
    notificationElement.classList.add('notification-enter');
    notificationElement.classList.remove('translate-y-20', 'opacity-0');
  }, 10);
  
  // Ocultar después de la duración especificada
  activeNotificationTimeout = setTimeout(() => {
    notificationElement.classList.remove('notification-enter');
    notificationElement.classList.add('notification-exit');
    
    // Ocultar completamente después de la animación
    setTimeout(() => {
      notificationElement.classList.add('translate-y-20', 'opacity-0');
    }, 300);
  }, duration);
}

/**
 * Muestra una notificación de éxito
 * @param {string} message - Mensaje a mostrar
 * @param {number} duration - Duración en milisegundos
 */
export function showSuccessNotification(message, duration = 3000) {
  showNotification(message, 'success', duration);
}

/**
 * Muestra una notificación de error
 * @param {string} message - Mensaje a mostrar
 * @param {number} duration - Duración en milisegundos
 */
export function showErrorNotification(message, duration = 3000) {
  showNotification(message, 'error', duration);
}

/**
 * Muestra una notificación de advertencia
 * @param {string} message - Mensaje a mostrar
 * @param {number} duration - Duración en milisegundos
 */
export function showWarningNotification(message, duration = 3000) {
  showNotification(message, 'warning', duration);
}

/**
 * Muestra una notificación informativa
 * @param {string} message - Mensaje a mostrar
 * @param {number} duration - Duración en milisegundos
 */
export function showInfoNotification(message, duration = 3000) {
  showNotification(message, 'info', duration);
}