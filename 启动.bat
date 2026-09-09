@echo off
set "PATH=%PATH%;d:\Program Files\node;c:\Program Files\nodejs"

echo ========================================
echo   Question Bank Practice System
echo ========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Please install:
    echo https://nodejs.org
    echo Make sure "Add to PATH" is checked during install.
    pause
    exit /b
)

REM Install dependencies if needed
if not exist "node_modules\" (
    echo [INFO] First run: installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency install failed
        pause
        exit /b
    )
    echo [INFO] Dependencies installed.
)

REM Prepare or migrate database without discarding existing data
echo [INFO] Checking database migrations...
call npm run db:prepare
if %errorlevel% neq 0 (
    echo [ERROR] Database migration failed. Existing data was not reset.
    pause
    exit /b
)

echo [INFO] Starting server...
echo Press Ctrl+C to stop
echo.

REM Open browser (may need refresh if server isn't ready yet)
start "" http://localhost:3000
echo.
npm run dev
