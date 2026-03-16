# 🚀 How to Run PeerDrop Backend

## ✅ Phase 1 Complete: Backend is Ready!

The Spring Boot signaling server has been created. Now let's run it!

---

## 📋 Prerequisites

You need **ONE** of the following:

### Option 1: Maven (Recommended)

- Download from: https://maven.apache.org/download.cgi
- Add to PATH

### Option 2: IDE (Easiest)

- IntelliJ IDEA (Community or Ultimate)
- Eclipse with Spring Tools
- VS Code with Java Extension Pack

---

## 🎯 Method 1: Using IDE (Easiest for Beginners)

### IntelliJ IDEA:

1. Open IntelliJ IDEA
2. Click **File → Open**
3. Navigate to `File Share app/backend` folder
4. Select the `pom.xml` file
5. Click **Open as Project**
6. Wait for dependencies to download (bottom right corner)
7. Find `PeerDropApplication.java` in the project explorer
8. Right-click on it → **Run 'PeerDropApplication'**
9. ✅ Server will start!

### VS Code:

1. Open VS Code
2. Install **Extension Pack for Java** (if not installed)
3. Open the `backend` folder
4. VS Code will detect it's a Maven project
5. Click on **Run** button above the `main()` method in `PeerDropApplication.java`
6. ✅ Server will start!

---

## 🎯 Method 2: Using Command Line

### Windows:

```bash
cd "c:\Users\Tanuja\Downloads\File Share app\backend"
run.bat
```

### Linux/Mac:

```bash
cd "/path/to/File Share app/backend"
chmod +x run.sh
./run.sh
```

### Or directly with Maven:

```bash
cd backend
mvn spring-boot:run
```

---

## ✅ How to Know It's Working

When the server starts successfully, you'll see:

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║              🚀 PeerDrop Backend Started 🚀          ║
║                                                       ║
║  WebSocket Endpoint: ws://localhost:8080/api/ws      ║
║  H2 Console: http://localhost:8080/api/h2-console    ║
║  Health Check: http://localhost:8080/api/health      ║
║                                                       ║
║  Status: ✅ Ready for peer connections               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
```

---

## 🧪 Test the Server

### Test 1: Health Check

Open your browser and go to:

```
http://localhost:8080/api/health
```

You should see:

```json
{
  "status": "UP",
  "service": "PeerDrop Signaling Server",
  "version": "1.0.0",
  "activeRooms": 0,
  "timestamp": 1234567890
}
```

### Test 2: WebSocket Connection

Open browser console (F12) and run:

```javascript
const ws = new WebSocket("ws://localhost:8080/api/ws");
ws.onopen = () => console.log("✅ Connected!");
ws.onmessage = (e) => console.log("📨 Received:", JSON.parse(e.data));
```

You should see:

```
✅ Connected!
📨 Received: {type: "connected", data: {...}}
```

---

## 🐛 Troubleshooting

### Problem: "Maven not found"

**Solution:**

- Install Maven from https://maven.apache.org/download.cgi
- OR use an IDE (IntelliJ/VS Code) - easier!

### Problem: "Port 8080 already in use"

**Solution:**
Edit `src/main/resources/application.yml`:

```yaml
server:
  port: 8081 # Change to any available port
```

### Problem: Dependencies not downloading

**Solution:**

```bash
mvn clean install
```

### Problem: Java version error

**Solution:**

- Install Java 17 or higher
- Download from: https://adoptium.net/

---

## 📊 What's Next?

Once the backend is running:

1. ✅ Keep it running in the background
2. ✅ Move to **Phase 2: Frontend Development**
3. ✅ The frontend will connect to `ws://localhost:8080/api/ws`

---

## 🎓 For Beginners

**Don't worry if you see lots of logs!** That's normal. As long as you see the success banner, everything is working.

The server will:

- ✅ Create rooms with 6-digit codes
- ✅ Handle WebSocket connections
- ✅ Relay WebRTC signaling messages
- ✅ Clean up expired rooms automatically

**Remember:** This server does NOT handle file data - only signaling! Files transfer directly between browsers.

---

**Need help? The backend is ready - let's move to the frontend!** 🚀
