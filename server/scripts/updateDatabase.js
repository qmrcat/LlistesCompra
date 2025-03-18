/**
 * Script para actualizar y migrar la base de datos
 * Este script es útil para agregar nuevas tablas o modificar tablas existentes
 * 
 * Ejecutar con: node server/scripts/updateDatabase.js
 */

const { sequelize } = require('../config/database');
const { User, List, Item, ListUser, Invitation, Message, Vote } = require('../models');

async function updateDatabase() {
  try {
    console.log('Iniciando actualización de la base de datos...');
    
    // Obtener tablas existentes
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log('Tablas existentes:', tables);
    
    // Verificar cada tabla y crearla si no existe
    if (!tables.includes('Messages')) {
      console.log('Creando tabla Messages...');
      await Message.sync({ force: true });
      console.log('Tabla Messages creada exitosamente.');
    }
    if (!tables.includes('Vote')) {
      console.log('Creando tabla Vote...');
      await Vote.sync({ force: true });
      console.log('Tabla Vote creada exitosamente.');
    }
    
    // Si necesitas verificar otras tablas:
    // const requiredTables = ['User', 'List', 'Item', 'ListUser', 'Invitations','Message'];
    // for (const table of requiredTables) {
    //   if (!tables.includes(table)) {
    //     console.log(`Tabla ${table} no encontrada. Se recomienda reconstruir toda la base de datos.`);
    //   }
    // }
    
    console.log('Actualización de la base de datos completada.');
    process.exit(0);
  } catch (error) {
    console.error('Error al actualizar la base de datos:', error);
    process.exit(1);
  }
}

updateDatabase();