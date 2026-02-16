# MySQL Setup Guide

## Option 1: Automated Setup (Recommended)

Run the setup script:
```bash
setup-mysql.bat
```

Enter your MySQL root password when prompted (or press Enter if no password).

---

## Option 2: Manual Setup

### Step 1: Connect to MySQL
```bash
mysql -u root -p
```
(Enter password or press Enter if no password)

### Step 2: Create Database
```sql
CREATE DATABASE scrum_board;
USE scrum_board;
```

### Step 3: Load Schema
```sql
SOURCE database/schema.sql;
```

### Step 4: Load Seed Data
```sql
SOURCE database/seeds.sql;
```

### Step 5: Verify
```sql
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

### Step 6: Exit MySQL
```sql
EXIT;
```

---

## Option 3: Command Line (One-liner)

If you know your password:
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS scrum_board;"
mysql -u root -p scrum_board < database/schema.sql
mysql -u root -p scrum_board < database/seeds.sql
```

If no password:
```bash
mysql -u root -e "CREATE DATABASE IF NOT EXISTS scrum_board;"
mysql -u root scrum_board < database/schema.sql
mysql -u root scrum_board < database/seeds.sql
```

---

## Update .env File

After setup, update your `.env` file:

**If you have a password:**
```
DB_PASSWORD=your_actual_password
```

**If no password (leave empty):**
```
DB_PASSWORD=
```

---

## Test Connection

```bash
node test-db.js
```

Expected output:
```
✓ Database connected successfully
✓ Host: localhost
✓ Database: scrum_board
✓ User: root
✓ Test query successful: 2
```

---

## Troubleshooting

### Error: Access denied
- Check password in .env file
- Try connecting manually: `mysql -u root -p`

### Error: Database doesn't exist
- Run: `mysql -u root -p -e "CREATE DATABASE scrum_board;"`

### Error: Can't connect to MySQL server
- Check if MySQL is running: `net start MySQL80`
- Start MySQL: `net start MySQL80`
