const User = require('./User');
const List = require('./List');
const Item = require('./Item');
const ListUser = require('./ListUser');
const Invitation = require('./Invitation');

// Definir relaciones entre modelos
User.belongsToMany(List, { through: ListUser, foreignKey: 'userId' });
List.belongsToMany(User, { through: ListUser, foreignKey: 'listId' });

List.hasMany(Item, { foreignKey: 'listId' });
Item.belongsTo(List, { foreignKey: 'listId' });

User.hasMany(Item, { foreignKey: 'addedBy' });
Item.belongsTo(User, { foreignKey: 'addedBy', as: 'creator' });

User.hasMany(Invitation, { foreignKey: 'invitedBy' });
Invitation.belongsTo(User, { foreignKey: 'invitedBy', as: 'inviter' });

List.hasMany(Invitation, { foreignKey: 'listId' });
Invitation.belongsTo(List, { foreignKey: 'listId' });



module.exports = {
  User,
  List,
  Item,
  ListUser,
  Invitation
};