const nodemailer = require('nodemailer');

const TRUTHY_VALUES = new Set(['1', 'true', 'yes', 'on']);

const parseSecureFlag = (value, defaultValue) => {
  if (typeof value !== 'string' || !value.trim()) {
    return defaultValue;
  }

  return TRUTHY_VALUES.has(value.trim().toLowerCase());
};

const createMailerTransporter = () => {
  const smtpUser = typeof process.env.SMTP_USER === 'string' ? process.env.SMTP_USER.trim() : '';
  const smtpPass = typeof process.env.SMTP_PASS === 'string' ? process.env.SMTP_PASS.trim() : '';

  if (!smtpUser || !smtpPass) {
    throw new Error('SMTP is not configured. Add SMTP_USER and SMTP_PASS in backend/.env (use a Gmail App Password).');
  }

  const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const parsedPort = Number.parseInt(process.env.SMTP_PORT || '465', 10);
  const smtpPort = Number.isNaN(parsedPort) ? 465 : parsedPort;
  const smtpSecure = parseSecureFlag(process.env.SMTP_SECURE, smtpPort === 465);
  const smtpFrom = (process.env.SMTP_FROM || `Flash AI <${smtpUser}>`).trim();

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  return { transporter, from: smtpFrom };
};

module.exports = {
  createMailerTransporter,
};
