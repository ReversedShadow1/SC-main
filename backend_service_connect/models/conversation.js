module.exports = (sequelize, DataTypes) => {
    const Conversation = sequelize.define('Conversation', {
      title: DataTypes.STRING,
    });
  
    Conversation.associate = (models) => {
      Conversation.hasMany(models.Message, { foreignKey: 'conversation_id', as: 'messages' });
    };
  
    return Conversation;
  };
  