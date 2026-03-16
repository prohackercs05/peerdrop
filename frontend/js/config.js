/**
 * PeerDrop Configuration
 *
 * Central configuration file for the application
 */

const CONFIG = {
  // WebSocket Server
  // WebSocket Server - Hardcoded to your laptop IP
  WS_URL: "ws://10.207.118.120:8080/api/ws",

  // WebRTC Configuration
  WEBRTC: {
    // ICE Servers (STUN/TURN)
    iceServers: [
      // Google's public STUN servers
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },

      // For production, add TURN servers for better NAT traversal
      // {
      //     urls: 'turn:your-turn-server.com:3478',
      //     username: 'username',
      //     credential: 'password'
      // }
    ],

    // ICE Candidate Pool Size
    iceCandidatePoolSize: 10,
  },

  // File Transfer Settings
  FILE_TRANSFER: {
    // Chunk size for file transfer (64 KB - Universally safe for WebRTC DataChannel)
    CHUNK_SIZE: 64 * 1024, // 64 KB

    // Maximum file size (5GB)
    MAX_FILE_SIZE: 5 * 1024 * 1024 * 1024, // 5 GB

    // Buffer threshold (16MB - Allows more data in flight for 100MB+ speeds)
    BUFFER_THRESHOLD: 16 * 1024 * 1024, // 16 MB
    
    // Read buffer (32MB - Minimize disk I/O overhead)
    READ_BUFFER_SIZE: 32 * 1024 * 1024, // 32 MB

    // Progress update interval (ms)
    PROGRESS_UPDATE_INTERVAL: 100, // 100ms
  },

  // UI Settings
  UI: {
    // Toast notification duration (ms)
    TOAST_DURATION: 3000, // 3 seconds

    // Room code length
    ROOM_CODE_LENGTH: 6,

    // Auto-hide notifications
    AUTO_HIDE_NOTIFICATIONS: true,
  },

  // Debug Mode
  DEBUG: true, // Set to false in production

  // Version
  VERSION: "1.0.0",
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.WEBRTC);
Object.freeze(CONFIG.FILE_TRANSFER);
Object.freeze(CONFIG.UI);

// Log configuration in debug mode
if (CONFIG.DEBUG) {
  console.log("🔧 PeerDrop Configuration:", CONFIG);
}
