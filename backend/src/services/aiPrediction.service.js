/**
 * AI Prediction Service
 * Statistical rule-based engine that analyzes student data and produces
 * risk scores, risk levels, and actionable recommendations.
 */

const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const { Op } = require('sequelize');

// Compute mark category from percentage
const getMarkCategory = (score) => {
  const normalized = Number(score);
  if (!Number.isFinite(normalized)) return 'Fail';
  if (normalized <= 25) return 'Fail';
  if (normalized <= 70) return 'Average';
  return 'Good';
};

// Backward-compatible export name used in routes/scripts
const getLetterGrade = getMarkCategory;

// Compute attendance risk score (0-100, lower is worse)
const computeAttendanceScore = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length === 0) return 50;
  const total = attendanceRecords.length;
  const present = attendanceRecords.filter(a => a.status === 'present' || a.status === 'excused').length;
  const late = attendanceRecords.filter(a => a.status === 'late').length;
  const effectivePresent = present + (late * 0.5);
  return Math.round((effectivePresent / total) * 100);
};

// Compute academic performance score (0-100)
const computeAcademicScore = (grades) => {
  if (!grades || grades.length === 0) return 50;
  const percentages = grades.map(g => (g.score / g.maxScore) * 100);
  const avg = percentages.reduce((a, b) => a + b, 0) / percentages.length;
  return Math.round(avg);
};

// Compute trend: positive = improving, negative = declining
const computeTrend = (grades) => {
  if (!grades || grades.length < 2) return 0;
  const sorted = [...grades].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.semester - b.semester;
  });
  const percentages = sorted.map(g => (g.score / g.maxScore) * 100);
  const n = percentages.length;
  const firstHalf = percentages.slice(0, Math.floor(n / 2));
  const secondHalf = percentages.slice(Math.floor(n / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  return avgSecond - avgFirst;
};

// Determine risk level based on overall score
const getRiskLevel = (score) => {
  if (score >= 75) return 'low';
  if (score >= 55) return 'moderate';
  if (score >= 35) return 'high';
  return 'critical';
};

// Generate recommendations based on analysis
const generateRecommendations = (attendanceScore, academicScore, trend, riskLevel) => {
  const recs = [];
  if (attendanceScore < 75) {
    recs.push('⚠️ Attendance is critically low. Immediate intervention recommended.');
    recs.push('📋 Schedule a meeting with academic advisor to discuss attendance issues.');
  } else if (attendanceScore < 85) {
    recs.push('📅 Attendance is below the recommended threshold. Encourage regular class attendance.');
  }
  if (academicScore < 60) {
    recs.push('📚 Academic performance is critical. Enroll in tutoring or remedial programs.');
    recs.push('🎯 Create a personalized study plan with specific weekly targets.');
  } else if (academicScore < 75) {
    recs.push('📖 Academic performance needs improvement. Additional study sessions recommended.');
  }
  if (trend < -5) {
    recs.push('📉 Performance is on a downward trend. Identify and address root causes immediately.');
    recs.push('🧑‍🏫 Assign a dedicated mentor to monitor weekly progress.');
  } else if (trend < 0) {
    recs.push('📊 Slight performance decline detected. Monitor closely over the next month.');
  }
  if (riskLevel === 'critical') {
    recs.push('🚨 CRITICAL: Student is at high risk of failure. Immediate support required.');
    recs.push('📞 Notify parents/guardians about current academic status.');
  }
  if (recs.length === 0) {
    recs.push('✅ Student is performing well. Continue encouraging current study habits.');
    recs.push('🏆 Consider advanced courses or extracurricular academic activities.');
  }
  return recs;
};

// Main prediction function
const generatePrediction = async (studentId) => {
  const [grades, attendance] = await Promise.all([
    Grade.findAll({ where: { studentId } }),
    Attendance.findAll({ where: { studentId } }),
  ]);

  const attendanceScore = computeAttendanceScore(attendance);
  const academicScore = computeAcademicScore(grades);
  const trend = computeTrend(grades);

  // Trend score contribution: normalize to 0-100
  const trendScore = Math.min(100, Math.max(0, 50 + trend * 2));

  // Weighted risk score: attendance 35%, academics 45%, trend 20%
  const overallScore = attendanceScore * 0.35 + academicScore * 0.45 + trendScore * 0.20;
  const riskScore = Math.round(overallScore);
  const riskLevel = getRiskLevel(riskScore);
  const recommendations = generateRecommendations(attendanceScore, academicScore, trend, riskLevel);

  const insights = {
    totalGrades: grades.length,
    totalAttendanceDays: attendance.length,
    attendanceRate: attendanceScore,
    avgScore: academicScore,
    performanceTrend: trend >= 0 ? 'improving' : 'declining',
    trendValue: Math.round(trend * 10) / 10,
    gradeDistribution: {
      A: grades.filter(g => (g.score / g.maxScore) * 100 >= 85).length,
      B: grades.filter(g => { const p = (g.score / g.maxScore) * 100; return p >= 70 && p < 85; }).length,
      C: grades.filter(g => { const p = (g.score / g.maxScore) * 100; return p >= 60 && p < 70; }).length,
      F: grades.filter(g => (g.score / g.maxScore) * 100 < 60).length,
    },
  };

  return {
    riskScore,
    riskLevel,
    attendanceScore,
    academicScore,
    trendScore: Math.round(trendScore),
    recommendations,
    insights,
    generatedAt: new Date(),
  };
};

module.exports = { generatePrediction, getLetterGrade, getMarkCategory };
