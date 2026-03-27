const express = require('express');
const { Op } = require('sequelize');
const stringSimilarity = require('string-similarity');
const { protect } = require('../middleware/auth');
const Student = require('../models/Student');
const Prediction = require('../models/Prediction');
const User = require('../models/User');

const router = express.Router();

const INTENT_PATTERNS = {
  at_risk: ['at risk', 'high risk', 'critical risk', 'failing students', 'risk students'],
  student_count: ['how many students', 'student count', 'total students', 'number of students', 'count students'],
  help: ['help', 'what can you do', 'manual', 'guide', 'commands'],
  greeting: ['hi', 'hello', 'hey', 'good morning', 'good evening'],
  identity: ['who are you', 'what is your name', 'your name'],
  approvals_info: ['approval', 'approve user', 'reject user', 'pending approvals', 'registration approval'],
  predictions_info: ['ai prediction', 'prediction', 'risk prediction', 'predict risk'],
  reports_info: ['report', 'reports', 'analytics', 'dashboard report', 'performance trend'],
  thanks: ['thanks', 'thank you', 'thx'],
  goodbye: ['bye', 'goodbye', 'see you', 'see ya'],
  attendance_info: ['attendance', 'present', 'absent', 'late', 'attendance report'],
  grades_info: ['grade', 'grades', 'score', 'scores', 'result', 'marks', 'gpa'],
};

const ADMIN_TEACHER_SUGGESTIONS = [
  'Who are the at-risk students?',
  'How many students are active?',
  'Explain attendance workflow',
  'How do approvals and rejection work?',
  'How can I use reports and dashboard trends?',
];

const STUDENT_SUGGESTIONS = [
  'Show my latest risk level',
  'How can I improve attendance?',
  'How are grades used in AI predictions?',
  'What can I ask you for help with?',
];

const getSuggestionsByRole = (role) => (role === 'student' ? STUDENT_SUGGESTIONS : ADMIN_TEACHER_SUGGESTIONS);

const normalizeMessage = (value = '') => value
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const scorePattern = (message, pattern) => {
  const similarityScore = stringSimilarity.compareTwoStrings(message, pattern);
  const words = pattern.split(' ').filter(Boolean);
  const overlap = words.filter((word) => message.includes(word)).length;
  const overlapScore = words.length ? (overlap / words.length) * 0.8 : 0;
  const containsPattern = message.includes(pattern) ? 1 : 0;
  return Math.max(similarityScore, overlapScore, containsPattern);
};

const detectIntent = (message) => {
  if (/\b(hi|hello|hey|good morning|good evening)\b/.test(message)) return { intent: 'greeting', score: 1 };
  if (/\b(thanks|thank you|thx)\b/.test(message)) return { intent: 'thanks', score: 1 };
  if (/\b(bye|goodbye|see you|see ya)\b/.test(message)) return { intent: 'goodbye', score: 1 };
  if (message.includes('who are you') || message.includes('what is your name') || message.includes('your name')) return { intent: 'identity', score: 1 };
  if (message.includes('approval') || message.includes('approve') || message.includes('reject')) return { intent: 'approvals_info', score: 1 };
  if (message.includes('prediction')) return { intent: 'predictions_info', score: 1 };
  if (message.includes('report') || message.includes('dashboard') || message.includes('analytics')) return { intent: 'reports_info', score: 1 };
  if (message.includes('attendance')) return { intent: 'attendance_info', score: 1 };
  if (message.includes('grade') || message.includes('gpa') || message.includes('marks') || message.includes('score')) return { intent: 'grades_info', score: 1 };
  if (message.includes('help') || message.includes('what can you do') || message.includes('manual') || message.includes('guide')) return { intent: 'help', score: 1 };
  if ((message.includes('how many') || message.includes('count') || message.includes('total') || message.includes('number')) && message.includes('student')) {
    return { intent: 'student_count', score: 1 };
  }
  if ((message.includes('risk') || message.includes('failing') || message.includes('danger')) && (message.includes('student') || message.includes('who'))) {
    return { intent: 'at_risk', score: 1 };
  }

  let bestMatch = { score: 0, intent: 'unknown' };
  Object.entries(INTENT_PATTERNS).forEach(([intent, patterns]) => {
    patterns.forEach((pattern) => {
      const score = scorePattern(message, pattern);
      if (score > bestMatch.score) bestMatch = { score, intent };
    });
  });

  if (bestMatch.score >= 0.45) return bestMatch;
  return { score: bestMatch.score, intent: 'unknown' };
};

const pluralize = (count, noun) => `${count} ${noun}${count === 1 ? '' : 's'}`;

