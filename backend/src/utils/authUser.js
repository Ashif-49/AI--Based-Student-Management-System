const Student = require('../models/Student');
const UserProfile = require('../models/UserProfile');

const DEFAULT_STUDENT_PROFILE = {
  department: 'Computer Science',
  year: 1,
  semester: 1,
};

const buildStudentCode = (userId) => `STU-${new Date().getFullYear()}-${String(userId).padStart(4, '0')}`;

const ensureUniqueStudentCode = async (baseCode) => {
  let candidate = baseCode;
  let suffix = 1;

  while (await Student.findOne({ where: { studentCode: candidate } })) {
    candidate = `${baseCode}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const ensureStudentProfile = async (user, profile = {}) => {
  let student = await Student.findOne({ where: { userId: user.id } });
  if (student) return student;

  const requestedCode = typeof profile.studentCode === 'string' ? profile.studentCode.trim() : '';
  const studentCode = await ensureUniqueStudentCode(requestedCode || buildStudentCode(user.id));

  student = await Student.create({
    userId: user.id,
    studentCode,
    department: profile.department || DEFAULT_STUDENT_PROFILE.department,
    year: profile.year || DEFAULT_STUDENT_PROFILE.year,
    semester: profile.semester || DEFAULT_STUDENT_PROFILE.semester,
    phone: profile.phone,
    address: profile.address,
    dateOfBirth: profile.dateOfBirth,
    enrollmentDate: profile.enrollmentDate || new Date(),
  });

  return student;
};

const findStaffProfile = async (userId) => UserProfile.findOne({ where: { userId } });

const ensureStaffProfile = async (userId) => {
  const [profile] = await UserProfile.findOrCreate({
    where: { userId },
    defaults: { phone: null, department: null },
  });

  return profile;
};

const buildAuthUser = async (user, options = {}) => {
  let studentInfo = options.studentInfo;
  let staffProfile = options.staffProfile;

  if (user.role === 'student') {
    if (studentInfo === undefined) {
      studentInfo = await Student.findOne({ where: { userId: user.id } });
    }
  } else if (staffProfile === undefined) {
    staffProfile = await findStaffProfile(user.id);
  }

  const phone = user.role === 'student' ? studentInfo?.phone || '' : staffProfile?.phone || '';
  const department = user.role === 'student' ? studentInfo?.department || '' : staffProfile?.department || '';

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    approvalStatus: user.approvalStatus || 'approved',
    approvedBy: user.approvedBy || null,
    approvedAt: user.approvedAt || null,
    avatar: user.avatar || null,
    phone,
    department,
    studentInfo: studentInfo || null,
  };
};

module.exports = {
  buildAuthUser,
  buildStudentCode,
  DEFAULT_STUDENT_PROFILE,
  ensureStaffProfile,
  ensureStudentProfile,
  ensureUniqueStudentCode,
  findStaffProfile,
};
