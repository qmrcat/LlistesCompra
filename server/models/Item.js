const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 1
  },
  completed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  notes: {
    type: DataTypes.STRING(240),
    allowNull: true
  },
  addedBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  listId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  typesUnits: {
    type: DataTypes.STRING(16),
    allowNull: false
  },
});

module.exports = Item;