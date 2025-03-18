const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Configuración por defecto (SQLite)
let sequelize;

// Función para cambiar entre bases de datos
const initializeDatabase = (dbType = 'sqlite') => {
  // Cerrar conexión previa si existe
  if (sequelize) {
    sequelize.close();
  }

  if (dbType === 'mysql') {
    // Configuración para MySQL
    sequelize = new Sequelize(
      process.env.DB_NAME || 'comprajunts',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        logging: false
      }
    );
  } else {
    // Configuración para SQLite (por defecto)
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../database.sqlite'),
      logging: false,
      dialectOptions: {
        // Activa el suport per a claus foranes
        foreignKeys: true
      }
    });
  }

  return sequelize;
};

// Inicializar con SQLite por defecto
sequelize = initializeDatabase();

// Probar la conexión
const __testConnection = async () => { // VERSIO ANTERIOR
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
};

const testConnection = async () => {
    try {
      await sequelize.authenticate();
      console.log('Conexión a la base de datos establecida correctamente.');
      
      // Verificar si las tablas existen y crearlas si no
      try {
        await sequelize.getQueryInterface().showAllTables()
          .then(tables => {
            if (tables.length === 0) {
              console.log('No se encontraron tablas, se crearán automáticamente.');
              return sequelize.sync({ force: true });
            } else {
              console.log('Tablas existentes:', tables.join(', '));
              return Promise.resolve();
            }
          });
      } catch (syncError) {
        console.error('Error al sincronizar tablas:', syncError);
      }
    } catch (error) {
      console.error('No se pudo conectar a la base de datos:', error);
    }
  };

testConnection();

module.exports = {
  sequelize,
  initializeDatabase
};