@echo off
setlocal
echo ========================================
3: echo   PeerDrop - Connection Debugger
4: echo ========================================
5: echo.
6: 
7: echo [1/3] Checking Local IP Address...
8: for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address" /c:"IP-Address"') do (
9:     set "IP=%%a"
10: )
11: set "IP=%IP:~1%"
12: if "%IP%"=="" (
13:     echo ERROR: Could not find local IP address.
14: ) else (
15:     echo Success! Your Local IP is: %IP%
16: )
17: echo.
18: 
19: echo [2/3] Checking Port 8080 (Backend)...
20: netstat -ano | findstr :8080 >nul 2>nul
21: if %ERRORLEVEL% EQU 0 (
22:     echo ✅ Backend is running and listening on port 8080.
23: ) else (
24:     echo ❌ Backend is NOT detected on port 8080.
25:     echo    Please run 'backend\run.bat' or start it via your IDE.
26: )
27: echo.
28: 
29: echo [3/3] Checking Port 3000 (Frontend)...
30: netstat -ano | findstr :3000 >nul 2>nul
31: if %ERRORLEVEL% EQU 0 (
32:     echo ✅ Frontend is running on port 3000.
33: ) else (
34:     echo ⚠️ Frontend is not detected on port 3000.
35:     echo    If you are using VS Code Live Server, it might be on 5500.
36: )
37: echo.
38: 
39: echo ----------------------------------------
40: echo  RECOMMENDED ACTION:
41: echo ----------------------------------------
42: if "%IP%" NEQ "" (
43:     echo  1. Ensure Backend is RUNNING.
44:     echo  2. If using a phone, open: http://%IP%:3000 (or your frontend port)
45:     echo  3. Ensure Windows Firewall allows ports 8080 and 3000.
46: )
47: echo.
48: pause
