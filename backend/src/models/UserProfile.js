const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: { model: 'Users', key: 'id' },
  },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  department: { type: DataTypes.STRING(120), allowNull: true },
}, { timestamps: true });

module.exports = UserProfile;
