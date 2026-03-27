// Model Associations Index
const sequelize = require('../config/database');
const User = require('./User');
const UserProfile = require('./UserProfile');
const Student = require('./Student');
const Attendance = require('./Attendance');
const Grade = require('./Grade');
const Prediction = require('./Prediction');

// Associations
User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasOne(Student, { foreignKey: 'userId', as: 'student' });
Student.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Student.hasMany(Attendance, { foreignKey: 'studentId', as: 'attendance' });
Attendance.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Grade, { foreignKey: 'studentId', as: 'grades' });
Grade.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

Student.hasMany(Prediction, { foreignKey: 'studentId', as: 'predictions' });
Prediction.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

module.exports = { sequelize, User, UserProfile, Student, Attendance, Grade, Prediction };
