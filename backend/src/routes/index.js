const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const teamRoutes = require('./teamRoutes');
const projectRoutes = require('./projectRoutes');
const sprintRoutes = require('./sprintRoutes');
const taskRoutes = require('./taskRoutes');
const commentRoutes = require('./commentRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const notificationRoutes = require('./notificationRoutes');
const kanbanRoutes = require('./kanbanRoutes');
const analyticsRoutes = require('./analyticsRoutes');
const timeLogRoutes = require('./timeLogRoutes');
const adminImportRoutes = require('./adminImportRoutes');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
router.use('/auth', authRoutes);

// Team routes (Admin only)
router.use('/teams', teamRoutes);

// Project routes (Team-based access)
router.use('/projects', projectRoutes);

// Sprint routes (Team-based access)
router.use('/sprints', sprintRoutes);

// Task routes (Team-based access)
router.use('/tasks', taskRoutes);

// Comment routes (Team-based access)
router.use('/comments', commentRoutes);

// Dashboard routes (Team-based access)
router.use('/dashboard', dashboardRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Kanban routes (Team-based access + kanban-only projects)
router.use('/kanban', kanbanRoutes);

// Analytics routes (Team-based access + kanban-only projects)
router.use('/analytics', analyticsRoutes);

// Time log routes (Team-based access)
router.use('/', timeLogRoutes);

// Admin CSV import routes
router.use('/admin', adminImportRoutes);

module.exports = router;
