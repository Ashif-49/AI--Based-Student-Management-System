const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Prediction = sequelize.define('Prediction', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Students', key: 'id' } },
  riskScore: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
  riskLevel: { type: DataTypes.ENUM('low', 'moderate', 'high', 'critical'), allowNull: false },
  attendanceScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  academicScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  trendScore: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  recommendations: { type: DataTypes.JSON, allowNull: true },
  insights: { type: DataTypes.JSON, allowNull: true },
  generatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { timestamps: true });

module.exports = Prediction;
