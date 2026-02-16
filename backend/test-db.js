const db = require('./src/config/database');

console.log('Testing database connection...\n');

db.getConnection()
  .then(connection => {
    console.log('✓ Database connected successfully');
    console.log('✓ Host:', connection.config.host);
    console.log('✓ Database:', connection.config.database);
    console.log('✓ User:', connection.config.user);
    
    // Test query
    return connection.query('SELECT 1 + 1 AS result')
      .then(([rows]) => {
        console.log('✓ Test query successful:', rows[0].result);
        connection.release();
        process.exit(0);
      });
  })
  .catch(err => {
    console.error('✗ Database connection failed:');
    console.error('  Error:', err.message);
    console.error('  Code:', err.code);
    console.error('\nPlease check:');
    console.error('  1. MySQL is running');
    console.error('  2. Database credentials in .env file');
    console.error('  3. Database "scrum_board" exists');
    process.exit(1);
  });
