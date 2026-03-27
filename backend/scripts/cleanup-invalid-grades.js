#!/usr/bin/env node

require('dotenv').config();
const { sequelize, Grade, Student } = require('../src/models');
const { getMarkCategory } = require('../src/services/aiPrediction.service');

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');
const PREVIEW_LIMIT = 10;

if (!DRY_RUN && !APPLY) {
  console.error('Usage: node scripts/cleanup-invalid-grades.js --dry-run | --apply');
  process.exit(1);
}

const roundToTwo = (value) => Math.round(value * 100) / 100;

const normalizeGradeRecord = (grade) => {
  const rawScore = Number(grade.score);
  const rawMax = Number(grade.maxScore);

  let normalizedMax = Number.isFinite(rawMax) ? rawMax : 100;
  normalizedMax = Math.min(Math.max(normalizedMax, 1), 100);
  normalizedMax = roundToTwo(normalizedMax);

  let normalizedScore = Number.isFinite(rawScore) ? rawScore : 0;
  normalizedScore = Math.max(normalizedScore, 0);
  if (normalizedScore > normalizedMax) {
    normalizedScore = normalizedMax;
  }
  normalizedScore = roundToTwo(normalizedScore);

  const percentage = normalizedMax > 0 ? (normalizedScore / normalizedMax) * 100 : 0;
  const normalizedCategory = getMarkCategory(percentage);
  const changed =
    normalizedScore !== Number(grade.score) ||
    normalizedMax !== Number(grade.maxScore);

  return {
    id: grade.id,
    studentId: grade.studentId,
    before: {
      score: Number(grade.score),
      maxScore: Number(grade.maxScore),
      grade: grade.grade,
    },
    after: {
      score: normalizedScore,
      maxScore: normalizedMax,
      grade: normalizedCategory,
    },
    changed,
  };
};

const recalculateStudentGpa = async (studentId, transaction) => {
  const allGrades = await Grade.findAll({
    where: { studentId },
    attributes: ['score', 'maxScore'],
    transaction,
  });

  const avgGPA = allGrades.length
    ? allGrades.reduce((acc, grade) => acc + (Number(grade.score) / Number(grade.maxScore)) * 4, 0) / allGrades.length
    : 0;

  await Student.update(
    { gpa: Math.min(4.0, roundToTwo(avgGPA)) },
    { where: { id: studentId }, transaction }
  );
};

const printPreview = (invalidRecords) => {
  if (invalidRecords.length === 0) {
    console.log('No invalid grade records found.');
    return;
  }

  console.log(`Found ${invalidRecords.length} invalid grade record(s). Preview:`);
  invalidRecords.slice(0, PREVIEW_LIMIT).forEach((record) => {
    console.log(
      `- Grade #${record.id} (student ${record.studentId}): ` +
      `${record.before.score}/${record.before.maxScore} (${record.before.grade || '-'}) -> ` +
      `${record.after.score}/${record.after.maxScore} (${record.after.grade || '-'})`
    );
  });
};

const run = async () => {
  try {
    await sequelize.authenticate();

    const allGrades = await Grade.findAll({
      attributes: ['id', 'studentId', 'score', 'maxScore', 'grade'],
      order: [['id', 'ASC']],
    });

    const normalized = allGrades.map(normalizeGradeRecord);
    const invalidRecords = normalized.filter((record) => record.changed);
    printPreview(invalidRecords);

    if (DRY_RUN) {
      console.log('Dry run complete. No database changes were applied.');
      return;
    }

    if (invalidRecords.length === 0) {
      console.log('Nothing to apply. Database is already valid.');
      return;
    }

    const affectedStudentIds = new Set();

    await sequelize.transaction(async (transaction) => {
      for (const record of invalidRecords) {
        await Grade.update(
          {
            score: record.after.score,
            maxScore: record.after.maxScore,
            grade: record.after.grade,
          },
          {
            where: { id: record.id },
            transaction,
          }
        );
        affectedStudentIds.add(record.studentId);
      }

      for (const studentId of affectedStudentIds) {
        await recalculateStudentGpa(studentId, transaction);
      }
    });

    console.log(
      `Applied cleanup to ${invalidRecords.length} grade record(s) and recalculated GPA for ` +
      `${affectedStudentIds.size} student(s).`
    );
  } catch (error) {
    console.error('Grade cleanup failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

run();
