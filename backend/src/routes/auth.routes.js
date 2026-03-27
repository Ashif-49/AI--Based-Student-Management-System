const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');
const {
  buildAuthUser,
  ensureStudentProfile,
} = require('../utils/authUser');
const { createMailerTransporter } = require('../utils/mailer');

const router = express.Router();
const SELF_REGISTER_ROLES = ['teacher', 'student'];
const APPROVAL_REQUIRED_ROLES = ['teacher', 'student'];

// Generate JWT token
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, studentCode, department, year, semester, phone, address, dateOfBirth, enrollmentDate } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedName = typeof name === 'string' ? name.trim() : '';
    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }
    const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : 'student';
    if (!SELF_REGISTER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role selected.' });
    }
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });
    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashed,
      role: normalizedRole,
      approvalStatus: 'pending',
      approvedBy: null,
      approvedAt: null,
      isActive: true,
    });
    const studentInfo = normalizedRole === 'student'
      ? await ensureStudentProfile(user, { studentCode, department, year, semester, phone, address, dateOfBirth, enrollmentDate })
      : null;
    res.status(201).json({
      success: true,
      pendingApproval: true,
      message: 'Registration submitted. Your account is pending admin approval.',
      user: await buildAuthUser(user, { studentInfo }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || !password) return res.status(400).json({ success: false, message: 'Email and password required.' });
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    const approvalStatus = user.approvalStatus || 'approved';
    if (APPROVAL_REQUIRED_ROLES.includes(user.role) && approvalStatus !== 'approved') {
      if (approvalStatus === 'rejected') {
        return res.status(403).json({
          success: false,
          message: 'Your registration was rejected by an admin. Please contact support or an administrator.',
          approvalStatus,
        });
      }

      return res.status(403).json({
        success: false,
        message: 'Your account is pending admin approval. Please try again after approval.',
        approvalStatus,
      });
    }
    const token = signToken(user.id);
    const studentInfo = user.role === 'student' ? await ensureStudentProfile(user) : null;
    res.json({ success: true, token, user: await buildAuthUser(user, { studentInfo }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/pending-approvals (admin only)
router.get('/pending-approvals', protect, adminOnly, async (req, res) => {
  try {
    const data = await User.findAll({
      where: {
        role: { [Op.in]: APPROVAL_REQUIRED_ROLES },
        approvalStatus: 'pending',
        isActive: true,
      },
      attributes: ['id', 'name', 'email', 'role', 'approvalStatus', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/approve/:userId (admin only)
router.post('/approve/:userId', protect, adminOnly, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!APPROVAL_REQUIRED_ROLES.includes(targetUser.role)) {
      return res.status(400).json({ success: false, message: 'Only student or teacher accounts can be approved here.' });
    }

    if (!targetUser.isActive) {
      return res.status(400).json({ success: false, message: 'Account is deactivated and cannot be approved.' });
    }

    if ((targetUser.approvalStatus || 'approved') !== 'approved') {
      await targetUser.update({
        approvalStatus: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date(),
      });
    }

    const studentInfo = targetUser.role === 'student' ? await ensureStudentProfile(targetUser) : null;
    const normalizedRole = targetUser.role.charAt(0).toUpperCase() + targetUser.role.slice(1);

    res.json({
      success: true,
      message: `${normalizedRole} account approved successfully.`,
      user: await buildAuthUser(targetUser, { studentInfo }),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/reject/:userId (admin only)
router.post('/reject/:userId', protect, adminOnly, async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid user id.' });
    }

    const targetUser = await User.findByPk(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    if (!APPROVAL_REQUIRED_ROLES.includes(targetUser.role)) {
      return res.status(400).json({ success: false, message: 'Only student or teacher accounts can be rejected here.' });
    }

    if (!targetUser.isActive) {
      return res.status(400).json({ success: false, message: 'Account is deactivated and cannot be rejected.' });
    }

    const approvalStatus = targetUser.approvalStatus || 'approved';
    if (approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved accounts cannot be rejected from this page.',
      });
    }

    if (approvalStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'This account is already rejected.',
      });
    }

    await targetUser.update({
      approvalStatus: 'rejected',
      approvedBy: req.user.id,
      approvedAt: new Date(),
    });

    const normalizedRole = targetUser.role.charAt(0).toUpperCase() + targetUser.role.slice(1);

    res.json({
      success: true,
      message: `${normalizedRole} registration rejected.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const normalizedEmail = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'There is no user with that email.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordExpire = new Date(Date.now() + (10 * 60 * 1000));

    await user.update({
      resetPasswordToken: hashedToken,
      resetPasswordExpire,
    });

    const frontendBaseUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
    const resetUrl = `${frontendBaseUrl}/reset-password/${resetToken}`;

    try {
      const { transporter, from } = createMailerTransporter();

      await transporter.sendMail({
        from,
        to: user.email,
        subject: 'Password Reset Request - Flash AI',
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
            <h2 style="margin: 0 0 8px;">Reset your Flash AI password</h2>
            <p style="margin: 0 0 12px;">A password reset was requested for your account.</p>
            <p style="margin: 0 0 12px;">
              Click here to set a new password:
              <a href="${resetUrl}" style="color: #7c3aed;">${resetUrl}</a>
            </p>
            <p style="margin: 0 0 12px;">This link expires in 10 minutes.</p>
            <p style="margin: 0;">If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
        text: `Reset your Flash AI password by opening this link: ${resetUrl}\nThis link expires in 10 minutes.`,
      });

      return res.json({ success: true, message: 'Password reset link sent to your email.' });
    } catch (mailError) {
      await user.update({ resetPasswordToken: null, resetPasswordExpire: null });
      console.error('Failed to send password reset email:', mailError.message);

      if (mailError.code === 'EAUTH') {
        return res.status(500).json({
          success: false,
          message: 'Gmail SMTP authentication failed. Use SMTP_USER and a Gmail App Password in backend/.env.',
        });
      }

      return res.status(500).json({
        success: false,
        message: mailError.message || 'Email could not be sent right now. Please try again later.',
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { [require('sequelize').Op.gt]: new Date() }
      }
    });

    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });

    const newHashedPassword = await bcrypt.hash(password, 12);
    await user.update({
      password: newHashedPassword,
      resetPasswordToken: null,
      resetPasswordExpire: null
    });

    res.json({ success: true, message: 'Password successfully updated. You can now log in.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const studentInfo = req.user.role === 'student' ? await ensureStudentProfile(req.user) : null;
  res.json({ success: true, user: await buildAuthUser(req.user, { studentInfo }) });
});

module.exports = router;
