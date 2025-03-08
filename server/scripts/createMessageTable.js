/**
 * Script para crear la tabla de mensajes
 * 
 * Ejecutar con: node server/scripts/createMessageTable.js
 */

const { sequelize } = require('../config/database');
const Message = require('../models/Message');

async function createMessageTable() {
  try {
    console.log('Intentando crear la tabla de mensajes...');
    
    // Sincronizar solo el modelo Message
    await Message.sync({ alter: true });
    
    console.log('¡Tabla de mensajes creada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear la tabla de mensajes:', error);
    process.exit(1);
  }
}

createMessageTable();