const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Tabla de relación entre usuarios y listas
const ListUser = sequelize.define('ListUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  listId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('owner', 'editor', 'viewer'),
    allowNull: false,
    defaultValue: 'editor'
  }
});

module.exports = ListUser;