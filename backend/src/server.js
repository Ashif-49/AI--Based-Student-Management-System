require('dotenv').config();
const app = require('./app');
const { sequelize } = require('./models/index');

const PORT = process.env.PORT || 5000;
const dbSyncAlterRaw = String(process.env.DB_SYNC_ALTER || '').trim().toLowerCase();
const shouldAlterSchema = dbSyncAlterRaw
  ? dbSyncAlterRaw === 'true'
  : (process.env.NODE_ENV || 'development') !== 'production';

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    await sequelize.sync(shouldAlterSchema ? { alter: true } : {});
    console.log('✅ Database models synchronized.');
    app.listen(PORT, () => {
      console.log(`🚀 AI Student Management Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to database:', error.message);
    console.error('Make sure MySQL is running and the credentials in .env are correct.');
    process.exit(1);
  }
};

startServer();
