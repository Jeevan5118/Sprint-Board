const app = require('./src/app');
const config = require('./src/config/env');
const db = require('./src/config/database');

const PORT = config.port;

// Test database connection
db.getConnection()
  .then(connection => {
    console.log('✓ Database connected successfully');
    connection.release();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${config.nodeEnv}`);
    });
  })
  .catch(err => {
    console.error('✗ Database connection failed:', err.message);
    process.exit(1);
  });
