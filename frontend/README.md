# PeerDrop Frontend

## 🎨 Overview

Modern, responsive web interface for PeerDrop - P2P file sharing application.

**Features:**

- ✨ Beautiful dark mode design
- 🎨 Glassmorphism effects
- 📱 Fully responsive
- 🌈 Smooth animations
- ⚡ Real-time progress tracking
- 🚀 Optimized for high-speed transfers

---

## 📁 Project Structure

```
frontend/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Styles (dark mode, glassmorphism)
└── js/
    ├── config.js          # Configuration
    ├── utils.js           # Utility functions
    ├── ui.js              # UI manager
    ├── websocket.js       # WebSocket client
    ├── webrtc.js          # WebRTC manager
    ├── fileTransfer.js    # File transfer logic
    └── app.js             # Main application
```

---

## 🚀 How to Run

### Method 1: Simple HTTP Server (Recommended)

**Using Python:**

```bash
cd frontend
python -m http.server 3000
```

Then open: http://localhost:3000

**Using Node.js (npx):**

```bash
cd frontend
npx serve -p 3000
```

**Using PHP:**

```bash
cd frontend
php -S localhost:3000
```

### Method 2: VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Method 3: Double-Click (Limited)

Simply double-click `index.html` to open in browser.

⚠️ **Note:** Some features may not work due to CORS restrictions. Use HTTP server method for full functionality.

---

## ⚙️ Configuration

Edit `js/config.js` to customize:

```javascript
const CONFIG = {
    // WebSocket server URL
    WS_URL: 'ws://localhost:8080/api/ws',

    // File transfer settings
    FILE_TRANSFER: {
        CHUNK_SIZE: 16384,        // 16 KB chunks
        MAX_FILE_SIZE: 5GB,       // Maximum file size
        BUFFER_THRESHOLD: 1MB     // Buffer threshold
    },

    // WebRTC ICE servers
    WEBRTC: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
        ]
    }
};
```

---

## 🎯 Features Implemented

### ✅ UI Components

- Welcome screen with create/join options
- Join room screen with code input
- Room screen with file transfer
- Connection status indicator
- Toast notifications
- Progress tracking
- Received files list

### ✅ File Transfer

- Drag & drop file selection
- Multiple file support
- Chunked transfer (16KB chunks)
- Real-time progress (%, speed, ETA)
- Bidirectional transfer
- Large file support (up to 5GB)

### ✅ WebRTC

- Peer-to-peer connection
- DataChannel for file transfer
- SDP offer/answer exchange
- ICE candidate handling
- Connection state management

### ✅ WebSocket

- Signaling server connection
- Room management
- Peer discovery
- Auto-reconnection

---

## 🎨 Design Features

### Dark Mode

- Modern dark color scheme
- High contrast for readability
- Easy on the eyes

### Glassmorphism

- Frosted glass effect
- Backdrop blur
- Subtle transparency
- Premium feel

### Animations

- Smooth transitions
- Floating gradient orbs
- Hover effects
- Loading states

### Responsive Design

- Mobile-friendly
- Tablet optimized
- Desktop enhanced
- Adaptive layouts

---

## 🧪 Testing

### Test Locally (Same Computer)

1. **Start Backend:**

   ```bash
   cd backend
   mvn spring-boot:run
   ```

2. **Start Frontend:**

   ```bash
   cd frontend
   python -m http.server 3000
   ```

3. **Open Two Browser Windows:**
   - Window 1: http://localhost:3000
   - Window 2: http://localhost:3000 (incognito/private mode)

4. **Test Flow:**
   - Window 1: Click "Create Room" → Get room code
   - Window 2: Click "Join Room" → Enter code
   - Both windows should connect
   - Try sending files in both directions

### Test Across Network

1. Find your local IP:
   - Windows: `ipconfig`
   - Mac/Linux: `ifconfig`

2. Update `js/config.js`:

   ```javascript
   WS_URL: "ws://10.65.189.120:8080/api/ws";
   ```

3. Access from other device:
   ```
   http://10.65.189.120:3000
   ```

---

## 📊 Performance

### Optimizations

- 16KB chunk size (optimal for WebRTC)
- Buffer flow control
- Throttled progress updates
- Efficient memory management

### Expected Performance

- **Speed:** 1GB in 30-45 seconds (local network)
- **Max File Size:** 5GB
- **Concurrent Transfers:** Queued automatically
- **Memory Usage:** Minimal (streaming chunks)

---

## 🔒 Security

### Built-in Security

- ✅ End-to-end encryption (DTLS via WebRTC)
- ✅ No files stored on server
- ✅ Direct peer-to-peer transfer
- ✅ Room expiry (60 minutes)
- ✅ Secure WebSocket connection (upgrade to WSS for production)

### Production Recommendations

1. Use HTTPS/WSS
2. Add TURN server for better NAT traversal
3. Implement rate limiting
4. Add file type restrictions if needed
5. Monitor transfer sizes

---

## 🐛 Troubleshooting

### Files not transferring

- Check if both peers are connected (green status)
- Verify backend is running
- Check browser console for errors

### Slow transfer speed

- Check network connection
- Try different STUN/TURN servers
- Reduce chunk size in config

### Connection fails

- Verify WebSocket URL is correct
- Check firewall settings
- Try adding TURN server

### Browser compatibility issues

- Use Chrome, Firefox, or Edge
- Update to latest browser version
- Check WebRTC support: https://test.webrtc.org/

---

## 📱 Browser Support

| Browser | Supported | Notes          |
| ------- | --------- | -------------- |
| Chrome  | ✅        | Recommended    |
| Firefox | ✅        | Recommended    |
| Edge    | ✅        | Recommended    |
| Safari  | ✅        | iOS 11+        |
| Opera   | ✅        | Chromium-based |
| IE      | ❌        | Not supported  |

---

## 🎓 For Beginners

### How It Works

1. **You create a room** → Get a 6-digit code
2. **Share the code** → Other person joins
3. **WebRTC connects** → Direct peer-to-peer link
4. **Select files** → Drag & drop or click
5. **Files transfer** → Directly between browsers
6. **Download** → Received files appear automatically

### Key Concepts

**WebSocket:** Connects you to the signaling server (like a matchmaker)

**WebRTC:** Creates direct connection between browsers (like a phone call)

**DataChannel:** The "pipe" that carries file data

**Chunks:** Files are split into small pieces for efficient transfer

---

## 📝 License

MIT License - Feel free to use and modify!

---

**Built with ❤️ for PeerDrop**
