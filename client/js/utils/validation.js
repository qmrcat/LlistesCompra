// Utilidades de validación de formularios

/**
 * Valida un correo electrónico
 * @param {string} email - Correo electrónico a validar
 * @returns {boolean} - Verdadero si es válido
 */
export function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  /**
   * Valida una contraseña (al menos 6 caracteres)
   * @param {string} password - Contraseña a validar
   * @returns {boolean} - Verdadero si es válida
   */
  export function validatePassword(password) {
    return password && password.length >= 6;
  }
  
  /**
   * Valida que dos contraseñas coincidan
   * @param {string} password - Contraseña
   * @param {string} confirmPassword - Confirmación de contraseña
   * @returns {boolean} - Verdadero si coinciden
   */
  export function validatePasswordsMatch(password, confirmPassword) {
    return password === confirmPassword;
  }
  
  /**
   * Valida que un campo no esté vacío
   * @param {string} value - Valor a validar
   * @returns {boolean} - Verdadero si no está vacío
   */
  export function validateRequired(value) {
    return value !== null && value !== undefined && value.trim() !== '';
  }
  
  /**
   * Valida la longitud máxima de un texto
   * @param {string} value - Valor a validar
   * @param {number} maxLength - Longitud máxima permitida
   * @returns {boolean} - Verdadero si no excede la longitud máxima
   */
  export function validateMaxLength(value, maxLength) {
    return value === null || value === undefined || value.length <= maxLength;
  }
  
  /**
   * Valida un número entero positivo
   * @param {number|string} value - Valor a validar
   * @returns {boolean} - Verdadero si es un número entero positivo
   */
  export function validatePositiveInteger(value) {
    const number = parseInt(value);
    return !isNaN(number) && number > 0 && number % 1 === 0;
  }
  
  /**
   * Valida un objeto completo usando un esquema de validación
   * @param {Object} data - Datos a validar
   * @param {Object} schema - Esquema de validación
   * @returns {Object} - Objeto con los errores encontrados
   */
  export function validateForm(data, schema) {
    const errors = {};
    
    for (const field in schema) {
      if (schema.hasOwnProperty(field)) {
        const rules = schema[field];
        const value = data[field];
        
        // Aplicar cada regla de validación
        for (const rule of rules) {
          const [validationFn, errorMessage, ...params] = rule;
          
          // Si no cumple la validación, añadir error
          if (!validationFn(value, ...params)) {
            errors[field] = errorMessage;
            break; // Pasar a la siguiente propiedad
          }
        }
      }
    }
    
    return errors;
  }
  
  // Ejemplo de uso:
  /*
  const schema = {
    email: [
      [validateRequired, 'El correo electrónico es obligatorio'],
      [validateEmail, 'El formato del correo electrónico no es válido']
    ],
    password: [
      [validateRequired, 'La contraseña es obligatoria'],
      [validatePassword, 'La contraseña debe tener al menos 6 caracteres']
    ]
  };
  
  const data = {
    email: 'usuario@ejemplo.com',
    password: '123456'
  };
  
  const errors = validateForm(data, schema);
  */