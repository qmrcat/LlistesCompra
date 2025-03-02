/**
 * Servicio para gestionar el cambio entre bases de datos (SQLite y MySQL)
 */

const { initializeDatabase } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Tipo de base de datos actual
let currentDbType = 'sqlite'; // Por defecto

/**
 * Obtiene el tipo de base de datos actual
 * @returns {string} Tipo de base de datos ('sqlite' o 'mysql')
 */
const getCurrentDbType = () => {
  return currentDbType;
};

/**
 * Cambia la base de datos entre SQLite y MySQL
 * @param {string} dbType - Tipo de base de datos a usar ('sqlite' o 'mysql')
 * @returns {object} Resultado de la operación
 */
const switchDatabase = async (dbType) => {
  try {
    // Validar tipo de base de datos
    if (dbType !== 'sqlite' && dbType !== 'mysql') {
      throw new Error('Tipo de base de datos no válido. Debe ser "sqlite" o "mysql"');
    }
    
    // Si ya estamos usando ese tipo, no hacer nada
    if (dbType === currentDbType) {
      return {
        success: true,
        message: `Ya se está utilizando la base de datos ${dbType}`,
        dbType: currentDbType
      };
    }
    
    // Inicializar la nueva conexión
    const sequelize = initializeDatabase(dbType);
    
    // Probar la conexión
    await sequelize.authenticate();

    // Verificar si las tablas existen
    const tables = await sequelize.getQueryInterface().showAllTables();
    
    // Sincronizar modelos
    // await sequelize.sync({ alter: true });
    if (tables.length === 0) {
        await sequelize.sync({ force: true });
        console.log('Base de datos inicializada con nuevas tablas');
    } else {
        console.log('Se usará la estructura existente de tablas');
     }

    
    // Actualizar el tipo actual
    currentDbType = dbType;
    
    // Si es SQLite, asegurarse de que el archivo existe
    if (dbType === 'sqlite') {
      const dbPath = path.join(__dirname, '../../database.sqlite');
      if (!fs.existsSync(dbPath)) {
        console.log('Archivo SQLite no encontrado, se creará uno nuevo');
      }
    }
    
    // Guardar la preferencia en un archivo de configuración (opcional)
    saveDbPreference(dbType);
    
    return {
      success: true,
      message: `Base de datos cambiada correctamente a ${dbType}`,
      dbType: currentDbType
    };
  } catch (error) {
    console.error('Error al cambiar la base de datos:', error);
    
    // Si hay error, intentar volver al tipo anterior
    if (currentDbType !== dbType) {
      try {
        initializeDatabase(currentDbType);
      } catch (fallbackError) {
        console.error('Error al volver a la base de datos anterior:', fallbackError);
      }
    }
    
    return {
      success: false,
      message: `Error al cambiar a la base de datos ${dbType}: ${error.message}`,
      error: error.message
    };
  }
};

/**
 * Guarda la preferencia de base de datos en un archivo de configuración
 * @param {string} dbType - Tipo de base de datos
 */
const saveDbPreference = (dbType) => {
  try {
    const configPath = path.join(__dirname, '../../db-config.json');
    fs.writeFileSync(configPath, JSON.stringify({ dbType }, null, 2));
  } catch (error) {
    console.error('Error al guardar preferencia de base de datos:', error);
  }
};

/**
 * Carga la preferencia de base de datos desde un archivo de configuración
 * @returns {string} Tipo de base de datos
 */
const loadDbPreference = () => {
  try {
    const configPath = path.join(__dirname, '../../db-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.dbType || 'sqlite';
    }
  } catch (error) {
    console.error('Error al cargar preferencia de base de datos:', error);
  }
  
  return 'sqlite'; // Valor por defecto
};

/**
 * Inicializa el servicio y carga la configuración guardada
 */
const initialize = () => {
  const savedDbType = loadDbPreference();
  if (savedDbType !== currentDbType) {
    // No esperamos aquí la promesa para no bloquear el arranque,
    // pero iniciamos el cambio de base de datos
    switchDatabase(savedDbType).then(result => {
      console.log(result.message);
    }).catch(error => {
      console.error('Error al inicializar la base de datos preferida:', error);
    });
  }
};

// Inicializar al cargar el módulo
initialize();

module.exports = {
  getCurrentDbType,
  switchDatabase
};