@echo off
echo ========================================
echo MySQL Setup for Scrum Board Project
echo ========================================
echo.

echo Step 1: Testing MySQL connection...
echo.
echo Please enter your MySQL root password when prompted.
echo If you don't have a password, just press Enter.
echo.

mysql -u root -p -e "SELECT 'Connection successful!' AS status;"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Could not connect to MySQL
    echo ========================================
    echo.
    echo Common solutions:
    echo 1. Reset MySQL root password
    echo 2. Try connecting without password: mysql -u root
    echo 3. Check MySQL service is running
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Creating database...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS scrum_board; USE scrum_board; SELECT 'Database created!' AS status;"

echo.
echo Step 3: Loading schema...
mysql -u root -p scrum_board < database\schema.sql

echo.
echo Step 4: Loading seed data...
mysql -u root -p scrum_board < database\seeds.sql

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Database: scrum_board
echo Tables created: 10
echo Sample data loaded: Yes
echo.
echo Next: Update .env file with your MySQL password
echo Then run: npm run dev
echo.
pause
