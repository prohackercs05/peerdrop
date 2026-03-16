@echo off
echo ========================================
echo   PeerDrop Backend - Starting Server
echo ========================================
echo.

REM Check if Maven is installed
where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Maven is not installed or not in PATH
    echo.
    echo Please install Maven from: https://maven.apache.org/download.cgi
    echo Or use your IDE to run the Spring Boot application
    pause
    exit /b 1
)

echo Maven found! Starting Spring Boot application...
echo.

cd /d "%~dp0"
mvn spring-boot:run

pause
