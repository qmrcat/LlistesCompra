/**
 * Servicio para enviar emails utilizando Nodemailer
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración para Nodemailer (desde variables de entorno)
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || 'tu_correo@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'tu_contraseña_o_app_password';
const EMAIL_FROM = process.env.EMAIL_FROM || 'CompraJunts <notificaciones@comprajunts.com>';
const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

// Modo de prueba (si no hay credenciales, usar ethereal.email para testing)
//const TEST_MODE = !SMTP_USER || SMTP_USER === 'tu_correo@gmail.com';
const TEST_MODE = process.env.TEST_MODE !== 'produccio' ? true : false;

console.log("🚀 ~ TEST_MODE:", TEST_MODE)

// Crear transporte para nodemailer
let transporter;

/**
 * Inicializa el transporte de Nodemailer
 * Se auto-ejecuta al cargar el módulo
 */
const initializeTransporter = async () => {
  try {
    if (TEST_MODE) {
      // Si estamos en modo de prueba, usar ethereal.email (servicio para testing)
      console.log('EmailService: Usando modo de prueba con Ethereal Email');
      const testAccount = await nodemailer.createTestAccount();
      
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      
      console.log('EmailService: Cuenta de prueba creada:', {
        user: testAccount.user,
        pass: testAccount.pass,
        url: 'https://ethereal.email'
      });
    } else {
      // Transporte real para producción
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true para 465, false para otros puertos
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      });
      
      console.log('EmailService: Configurado para envío real');
    }
  } catch (error) {
    console.error('Error al inicializar el servicio de email:', error);
  }
};

initializeTransporter();

/**
 * Envía un email mediante Nodemailer
 * @param {Object} options - Opciones del email
 * @returns {Promise<boolean>} - Éxito o fracaso
 */
const sendEmail = async (options) => {
  try {
    if (!transporter) {
      console.error('EmailService: Transporter no inicializado');
      return false;
    }
    
    // Configuración del mensaje
    const mailOptions = {
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    // Enviar el email
    const info = await transporter.sendMail(mailOptions);
    
    if (TEST_MODE) {
      // En modo prueba, mostrar URL para ver el email
      console.log('EmailService: URL para previsualizar:', nodemailer.getTestMessageUrl(info));
    }
    
    console.log('EmailService: Email enviado, ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('Error al enviar email:', error);
    return false;
  }
};

/**
 * Envía un email de invitación a una lista
 * @param {string} email - Correo electrónico del destinatario
 * @param {string} token - Token de invitación
 * @param {string} inviterName - Nombre de quien invita
 * @param {string} listName - Nombre de la lista
 */
const sendInvitation = async (email, token, inviterName, listName) => {
  try {
    const invitationUrl = `${BASE_URL}/invitation/${token}`;
    
    const emailOptions = {
      to: email,
      subject: `${inviterName} t'ha convidat a la llista de compra "${listName}"`,
      text: `
        Hola,
        
        ${inviterName} t'ha convidat a col·laborar a la llista de compra "${listName}" a CompraJunts.
        
        Per unir-te a la llista, fes clic al següent enllaç:
        ${invitationUrl}
        
        O si ja tens un compte, inicia sessió a CompraJunts i podràs veure
        aquesta invitació al teu panell principal.
        
        L'enllaç caducarà en 7 dies.
        
        Salutacions,
        L'equip de CompraJunts
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2196F3; margin: 0;">CompraJunts</h1>
            <p style="color: #666;">Llistes de compra col·laboratives</p>
          </div>
          
          <p>Hola,</p>
          
          <p><strong>${inviterName}</strong> t'ha convidat a col·laborar a la llista de compra <strong>"${listName}"</strong> a CompraJunts.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Unir-me a la llista</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">O si ja tens un compte, inicia sessió a CompraJunts i podràs veure aquesta invitació al teu panell principal.</p>
          
          <p style="color: #666; font-size: 14px;">L'enllaç caducarà en 7 dies.</p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #666; font-size: 14px; text-align: center;">Salutacions,<br>L'equip de CompraJunts</p>
        </div>
      `
    };
    
    return await sendEmail(emailOptions);
  } catch (error) {
    console.error('Error al enviar email de invitación:', error);
    return false;
  }
};

/**
 * Envía un email de bienvenida
 * @param {string} email - Correo electrónico del destinatario
 * @param {string} userName - Nombre o alias del usuario
 */
const sendWelcomeEmail = async (email, userName) => {
  try {
    const emailOptions = {
      to: email,
      subject: 'Benvingut/da a CompraJunts',
      text: `
        Hola ${userName},
        
        Benvingut/da a CompraJunts! Ara pots crear i compartir llistes de compra amb els teus amics i familiars.
        
        Per començar, inicia sessió i crea la teva primera llista.
        
        Salutacions,
        L'equip de CompraJunts
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2196F3; margin: 0;">CompraJunts</h1>
            <p style="color: #666;">Llistes de compra col·laboratives</p>
          </div>
          
          <p>Hola <strong>${userName}</strong>,</p>
          
          <p>Benvingut/da a CompraJunts! Ara pots crear i compartir llistes de compra amb els teus amics i familiars.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${BASE_URL}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Començar ara</a>
          </div>
          
          <p>Aquestes són algunes de les coses que pots fer:</p>
          
          <ul>
            <li>Crear múltiples llistes de compra</li>
            <li>Convidar altres persones a col·laborar</li>
            <li>Afegir, editar i marcar ítems com a completats</li>
            <li>Accedir a les teves llistes des de qualsevol dispositiu</li>
          </ul>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #666; font-size: 14px; text-align: center;">Salutacions,<br>L'equip de CompraJunts</p>
        </div>
      `
    };
    
    return await sendEmail(emailOptions);
  } catch (error) {
    console.error('Error al enviar email de bienvenida:', error);
    return false;
  }
};

/**
 * Envía un email de recuperación de contraseña
 * @param {string} email - Correo electrónico del destinatario
 * @param {string} resetToken - Token de restablecimiento
 */
const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${BASE_URL}/reset-password/${resetToken}`;
    
    const emailOptions = {
      to: email,
      subject: 'Recuperació de contrasenya - CompraJunts',
      text: `
        Hola,
        
        Has sol·licitat restablir la teva contrasenya a CompraJunts.
        
        Fes clic al següent enllaç per establir una nova contrasenya:
        ${resetUrl}
        
        Aquest enllaç caducarà en 1 hora.
        
        Si no has sol·licitat aquest canvi, ignora aquest missatge.
        
        Salutacions,
        L'equip de CompraJunts
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2196F3; margin: 0;">CompraJunts</h1>
            <p style="color: #666;">Llistes de compra col·laboratives</p>
          </div>
          
          <p>Hola,</p>
          
          <p>Has sol·licitat restablir la teva contrasenya a CompraJunts.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Restablir contrasenya</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Aquest enllaç caducarà en 1 hora.</p>
          
          <p style="color: #666; font-size: 14px;">Si no has sol·licitat aquest canvi, ignora aquest missatge.</p>
          
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          
          <p style="color: #666; font-size: 14px; text-align: center;">Salutacions,<br>L'equip de CompraJunts</p>
        </div>
      `
    };
    
    return await sendEmail(emailOptions);
  } catch (error) {
    console.error('Error al enviar email de recuperación de contraseña:', error);
    return false;
  }
};

module.exports = {
  sendInvitation,
  sendWelcomeEmail,
  sendPasswordResetEmail
};