const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import model associations (must be before routes)
require('./models/index');

// Routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/students.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const gradeRoutes = require('./routes/grades.routes');
const predictionRoutes = require('./routes/predictions.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const profileRoutes = require('./routes/profile.routes');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => res.json({ success: true, message: 'AI Student Management API is running 🚀', timestamp: new Date() }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/profile', profileRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found.` }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

module.exports = app;
