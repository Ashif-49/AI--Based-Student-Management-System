const express = require('express');
const { protect } = require('../middleware/auth');
const { Op } = require('sequelize');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Prediction = require('../models/Prediction');

const router = express.Router();
router.use(protect);

const getAttendanceRate = (records) => {
  if (!records.length) return 0;
  const effectivePresent = records.reduce((total, record) => {
    if (record.status === 'present' || record.status === 'excused') return total + 1;
    if (record.status === 'late') return total + 0.5;
    return total;
  }, 0);
  return Math.round((effectivePresent / records.length) * 100);
};

const buildTrend = (grades) => {
  const groups = new Map();

  grades.forEach((grade) => {
    const key = `${grade.year}-${grade.semester}`;
    const percentage = (grade.score / grade.maxScore) * 100;
    if (!groups.has(key)) {
      groups.set(key, { year: grade.year, semester: grade.semester, values: [] });
    }
    groups.get(key).values.push(percentage);
  });

  return [...groups.values()]
    .map((group) => ({
      year: group.year,
      semester: group.semester,
      avgScore: Math.round((group.values.reduce((sum, value) => sum + value, 0) / group.values.length) * 10) / 10,
      count: group.values.length,
    }))
    .sort((a, b) => (a.year - b.year) || (a.semester - b.semester));
};

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (!student) {
        return res.json({ success: true, data: { mode: 'student', currentGPA: '0.00', attendanceRate: 0, averageScore: 0, totalSubjects: 0, attendanceStats: [], recentGrades: [] } });
      }

      const [attendance, grades, latestPrediction] = await Promise.all([
        Attendance.findAll({ where: { studentId: student.id }, order: [['date', 'DESC']] }),
        Grade.findAll({ where: { studentId: student.id }, order: [['createdAt', 'DESC']] }),
        Prediction.findOne({ where: { studentId: student.id }, order: [['createdAt', 'DESC']] }),
      ]);

      const averageScore = grades.length
        ? Math.round((grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 100, 0) / grades.length) * 10) / 10
        : 0;

      const attendanceStats = ['present', 'absent', 'late', 'excused'].map((status) => ({
        status,
        count: attendance.filter((record) => record.status === status).length,
      }));

      return res.json({
        success: true,
        data: {
          mode: 'student',
          currentGPA: parseFloat(student.gpa || 0).toFixed(2),
          attendanceRate: getAttendanceRate(attendance),
          averageScore,
          totalSubjects: new Set(grades.map((grade) => grade.subject)).size,
          attendanceStats,
          recentGrades: grades.slice(0, 5),
          latestPrediction,
        },
      });
    }

    const [totalStudents, totalTeachers, totalUsers, atRiskStudents, activeStudents, attendanceRecords, grades, recentStudents, riskDistribution] = await Promise.all([
      Student.count({ where: { status: 'active' } }),
      User.count({ where: { role: 'teacher', isActive: true } }),
      User.count({ where: { isActive: true } }),
      Prediction.count({ where: { riskLevel: { [Op.in]: ['high', 'critical'] } } }),
      Student.findAll({ where: { status: 'active' } }),
      Attendance.findAll(),
      Grade.findAll(),
      Student.findAll({ limit: 5, order: [['createdAt', 'DESC']], include: [{ model: User, as: 'user', attributes: ['name', 'email'] }] }),
      Prediction.findAll({ attributes: ['riskLevel'], raw: true }),
    ]);

    const avgGPA = activeStudents.length
      ? (activeStudents.reduce((sum, student) => sum + parseFloat(student.gpa || 0), 0) / activeStudents.length).toFixed(2)
      : '0.00';

    const departmentsMap = new Map();
    const yearMap = new Map();
    activeStudents.forEach((student) => {
      departmentsMap.set(student.department, (departmentsMap.get(student.department) || 0) + 1);
      yearMap.set(student.year, (yearMap.get(student.year) || 0) + 1);
    });

    const departments = [...departmentsMap.entries()].map(([department, count]) => ({ department, count }));
    const yearDistribution = [...yearMap.entries()]
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => a.year - b.year);

    const attendanceStats = ['present', 'absent', 'late', 'excused'].map((status) => ({
      status,
      count: attendanceRecords.filter((record) => record.status === status).length,
    }));

    const avgAttendanceRate = getAttendanceRate(attendanceRecords);
    const avgScore = grades.length
      ? Math.round((grades.reduce((sum, grade) => sum + (grade.score / grade.maxScore) * 100, 0) / grades.length) * 10) / 10
      : 0;

    const riskMap = new Map();
    riskDistribution.forEach((prediction) => {
      riskMap.set(prediction.riskLevel, (riskMap.get(prediction.riskLevel) || 0) + 1);
    });

    res.json({
      success: true,
      data: {
        mode: 'institution',
        totalStudents,
        totalTeachers,
        totalUsers,
        atRiskStudents,
        avgGPA,
        avgScore,
        avgAttendanceRate,
        departments,
        yearDistribution,
        recentStudents,
        attendanceStats,
        riskDistribution: [...riskMap.entries()].map(([riskLevel, count]) => ({ riskLevel, count })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/dashboard/performance-trend
router.get('/performance-trend', async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const student = await Student.findOne({ where: { userId: req.user.id } });
      if (!student) return res.json({ success: true, data: [] });

      const grades = await Grade.findAll({ where: { studentId: student.id } });
      return res.json({ success: true, data: buildTrend(grades) });
    }

    const grades = await Grade.findAll();
    res.json({ success: true, data: buildTrend(grades) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
