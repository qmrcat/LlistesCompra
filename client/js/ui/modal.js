// Componente de Modal
export function setupUIComponents() {
    // Configurar eventos para modales
    const modalContainer = document.getElementById('modal-container');
    
    // Cerrar modal al hacer clic fuera
    if (modalContainer) {
      modalContainer.addEventListener('click', (e) => {
        if (e.target === modalContainer) {
          closeModal();
        }
      });
    }
  
    // Añadir manejador de escape para cerrar modales
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    });
  }
  
  // Cerrar modal
  export function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.classList.add('hidden');
      modalContainer.innerHTML = '';
    }
  }
  
  // Mostrar modal
  export function showModal(content, setupCallback) {
    const modalContainer = document.getElementById('modal-container');
    if (modalContainer) {
      modalContainer.innerHTML = `
        <div class="modal-content bg-transparent p-4 max-w-screen-sm w-full">
          ${content}
        </div>
      `;
      modalContainer.classList.remove('hidden');
      
      // Configurar eventos dentro del modal
      if (setupCallback) {
        setupCallback();
      }
    }
  }
  
  // Crear un modal de confirmación
  export function showConfirmationModal(title, message, confirmText, cancelText, onConfirm) {
    const modalContent = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">${title}</h2>
        
        <p class="mb-6">${message}</p>
        
        <div class="flex justify-end space-x-2">
          <button id="btn-modal-cancel" class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 transition">${cancelText || 'Cancel·lar'}</button>
          <button id="btn-modal-confirm" class="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded shadow transition">${confirmText || 'Acceptar'}</button>
        </div>
      </div>
    `;
    
    showModal(modalContent, () => {
      document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
      document.getElementById('btn-modal-confirm').addEventListener('click', () => {
        if (onConfirm) {
          onConfirm();
        }
        closeModal();
      });
    });
  }
  
  // Crear un modal de alerta
  export function showAlertModal(title, message, buttonText, onClose) {
    const modalContent = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">${title}</h2>
        
        <p class="mb-6">${message}</p>
        
        <div class="flex justify-end">
          <button id="btn-modal-ok" class="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded shadow transition">${buttonText || 'Acceptar'}</button>
        </div>
      </div>
    `;
    
    showModal(modalContent, () => {
      document.getElementById('btn-modal-ok').addEventListener('click', () => {
        if (onClose) {
          onClose();
        }
        closeModal();
      });
    });
  }
  
  // Crear un modal con formulario
  export function showFormModal(title, formContent, submitText, cancelText, onSubmit) {
    const modalContent = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">${title}</h2>
        
        <form id="modal-form" class="space-y-4">
          ${formContent}
          
          <div class="flex justify-end space-x-2">
            <button type="button" id="btn-modal-cancel" class="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 transition">${cancelText || 'Cancel·lar'}</button>
            <button type="submit" id="btn-modal-submit" class="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded shadow transition">${submitText || 'Desar'}</button>
          </div>
        </form>
      </div>
    `;
    
    showModal(modalContent, () => {
      document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
      
      document.getElementById('modal-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (onSubmit) {
          // Pasar los valores del formulario como objeto
          const formData = new FormData(e.target);
          const formValues = {};
          
          for (const [key, value] of formData.entries()) {
            formValues[key] = value;
          }
          
          onSubmit(formValues);
        }
      });
    });
  }