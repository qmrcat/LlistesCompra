const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Invitation = sequelize.define('Invitation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  listId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  invitedBy: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  accepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Invitation;