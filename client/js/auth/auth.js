// Módulo de autenticación
import { makeApiRequest } from '../utils/api.js';
import { showNotification } from '../ui/notification.js';
import { validateEmail, validatePassword } from '../utils/validation.js';

// Elementos del DOM para la pantalla de login/registro
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const loginTogglePassword = document.getElementById('login-toggle-password');
const registerTogglePassword = document.getElementById('register-toggle-password');
const registerToggleConfirmPassword = document.getElementById('register-toggle-confirm-password');

// Inicializar eventos para pantalla de autenticación
function init() {
  // Configurar pestañas
  loginTab?.addEventListener('click', () => switchTab('login'));
  registerTab?.addEventListener('click', () => switchTab('register'));
  
  // Configurar mostrar/ocultar contraseñas
  loginTogglePassword?.addEventListener('click', () => togglePasswordVisibility('login-password', loginTogglePassword));
  registerTogglePassword?.addEventListener('click', () => togglePasswordVisibility('register-password', registerTogglePassword));
  registerToggleConfirmPassword?.addEventListener('click', () => togglePasswordVisibility('register-confirm-password', registerToggleConfirmPassword));
  
  // Configurar formularios
  loginForm?.addEventListener('submit', handleLogin);
  registerForm?.addEventListener('submit', handleRegister);
}

// Cambiar entre pestañas de login/registro
function switchTab(tab) {
  if (tab === 'login') {
    loginTab.classList.add('text-primary', 'border-primary', 'border-b-2');
    loginTab.classList.remove('text-gray-500');
    registerTab.classList.add('text-gray-500');
    registerTab.classList.remove('text-primary', 'border-primary', 'border-b-2');
    
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  } else {
    registerTab.classList.add('text-primary', 'border-primary', 'border-b-2');
    registerTab.classList.remove('text-gray-500');
    loginTab.classList.add('text-gray-500');
    loginTab.classList.remove('text-primary', 'border-primary', 'border-b-2');
    
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  }
}

// Alternar visibilidad de contraseña
function togglePasswordVisibility(inputId, toggleButton) {
  const passwordInput = document.getElementById(inputId);
  const icon = toggleButton.querySelector('i');
  
  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    passwordInput.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

// Manejar inicio de sesión
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  
  // Validar datos
  if (!validateEmail(email)) {
    showNotification('Correu electrònic invàlid', 'error');
    return;
  }
  
  try {
    const response = await makeApiRequest('/api/auth/login', 'POST', {
      email,
      password
    });
    
    // Guardar información de autenticación
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redirigir a la página principal
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    showNotification(error.message || 'Error al iniciar sesión', 'error');
  }
}

// Manejar registro de usuario
async function handleRegister(e) {
  e.preventDefault();
  
  const email = document.getElementById('register-email').value;
  const alias = document.getElementById('register-alias').value;
  const password = document.getElementById('register-password').value;
  const confirmPassword = document.getElementById('register-confirm-password').value;
  
  // Validar datos
  if (!validateEmail(email)) {
    showNotification('Correu electrònic invàlid', 'error');
    return;
  }
  
  if (!alias || alias.trim() === '') {
    showNotification('L\'àlies no pot estar buit', 'error');
    return;
  }
  
  if (!validatePassword(password)) {
    showNotification('La contrasenya ha de tenir almenys 6 caràcters', 'error');
    return;
  }
  
  if (password !== confirmPassword) {
    showNotification('Les contrasenyes no coincideixen', 'error');
    return;
  }
  
  try {
    const response = await makeApiRequest('/api/auth/register', 'POST', {
      email,
      alias,
      password
    });
    
    // Guardar información de autenticación
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redirigir a la página principal
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    showNotification(error.message || 'Error al registrar usuario', 'error');
  }
}

// Comprobar si el usuario está autenticado
export function isAuthenticated() {
  return getAuthToken() !== null;
}

// Obtener token de autenticación
export function getAuthToken() {
  return localStorage.getItem('token');
}

// Obtener información del usuario actual
export function getLoggedUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

// Cerrar sesión
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// Inicializar el módulo si estamos en la página de autenticación
if (document.getElementById('login-tab')) {
  init();
}