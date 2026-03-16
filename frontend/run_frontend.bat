@echo off
echo ==========================================
echo       🚀 Starting PeerDrop App 🚀
echo ==========================================
echo.
echo Opening first tab...
start "" "index.html"

echo.
echo Opening second tab...
timeout /t 2 >nul
start "" "index.html"

echo.
echo ✅ Application opened in 2 tabs.
echo You can now test the P2P connection by:
echo 1. Creating a room in the first tab
echo 2. Joining that room in the second tab
echo.
pause
