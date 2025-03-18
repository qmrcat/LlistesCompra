const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const List = sequelize.define('List', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  activateVoting: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  lastItemAddedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastItemId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
});

module.exports = List;