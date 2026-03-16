# 🧪 PeerDrop Testing Guide - The Easy Way!

## 🚀 **Option 1: One-Click Run (Recommended)**

Since you don't have IntelliJ installed, I created a special script that sets up everything automatically!

### **Step 1: Run the Automatic Script**

1. Go to your `backend` folder: `c:\Users\Tanuja\Downloads\File Share app\backend`
2. Double-click **`run_backend_auto.bat`** (I just created this for you!)
3. It will:
   - Check if Java is installed
   - Download Maven automatically (if missing)
   - Setup environment variables
   - Start the backend server

**Wait for:**

```
🚀 PeerDrop Backend Started 🚀
WebSocket Endpoint: ws://localhost:8080/api/ws
```

---

## 🌐 **Option 2: Run the Frontend**

While the backend is starting, let's run the frontend.

1. Open a **NEW** Command Prompt window.
2. Run these commands:

   ```cmd
   cd "c:\Users\Tanuja\Downloads\File Share app\frontend"
   python -m http.server 3000
   ```

   _(If Python isn't installed, let me know!)_

3. Open your browser: http://localhost:3000

---

## 🧪 **How to Test**

1. **Open Two Windows:**
   - Regular window: http://localhost:3000
   - Incognito window: http://localhost:3000

2. **Connect:**
   - Click "Create Room" in Window 1 -> Copy code
   - Click "Join Room" in Window 2 -> Paste code

3. **Transfer:**
   - Drag & drop a file to send it!

---

## 🐛 **Troubleshooting**

**"Java is not installed" error:**

- The script will tell you if Java is missing.
- Download it here: https://adoptium.net/ (Install "JDK 17" or newer)

**"Port 8080 is in use":**

- Close any other running servers.
- Or edit `backend/src/main/resources/application.yml` and change port to 8081.

**Script closes immediately:**

- Open Command Prompt in the folder and run `run_backend_auto.bat` manually to see the error.

---

**Ready when you are!** 🚀
