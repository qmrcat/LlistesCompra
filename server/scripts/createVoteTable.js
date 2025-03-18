/**
 * Script para crear la tabla de mensajes
 * 
 * Ejecutar con: node server/scripts/createMessageTable.js
 */

const { sequelize } = require('../config/database');
const Vote = require('../models/Vote');

async function createVoteTable() {
  try {
    console.log('Intentando crear la tabla de votaciones...');
    
    // Sincronizar solo el modelo Vote
    await Vote.sync({ alter: true });
    
    
    console.log('¡Tabla de votaciones creada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear la tabla de votaciones:', error);
    process.exit(1);
  }
}

createVoteTable();