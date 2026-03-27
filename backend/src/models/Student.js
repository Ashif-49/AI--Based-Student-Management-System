const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Student = sequelize.define('Student', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' } },
  studentCode: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  department: { type: DataTypes.STRING(100), allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  semester: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  gpa: { type: DataTypes.DECIMAL(4, 2), defaultValue: 0.00 },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  gender: { type: DataTypes.ENUM('Male', 'Female', 'Other'), allowNull: true },
  dateOfBirth: { type: DataTypes.DATEONLY, allowNull: true },
  enrollmentDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: { type: DataTypes.ENUM('active', 'inactive', 'graduated', 'suspended'), defaultValue: 'active' },
}, { timestamps: true });

module.exports = Student;