const getLatestAtRiskPredictions = async () => {
  const predictions = await Prediction.findAll({
    where: { riskLevel: { [Op.in]: ['high', 'critical'] } },
    include: [
      {
        model: Student,
        as: 'student',
        include: [{ model: User, as: 'user', attributes: ['name', 'email'] }],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  const latestByStudent = new Map();
  predictions.forEach((prediction) => {
    if (!latestByStudent.has(prediction.studentId)) {
      latestByStudent.set(prediction.studentId, prediction);
    }
  });

  return [...latestByStudent.values()];
};

router.post('/', protect, async (req, res) => {
  try {
    const rawMessage = typeof req.body.message === 'string' ? req.body.message : '';
    const normalizedMessage = normalizeMessage(rawMessage);
    if (!normalizedMessage) {
      return res.status(400).json({ success: false, message: 'Message is required.' });
    }

    const { intent } = detectIntent(normalizedMessage);
    let reply = "I can help with at-risk insights, attendance, grades, approvals, and quick stats. Try one of the suggestions below.";
    let suggestions = getSuggestionsByRole(req.user.role);

    switch (intent) {
      case 'greeting':
        reply = "Hi, welcome back. I am Flash AI, and I am here to help with approvals, student progress, attendance, and quick insights.";
        break;

      case 'identity':
        reply = 'I am Flash AI, your assistant for student management workflows, progress tracking, and day-to-day guidance.';
        break;

      case 'thanks':
        reply = 'You are welcome. If you want, I can suggest the next best action.';
        break;

      case 'goodbye':
        reply = 'Anytime. Come back when you need help and we can continue from here.';
        break;

      case 'at_risk':
        if (req.user.role === 'student') {
          const ownStudent = await Student.findOne({ where: { userId: req.user.id } });
          if (!ownStudent) {
            reply = 'I could not find your student profile yet. Please contact an admin or teacher to link your profile.';
            break;
          }

          const ownPrediction = await Prediction.findOne({
            where: { studentId: ownStudent.id },
            order: [['createdAt', 'DESC']],
          });

          if (!ownPrediction) {
            reply = 'No prediction has been generated for your profile yet. Ask a teacher/admin to generate one in AI Predictions.';
            break;
          }

          reply = `Your latest risk level is ${ownPrediction.riskLevel} with score ${Number(ownPrediction.riskScore || 0).toFixed(1)}. Keep attendance and grades updated for better recommendations.`;
          break;
        }

        {
          const atRisk = await getLatestAtRiskPredictions();
          if (atRisk.length === 0) {
            reply = 'Great news: no students are currently marked as high or critical risk in the latest predictions.';
            break;
          }

          const preview = atRisk.slice(0, 5).map((prediction, index) => {
            const studentName = prediction.student?.user?.name || `Student #${prediction.studentId}`;
            const score = Number(prediction.riskScore || 0).toFixed(1);
            return `${index + 1}. ${studentName} (${prediction.riskLevel} risk, score ${score})`;
          }).join('\n');

          reply = `I found ${pluralize(atRisk.length, 'student')} at high or critical risk.\n${preview}${atRisk.length > 5 ? '\nOpen AI Predictions for the complete list.' : ''}`;
        }
        break;

      case 'student_count':
        if (req.user.role === 'student') {
          reply = 'I can show your profile-level analytics here. Institution-wide student counts are available to teachers and admins.';
          break;
        }

        {
          const totalStudents = await Student.count({ where: { status: 'active' } });
          reply = `There are currently ${totalStudents} active students in the system.`;
        }
        break;

      case 'approvals_info':
        if (req.user.role !== 'admin') {
          reply = 'Approvals can be handled by admins. Teachers and students can still track status after registration.';
          break;
        }

        reply = 'Use the Approvals page to review pending registrations. Click Approve to allow login, or Reject to block access until an admin approves the account later.';
        suggestions = [
          'Show pending approvals',
          'How many students are active?',
          'Who are the at-risk students?',
          'Explain attendance workflow',
        ];
        break;

      case 'predictions_info':
        reply = 'Use AI Predictions to generate and review risk scores. Predictions improve when attendance and grades are current.';
        break;

      case 'reports_info':
        reply = 'Use Dashboard and Reports to track trends, totals, and performance changes. For deeper analysis, combine reports with AI Predictions.';
        break;

      case 'attendance_info':
        reply = 'Use the Attendance section to mark daily status and review summaries. Accurate attendance data directly improves risk predictions.';
        break;

      case 'grades_info':
        reply = 'Use the Grades section to add subject scores and track performance trends. GPA and AI insights are calculated from this data.';
        break;

      case 'help':
        suggestions = getSuggestionsByRole(req.user.role);
        reply = `Here are quick prompts you can use:\n${suggestions.map((item, index) => `${index + 1}) ${item}`).join('\n')}`;
        break;

      default:
        break;
    }

    res.json({ success: true, reply, suggestions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

module.exports = router;
