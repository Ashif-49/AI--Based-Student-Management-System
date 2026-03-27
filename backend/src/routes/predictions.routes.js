const express = require('express');
const { Op } = require('sequelize');
const { protect, staffOnly } = require('../middleware/auth');
const Prediction = require('../models/Prediction');
const Student = require('../models/Student');
const User = require('../models/User');
const { generatePrediction } = require('../services/aiPrediction.service');

const router = express.Router();
router.use(protect);

const canAccessStudent = async (user, studentId) => {
  if (user.role === 'admin' || user.role === 'teacher') return true;
  const ownStudent = await Student.findOne({ where: { userId: user.id } });
  return Boolean(ownStudent && String(ownStudent.id) === String(studentId));
};

// POST /api/predictions/generate/:studentId
router.post('/generate/:studentId', staffOnly, async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const student = await Student.findByPk(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const result = await generatePrediction(studentId);
    const prediction = await Prediction.create({ studentId, ...result });
    res.status(201).json({ success: true, message: 'Prediction generated.', data: prediction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/predictions/all/at-risk - all at-risk students
router.get('/all/at-risk', staffOnly, async (req, res) => {
  try {
    const atRisk = await Prediction.findAll({
      where: { riskLevel: { [Op.in]: ['high', 'critical', 'moderate'] } },
      include: [{ model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }],
      order: [['riskScore', 'ASC']],
    });
    res.json({ success: true, data: atRisk });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/predictions/:studentId - latest prediction for a student
router.get('/:studentId', async (req, res) => {
  try {
    const allowed = await canAccessStudent(req.user, req.params.studentId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You can only view your own prediction data.' });
    }

    const prediction = await Prediction.findOne({ where: { studentId: req.params.studentId }, order: [['createdAt', 'DESC']] });
    if (!prediction) return res.status(404).json({ success: false, message: 'No prediction found. Generate one first.' });
    res.json({ success: true, data: prediction });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/predictions/:studentId/history
router.get('/:studentId/history', async (req, res) => {
  try {
    const allowed = await canAccessStudent(req.user, req.params.studentId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You can only view your own prediction history.' });
    }

    const history = await Prediction.findAll({ where: { studentId: req.params.studentId }, order: [['createdAt', 'DESC']], limit: 10 });
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
