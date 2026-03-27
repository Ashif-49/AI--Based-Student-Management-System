const express = require('express');
const { Op } = require('sequelize');
const { protect, staffOnly } = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');

const router = express.Router();
router.use(protect);

const canAccessStudent = async (user, studentId) => {
  if (user.role === 'admin' || user.role === 'teacher') return true;
  const ownStudent = await Student.findOne({ where: { userId: user.id } });
  return Boolean(ownStudent && String(ownStudent.id) === String(studentId));
};

// GET /api/attendance/:studentId
router.get('/:studentId', async (req, res) => {
  try {
    const allowed = await canAccessStudent(req.user, req.params.studentId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You can only view your own attendance history.' });
    }

    const { month, year } = req.query;
    const where = { studentId: req.params.studentId };
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      where.date = { [Op.between]: [startDate, endDate] };
    }

    const records = await Attendance.findAll({ where, order: [['date', 'DESC']] });
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const excused = records.filter((r) => r.status === 'excused').length;
    const rate = total > 0 ? Math.round(((present + excused + late * 0.5) / total) * 100) : 0;

    res.json({ success: true, data: records, summary: { total, present, absent, late, excused, rate } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance - mark attendance
router.post('/', staffOnly, async (req, res) => {
  try {
    const { studentId, date, status, subject, notes } = req.body;
    const existing = await Attendance.findOne({ where: { studentId, date, subject: subject || null } });
    if (existing) {
      await existing.update({ status, notes });
      return res.json({ success: true, message: 'Attendance updated.', data: existing });
    }

    const record = await Attendance.create({ studentId, date, status, subject, notes });
    res.status(201).json({ success: true, message: 'Attendance marked.', data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/attendance/bulk - mark for all students
router.post('/bulk', staffOnly, async (req, res) => {
  try {
    const { records } = req.body;
    const created = await Attendance.bulkCreate(records, { updateOnDuplicate: ['status', 'notes'] });
    res.status(201).json({ success: true, message: `${created.length} records saved.`, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/summary/all - summary stats for all students
router.get('/summary/all', staffOnly, async (req, res) => {
  try {
    const students = await Student.findAll({
      where: { status: 'active' },
      include: [{ model: User, as: 'user', attributes: ['name'] }],
    });

    const summaries = await Promise.all(students.map(async (student) => {
      const records = await Attendance.findAll({ where: { studentId: student.id } });
      const total = records.length;
      const present = records.filter((record) => record.status === 'present' || record.status === 'excused').length;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;
      return {
        studentId: student.id,
        name: student.user.name,
        studentCode: student.studentCode,
        department: student.department,
        total,
        present,
        rate,
      };
    }));

    res.json({ success: true, data: summaries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
