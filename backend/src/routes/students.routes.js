const express = require('express');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { protect, staffOnly } = require('../middleware/auth');
const User = require('../models/User');
const Student = require('../models/Student');
const Prediction = require('../models/Prediction');

const router = express.Router();
router.use(protect);

const USER_ATTRIBUTES = ['id', 'name', 'email', 'avatar'];

const getStudentInclude = (userWhere) => ([
  {
    model: User,
    as: 'user',
    attributes: USER_ATTRIBUTES,
    where: userWhere,
  },
]);

const findOwnStudent = async (userId) => Student.findOne({
  where: { userId },
  include: getStudentInclude(undefined),
});

const isStaff = (user) => user.role === 'admin' || user.role === 'teacher';

// GET /api/students - list students
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'student') {
      const ownStudent = await findOwnStudent(req.user.id);
      return res.json({
        success: true,
        total: ownStudent ? 1 : 0,
        pages: ownStudent ? 1 : 0,
        data: ownStudent ? [ownStudent] : [],
      });
    }

    const { search, department, year, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (department) where.department = department;
    if (year) where.year = year;
    if (status) where.status = status;

    const userWhere = {};
    if (search) {
      userWhere[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }

    const parsedPage = parseInt(page, 10);
    const parsedLimit = parseInt(limit, 10);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows } = await Student.findAndCountAll({
      where,
      include: getStudentInclude(Object.keys(userWhere).length ? userWhere : undefined),
      limit: parsedLimit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({ success: true, total: count, pages: Math.ceil(count / parsedLimit), data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: getStudentInclude(undefined),
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });
    if (!isStaff(req.user) && student.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view your own student profile.' });
    }

    const latestPrediction = await Prediction.findOne({ where: { studentId: student.id }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: { ...student.toJSON(), latestPrediction } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/students - create student + user account
router.post('/', staffOnly, async (req, res) => {
  try {
    const { name, email, password, studentCode, department, year, semester, phone, address, dateOfBirth, enrollmentDate, gender, avatar } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(409).json({ success: false, message: 'Email already exists.' });

    const existingCode = await Student.findOne({ where: { studentCode } });
    if (existingCode) return res.status(409).json({ success: false, message: 'Student code already exists.' });

    const hashed = await bcrypt.hash(password || 'Student@123', 12);
    const user = await User.create({ name, email, password: hashed, role: 'student', avatar });
    const student = await Student.create({
      userId: user.id,
      studentCode,
      department,
      year: year || 1,
      semester: semester || 1,
      phone,
      address,
      gender,
      dateOfBirth,
      enrollmentDate: enrollmentDate || new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully.',
      data: { ...student.toJSON(), user: { id: user.id, name, email } },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', staffOnly, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, { include: [{ model: User, as: 'user' }] });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const { name, email, studentCode, department, year, semester, phone, address, gender, dateOfBirth, status, gpa, avatar } = req.body;

    if (email && email !== student.user.email) {
      const existingUser = await User.findOne({ where: { email, id: { [Op.ne]: student.user.id } } });
      if (existingUser) return res.status(409).json({ success: false, message: 'Email already exists.' });
    }

    if (studentCode && studentCode !== student.studentCode) {
      const existingCode = await Student.findOne({ where: { studentCode, id: { [Op.ne]: student.id } } });
      if (existingCode) return res.status(409).json({ success: false, message: 'Student code already exists.' });
    }

    if (name || email || avatar !== undefined) {
      await student.user.update({
        name: name || student.user.name,
        email: email || student.user.email,
        avatar: avatar !== undefined ? avatar : student.user.avatar,
      });
    }

    await student.update({
      studentCode: studentCode || student.studentCode,
      department: department || student.department,
      year: year || student.year,
      semester: semester || student.semester,
      phone: phone !== undefined ? phone : student.phone,
      address: address !== undefined ? address : student.address,
      gender: gender !== undefined ? gender : student.gender,
      dateOfBirth: dateOfBirth || student.dateOfBirth,
      status: status || student.status,
      gpa: gpa !== undefined ? gpa : student.gpa,
    });

    const refreshed = await Student.findByPk(student.id, { include: getStudentInclude(undefined) });
    res.json({ success: true, message: 'Student updated.', data: refreshed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', staffOnly, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    await User.update({ isActive: false }, { where: { id: student.userId } });
    await student.update({ status: 'inactive' });

    res.json({ success: true, message: 'Student deactivated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
