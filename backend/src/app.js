const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const corsOptions = require('./config/cors');
const errorMiddleware = require('./middlewares/errorMiddleware');
const routes = require('./routes');

const app = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const fs = require('fs');
app.use((req, res, next) => {
  const log = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}\n`;
  fs.appendFileSync('request_log.txt', log);
  next();
});

app.use('/api', (req, res, next) => {
  console.log(`[API] Inbound: ${req.method} ${req.originalUrl}`);
  next();
}, routes);

// 404 Handler
app.use((req, res) => {
  const log = `[404] ${req.method} ${req.originalUrl}\n`;
  fs.appendFileSync('request_log.txt', log);
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error Handler
app.use(errorMiddleware);

module.exports = app;
