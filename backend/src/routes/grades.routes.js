const express = require('express');
const { protect, staffOnly } = require('../middleware/auth');
const Grade = require('../models/Grade');
const Student = require('../models/Student');
const { getMarkCategory } = require('../services/aiPrediction.service');

const router = express.Router();
router.use(protect);

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
};

const normalizeMaxScore = (value, fallback = 100) => {
  if (value === undefined || value === null || value === '') return fallback;
  return toNumber(value);
};

const validateScoreInputs = (score, maxScore) => {
  const normalizedScore = toNumber(score);
  const normalizedMaxScore = normalizeMaxScore(maxScore, 100);

  if (!Number.isFinite(normalizedScore)) {
    return { error: 'Score must be a valid number.' };
  }

  if (!Number.isFinite(normalizedMaxScore)) {
    return { error: 'Max score must be a valid number.' };
  }

  if (normalizedMaxScore <= 0 || normalizedMaxScore > 100) {
    return { error: 'Max score must be greater than 0 and cannot exceed 100.' };
  }

  if (normalizedScore < 0) {
    return { error: 'Score cannot be negative.' };
  }

  if (normalizedScore > normalizedMaxScore) {
    return { error: `Score cannot exceed max score (${normalizedMaxScore}).` };
  }

  return { score: normalizedScore, maxScore: normalizedMaxScore };
};

const recalculateStudentGpa = async (studentId) => {
  const allGrades = await Grade.findAll({ where: { studentId } });
  const avgGPA = allGrades.length
    ? allGrades.reduce((acc, grade) => acc + (grade.score / grade.maxScore) * 4, 0) / allGrades.length
    : 0;

  await Student.update(
    { gpa: Math.min(4.0, Math.round(avgGPA * 100) / 100) },
    { where: { id: studentId } }
  );
};

const canAccessStudent = async (user, studentId) => {
  if (user.role === 'admin' || user.role === 'teacher') return true;
  const ownStudent = await Student.findOne({ where: { userId: user.id } });
  return Boolean(ownStudent && String(ownStudent.id) === String(studentId));
};

// GET /api/grades/:studentId
router.get('/:studentId', async (req, res) => {
  try {
    const allowed = await canAccessStudent(req.user, req.params.studentId);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You can only view your own grades.' });
    }

    const { semester, year } = req.query;
    const where = { studentId: req.params.studentId };
    if (semester) where.semester = semester;
    if (year) where.year = year;

    const grades = await Grade.findAll({ where, order: [['year', 'DESC'], ['semester', 'DESC'], ['createdAt', 'DESC']] });
    const normalizedGrades = grades.map((grade) => {
      const percent = (Number(grade.score) / Number(grade.maxScore)) * 100;
      return {
        ...grade.toJSON(),
        grade: getMarkCategory(percent),
      };
    });
    const totalScores = grades.map((grade) => (grade.score / grade.maxScore) * 100);
    const avg = totalScores.length ? totalScores.reduce((a, b) => a + b, 0) / totalScores.length : 0;
    const totalObtained = grades.reduce((sum, grade) => sum + parseFloat(grade.score), 0);
    const totalPossible = grades.reduce((sum, grade) => sum + parseFloat(grade.maxScore), 0);
    const averageCategory = getMarkCategory(avg);

    res.json({
      success: true,
      data: normalizedGrades,
      summary: {
        total: grades.length,
        totalObtained: Math.round(totalObtained * 100) / 100,
        totalPossible: Math.round(totalPossible * 100) / 100,
        average: Math.round(avg * 10) / 10,
        markCategory: averageCategory,
        letterGrade: averageCategory,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/grades
router.post('/', staffOnly, async (req, res) => {
  try {
    const { studentId, subject, score, maxScore, semester, year, examType, notes } = req.body;
    const validated = validateScoreInputs(score, maxScore);
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    const percent = (validated.score / validated.maxScore) * 100;
    const grade = await Grade.create({
      studentId,
      subject,
      score: validated.score,
      maxScore: validated.maxScore,
      grade: getMarkCategory(percent),
      semester,
      year,
      examType: examType || 'final',
      notes,
    });

    await recalculateStudentGpa(studentId);
    res.status(201).json({ success: true, message: 'Grade added.', data: grade });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/grades/:id
router.put('/:id', staffOnly, async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id);
    if (!grade) return res.status(404).json({ success: false, message: 'Grade not found.' });

    const { score, maxScore, subject, examType, notes, semester, year } = req.body;
    const newScore = score !== undefined ? score : grade.score;
    const newMax = maxScore !== undefined ? maxScore : grade.maxScore;
    const validated = validateScoreInputs(newScore, newMax);
    if (validated.error) {
      return res.status(400).json({ success: false, message: validated.error });
    }

    await grade.update({
      score: validated.score,
      maxScore: validated.maxScore,
      grade: getMarkCategory((validated.score / validated.maxScore) * 100),
      subject: subject || grade.subject,
      examType: examType || grade.examType,
      notes: notes !== undefined ? notes : grade.notes,
      semester: semester || grade.semester,
      year: year || grade.year,
    });

    await recalculateStudentGpa(grade.studentId);
    res.json({ success: true, message: 'Grade updated.', data: grade });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/grades/:id
router.delete('/:id', staffOnly, async (req, res) => {
  try {
    const grade = await Grade.findByPk(req.params.id);
    if (!grade) return res.status(404).json({ success: false, message: 'Grade not found.' });

    const { studentId } = grade;
    await grade.destroy();
    await recalculateStudentGpa(studentId);

    res.json({ success: true, message: 'Grade deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
