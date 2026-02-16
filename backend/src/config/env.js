require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'scrum_board',
    port: process.env.DB_PORT || 3306
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secret',
    expire: process.env.JWT_EXPIRE || '7d'
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000'
};
