const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const authRoutes = require('./modules/auth/routes');
const usersRoutes = require('./modules/users/routes');
const enrollmentRoutes = require('./modules/enrollment/routes');
const catalogRoutes = require('./modules/catalog/routes');
const requestsRoutes = require('./modules/requests/routes');
const allocationRoutes = require('./modules/allocation/routes');
const classroomRoutes = require('./modules/classroom/routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Enginy Backend API' });
});

app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/enrollment', enrollmentRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/allocation', allocationRoutes);
app.use('/api/classroom', classroomRoutes);

module.exports = app;
