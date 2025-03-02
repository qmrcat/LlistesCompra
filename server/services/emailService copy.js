/**
 * Servicio para enviar emails
 * 
 * NOTA: Este es un servicio simulado para fines educativos.
 * En un entorno de producción, utilizaríamos un servicio real como:
 * - Nodemailer para envío directo desde servidor
 * - SendGrid, MailChimp, AWS SES, etc. para servicios de terceros
 */

require('dotenv').config();

// URL base para la aplicación (para generar enlaces)
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

/**
 * Simula el envío de un email de invitación a una lista
 * @param {string} email - Correo electrónico del destinatario
 * @param {string} token - Token de invitación
 * @param {string} inviterName - Nombre de quien invita
 * @param {string} listName - Nombre de la lista
 */
// const sendInvitation = async (email, token, inviterName, listName) => {
//   try {
//     const invitationUrl = `${BASE_URL}/invitation/${token}`;
    
//     // En un entorno real, aquí enviaríamos el email
//     console.log(`
//       ----------------------------------------
//       📧 SIMULACIÓN DE EMAIL DE INVITACIÓN 📧
//       ----------------------------------------
//       Para: ${email}
//       Asunto: ${inviterName} te ha invitado a la lista de compra "${listName}"
      
//       Contenido:
//       Hola,
      
//       ${inviterName} te ha invitado a colaborar en la lista de compra "${listName}" en CompraJunts.
      
//       Para unirte a la lista, haz clic en el siguiente enlace:
//       ${invitationUrl}
      
//       El enlace expirará en 7 días.
      
//       Saludos,
//       El equipo de CompraJunts
//       ----------------------------------------
//     `);
    
//     return true;
//   } catch (error) {
//     console.error('Error en la simulación de envío de email:', error);
//     return false;
//   }
// };

const sendInvitation = async (email, token, inviterName, listName) => {
    try {
      const invitationUrl = `${BASE_URL}/invitation/${token}`;
      
      // En un entorno real, aquí enviaríamos el email
      console.log(`
        ----------------------------------------
        📧 SIMULACIÓN DE EMAIL DE INVITACIÓN 📧
        ----------------------------------------
        Para: ${email}
        Asunto: ${inviterName} te ha invitado a la lista de compra "${listName}"
        
        Contenido:
        Hola,
        
        ${inviterName} te ha invitado a colaborar en la lista de compra "${listName}" en CompraJunts.
        
        Para unirte a la lista, haz clic en el siguiente enlace:
        ${invitationUrl}
        
        O si ya tienes una cuenta, inicia sesión en CompraJunts y podrás ver
        esta invitación en tu panel principal.
        
        El enlace expirará en 7 días.
        
        Saludos,
        El equipo de CompraJunts
        ----------------------------------------
      `);
      
      return true;
    } catch (error) {
      console.error('Error en la simulación de envío de email:', error);
      return false;
    }
  };


/**
 * Simula el envío de un email de bienvenida
 * @param {string} email - Correo electrónico del destinatario
 * @param {string} userName - Nombre o alias del usuario
 */
const sendWelcomeEmail = async (email, userName) => {
  try {
    // En un entorno real, aquí enviaríamos el email
    console.log(`
      ----------------------------------------
      📧 SIMULACIÓN DE EMAIL DE BIENVENIDA 📧
      ----------------------------------------
      Para: ${email}
      Asunto: Bienvenido/a a CompraJunts
      
      Contenido:
      Hola ${userName},
      
      ¡Bienvenido/a a CompraJunts! Ahora puedes crear y compartir listas de compra con tus amigos y familiares.
      
      Para empezar, inicia sesión y crea tu primera lista.
      
      Saludos,
      El equipo de CompraJunts
      ----------------------------------------
    `);
    
    return true;
  } catch (error) {
    console.error('Error en la simulación de envío de email:', error);
    return false;
  }
};

/**
 * Simula el envío de un email de recuperación de contraseña
 * @param {string} email - Correo electrónico del destinatario
 * @param {string} resetToken - Token de restablecimiento
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${BASE_URL}/reset-password/${resetToken}`;
    
    // En un entorno real, aquí enviaríamos el email
    console.log(`
      -----------------------------------------------
      📧 SIMULACIÓN DE EMAIL DE RECUPERACIÓN 📧
      -----------------------------------------------
      Para: ${email}
      Asunto: Recuperación de contraseña - CompraJunts
      
      Contenido:
      Hola,
      
      Has solicitado restablecer tu contraseña en CompraJunts.
      
      Haz clic en el siguiente enlace para establecer una nueva contraseña:
      ${resetUrl}
      
      Este enlace expirará en 1 hora.
      
      Si no has solicitado este cambio, ignora este mensaje.
      
      Saludos,
      El equipo de CompraJunts
      -----------------------------------------------
    `);
    
    return true;
  } catch (error) {
    console.error('Error en la simulación de envío de email:', error);
    return false;
  }
};

module.exports = {
  sendInvitation,
  sendWelcomeEmail,
  sendPasswordResetEmail
};