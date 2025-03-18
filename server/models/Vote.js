const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Vote = sequelize.define('Vote', {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  voteType: {
    type: DataTypes.ENUM('up', 'down'),
    allowNull: false,
  },
});

module.exports = Vote;