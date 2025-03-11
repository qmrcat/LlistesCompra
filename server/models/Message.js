const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  listId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // El ítem al que pertenece el mensaje
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // Usuario que envió el mensaje
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Usuarios que han leído el mensaje (array de IDs)
  readBy: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('readBy');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('readBy', JSON.stringify(value));
    }
  },
  // Usuarios que han leído el mensaje (array de IDs)
  deleteBy: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('deleteBy');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('deleteBy', JSON.stringify(value));
    }
  }
});

module.exports = Message;