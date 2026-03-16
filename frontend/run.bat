@echo off
echo ========================================
echo   PeerDrop Frontend - Starting Server
echo ========================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Python found! Starting HTTP server on port 3000...
    echo.
    echo 💻 ON THIS LAPTOP Open: http://localhost:3000
    echo 📱 ON YOUR PHONE Open: http://YOUR_LAPTOP_IP:3000
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    cd /d "%~dp0"
    python -m http.server 3000
    goto :end
)

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Node.js found!
    echo.
    echo 💻 ON THIS LAPTOP Open: http://localhost:3000
    echo 📱 ON YOUR PHONE Open: http://YOUR_LAPTOP_IP:3000
    echo.
    call npx -y serve -p 3000
    goto :end
)

REM Check if PHP is installed
where php >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo PHP found! Starting HTTP server on port 3000...
    echo.
    echo 💻 ON THIS LAPTOP Open: http://localhost:3000
    echo 📱 ON YOUR PHONE Open: http://YOUR_LAPTOP_IP:3000
    echo.
    cd /d "%~dp0"
    php -S 0.0.0.0:3000
    goto :end
)

REM No server found
echo ERROR: No HTTP server found!
echo.
echo Please install one of the following:
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo   - PHP: https://www.php.net/downloads
echo.
echo Or use VS Code with Live Server extension
echo.
pause
goto :end

:end
