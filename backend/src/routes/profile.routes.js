const express = require('express');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const {
  buildAuthUser,
  ensureStaffProfile,
  ensureStudentProfile,
  findStaffProfile,
} = require('../utils/authUser');

const router = express.Router();
router.use(protect);

const MAX_AVATAR_LENGTH = 2_000_000;

const normalizeOptionalText = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text || null;
};

const normalizeAvatar = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (!trimmed.startsWith('data:image/')) {
    throw new Error('Profile photo must be a valid image upload.');
  }
  if (trimmed.length > MAX_AVATAR_LENGTH) {
    throw new Error('Profile photo is too large. Please choose a smaller image.');
  }

  return trimmed;
};

router.get('/', async (req, res) => {
  try {
    const studentInfo = req.user.role === 'student' ? await ensureStudentProfile(req.user) : undefined;
    const staffProfile = req.user.role !== 'student' ? await findStaffProfile(req.user.id) : undefined;

    res.json({
      success: true,
      data: await buildAuthUser(req.user, { studentInfo, staffProfile }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const normalizedName = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const normalizedEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const normalizedPhone = normalizeOptionalText(req.body.phone);
    const normalizedDepartment = normalizeOptionalText(req.body.department);
    const normalizedAvatar = normalizeAvatar(req.body.avatar);

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Full name and email are required.' });
    }

    if (req.body.role && req.body.role !== req.user.role) {
      return res.status(403).json({ success: false, message: 'Role changes are restricted to administrators.' });
    }

    const existingUser = await User.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.id !== req.user.id) {
      return res.status(409).json({ success: false, message: 'Email already registered.' });
    }

    await req.user.update({
      name: normalizedName,
      email: normalizedEmail,
      avatar: normalizedAvatar === undefined ? req.user.avatar : normalizedAvatar,
    });

    let studentInfo;
    let staffProfile;

    if (req.user.role === 'student') {
      studentInfo = await ensureStudentProfile(req.user);
      await studentInfo.update({
        phone: normalizedPhone,
        department: normalizedDepartment || studentInfo.department,
      });
      studentInfo = await studentInfo.reload();
    } else {
      staffProfile = await ensureStaffProfile(req.user.id);
      await staffProfile.update({
        phone: normalizedPhone,
        department: normalizedDepartment,
      });
      staffProfile = await staffProfile.reload();
    }

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      data: await buildAuthUser(req.user, { studentInfo, staffProfile }),
    });
  } catch (err) {
    const status = err.message && err.message.includes('Profile photo') ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
});

router.put('/password', async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
    }

    const freshUser = await User.findByPk(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, freshUser.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await freshUser.update({ password: hashedPassword });

    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
