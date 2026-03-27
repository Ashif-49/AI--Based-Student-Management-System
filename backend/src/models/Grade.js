const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Grade = sequelize.define('Grade', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  studentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'Students', key: 'id' } },
  subject: { type: DataTypes.STRING(100), allowNull: false },
  score: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  maxScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100,
    validate: {
      min: 1,
      max: 100,
    },
  },
  grade: { type: DataTypes.STRING(20), allowNull: true },
  semester: { type: DataTypes.INTEGER, allowNull: false },
  year: { type: DataTypes.INTEGER, allowNull: false },
  examType: { type: DataTypes.ENUM('midterm', 'final', 'quiz', 'assignment', 'project'), defaultValue: 'final' },
  notes: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  validate: {
    scoreWithinMax() {
      const currentScore = Number(this.score);
      const currentMax = Number(this.maxScore);
      if (Number.isFinite(currentScore) && Number.isFinite(currentMax) && currentScore > currentMax) {
        throw new Error('Score cannot exceed max score.');
      }
    },
  },
});

module.exports = Grade;
