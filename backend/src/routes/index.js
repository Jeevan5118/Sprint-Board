const express = require('express');
const router = express.Router();
const authRoutes = require('./authRoutes');
const teamRoutes = require('./teamRoutes');
const projectRoutes = require('./projectRoutes');
const sprintRoutes = require('./sprintRoutes');
const taskRoutes = require('./taskRoutes');
const commentRoutes = require('./commentRoutes');
const dashboardRoutes = require('./dashboardRoutes');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
router.use('/auth', (req, res, next) => { console.log('[Route] HIT: /auth'); next(); }, authRoutes);

// Team routes (Admin only)
router.use('/teams', (req, res, next) => { console.log('[Route] HIT: /teams'); next(); }, teamRoutes);

// Project routes (Team-based access)
router.use('/projects', (req, res, next) => { console.log('[Route] HIT: /projects'); next(); }, projectRoutes);

// Sprint routes (Team-based access)
router.use('/sprints', (req, res, next) => { console.log('[Route] HIT: /sprints'); next(); }, sprintRoutes);

// Task routes (Team-based access)
router.use('/tasks', (req, res, next) => { console.log('[Route] HIT: /tasks'); next(); }, taskRoutes);

// Comment routes (Team-based access)
router.use('/comments', (req, res, next) => { console.log('[Route] HIT: /comments'); next(); }, commentRoutes);

// Dashboard routes (Team-based access)
router.use('/dashboard', (req, res, next) => { console.log('[Route] HIT: /dashboard'); next(); }, dashboardRoutes);

module.exports = router;
