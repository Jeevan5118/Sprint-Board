# Scrum Board Backend

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

### 3. Setup Database
Run the SQL files in order:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seeds.sql
```

### 4. Start Server
Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

### 5. Test API
Visit: http://localhost:5000/api/health

## Project Structure
```
backend/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middlewares/    # Custom middlewares
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── validators/     # Input validators
│   └── app.js          # Express app
├── database/           # SQL files
└── server.js           # Entry point
```
