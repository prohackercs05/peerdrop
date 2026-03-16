@echo off
setlocal
echo ========================================
echo   PeerDrop Backend - One-Click Launcher
echo ========================================
echo.

REM 1. Check for Java
echo [1/4] Checking Java...
java -version >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Java is not installed or not in PATH!
    echo Please install Java 17+ from: https://adoptium.net/
    pause
    exit /b 1
)
echo Java found!
echo.

REM 2. Check/Install Local Maven
set "MAVEN_VERSION=3.9.6"
set "MAVEN_DIR=%~dp0.maven"
set "MAVEN_BIN=%MAVEN_DIR%\apache-maven-%MAVEN_VERSION%\bin"

if exist "%MAVEN_BIN%\mvn.cmd" (
    echo [2/4] Local Maven found in %MAVEN_DIR%
) else (
    echo [2/4] Downloading Maven %MAVEN_VERSION%...
    if not exist "%MAVEN_DIR%" mkdir "%MAVEN_DIR%"
    
    powershell -Command "Invoke-WebRequest -Uri 'https://dlcdn.apache.org/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip' -OutFile '%MAVEN_DIR%\maven.zip'"
    
    echo Extracting Maven...
    powershell -Command "Expand-Archive -Path '%MAVEN_DIR%\maven.zip' -DestinationPath '%MAVEN_DIR%' -Force"
    
    del "%MAVEN_DIR%\maven.zip"
    echo Maven installed locally!
)
echo.

REM 3. Setup Environment
echo [3/4] Configuring environment...
set "PATH=%MAVEN_BIN%;%PATH%"
echo.

REM 4. Run Application
echo [4/4] Starting PeerDrop Backend...
echo.
echo ----------------------------------------
echo  Please wait... (First run takes time)
echo ----------------------------------------
echo.

call mvn spring-boot:run

pause
