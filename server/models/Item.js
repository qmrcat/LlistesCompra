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
}
);
      

module.exports = Item;


/*

, {
  hooks: {
    afterFind: async (items) => {
      if (!items) return items;
      
      // Si és una sola instància
      if (!Array.isArray(items)) {
        items = [items];
      }
      let upTotal = 0;

      for (const item of items) {
        
        
        // if (item.Votes) {
        //   item.dataValues.upCount = item.Votes.filter(v => v.voteType === 'up').length;
        //   item.dataValues.downCount = item.Votes.filter(v => v.voteType === 'down').length;
        // } else {
          item.dataValues.upCount = 0;
          item.dataValues.downCount = 0;
          item.upTotal = upTotal;
          item.downTotal = upTotal+5;

          upTotal += 1;

          // console.log("🚀 ~ afterFind: ~ item:", item)
        // }
      }
      console.log("🚀 ~ afterFind: ~ items:", items)
      return items;
    }
  }
}

*/