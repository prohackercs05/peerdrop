# PeerDrop Backend - WebSocket Signaling Server

## 🎯 Overview

This is the **signaling server** for PeerDrop - a P2P file sharing application.

**Important:** This server does **NOT** handle file data. It only facilitates WebRTC peer connections by:

- Creating and managing rooms
- Exchanging SDP offers/answers
- Relaying ICE candidates
- Notifying peers about connections/disconnections

Files are transferred **directly between browsers** using WebRTC DataChannels.

---

## 🛠 Tech Stack

- **Java 17**
- **Spring Boot 3.2.0**
- **WebSocket** (for signaling)
- **Spring Data JPA**
- **H2 Database** (development)
- **MySQL** (production)

---

## 📁 Project Structure

```
backend/
├── src/main/java/com/peerdrop/
│   ├── PeerDropApplication.java       # Main application
│   ├── config/
│   │   ├── WebSocketConfig.java       # WebSocket configuration
│   │   └── CorsConfig.java            # CORS configuration
│   ├── controller/
│   │   └── ApiController.java         # REST API endpoints
│   ├── dto/
│   │   ├── WebSocketMessage.java      # WebSocket message format
│   │   └── RoomInfo.java              # Room information DTO
│   ├── model/
│   │   ├── Room.java                  # Room entity
│   │   └── PeerSession.java           # Peer session entity
│   ├── repository/
│   │   ├── RoomRepository.java        # Room database operations
│   │   └── PeerSessionRepository.java # Peer session database operations
│   ├── service/
│   │   └── RoomService.java           # Room management logic
│   └── websocket/
│       └── SignalingHandler.java      # WebSocket message handler
└── src/main/resources/
    └── application.yml                # Application configuration
```

---

## 🚀 How to Run

### Prerequisites

- Java 17 or higher
- Maven 3.6+

### Steps

1. **Navigate to backend directory:**

   ```bash
   cd backend
   ```

2. **Run the application:**

   ```bash
   mvnw spring-boot:run
   ```

   Or on Linux/Mac:

   ```bash
   ./mvnw spring-boot:run
   ```

3. **Server will start on port 8080:**
   ```
   WebSocket Endpoint: ws://localhost:8080/api/ws
   Health Check: http://localhost:8080/api/health
   H2 Console: http://localhost:8080/api/h2-console
   ```

---

## 🔌 WebSocket API

### Connection

```
ws://localhost:8080/api/ws
```

### Message Format

All messages use JSON format:

```json
{
  "type": "message-type",
  "roomCode": "ABC123",
  "sessionId": "session-id",
  "data": {},
  "timestamp": 1234567890
}
```

### Message Types

#### 1. Create Room

**Client → Server:**

```json
{
  "type": "create-room"
}
```

**Server → Client:**

```json
{
  "type": "room-created",
  "roomCode": "ABC123",
  "data": {
    "code": "ABC123",
    "peerCount": 1,
    "maxPeers": 2,
    "isFull": false,
    "createdAt": 1234567890,
    "expiresAt": 1234571490
  }
}
```

#### 2. Join Room

**Client → Server:**

```json
{
  "type": "join-room",
  "roomCode": "ABC123"
}
```

**Server → Client:**

```json
{
  "type": "room-joined",
  "roomCode": "ABC123",
  "data": { ... }
}
```

**Server → Other Peers:**

```json
{
  "type": "peer-connected",
  "roomCode": "ABC123",
  "sessionId": "new-peer-session-id"
}
```

#### 3. WebRTC Offer

**Client → Server:**

```json
{
  "type": "offer",
  "data": {
    "sdp": "...",
    "type": "offer"
  }
}
```

**Server → Other Peer:**

```json
{
  "type": "offer",
  "sessionId": "sender-session-id",
  "data": {
    "sdp": "...",
    "type": "offer"
  }
}
```

#### 4. WebRTC Answer

**Client → Server:**

```json
{
  "type": "answer",
  "data": {
    "sdp": "...",
    "type": "answer"
  }
}
```

#### 5. ICE Candidate

**Client → Server:**

```json
{
  "type": "ice-candidate",
  "data": {
    "candidate": "...",
    "sdpMid": "...",
    "sdpMLineIndex": 0
  }
}
```

#### 6. Leave Room

**Client → Server:**

```json
{
  "type": "leave-room"
}
```

---

## 🗄 Database

### Development (H2)

- In-memory database
- Auto-configured
- Access console at: http://localhost:8080/api/h2-console
  - JDBC URL: `jdbc:h2:mem:peerdrop`
  - Username: `sa`
  - Password: (leave empty)

### Production (MySQL)

1. **Create database:**

   ```sql
   CREATE DATABASE peerdrop;
   ```

2. **Update `application.yml`:**
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/peerdrop
       username: your_username
       password: your_password
     jpa:
       properties:
         hibernate:
           dialect: org.hibernate.dialect.MySQLDialect
   ```

---

## 📊 REST API Endpoints

### Health Check

```
GET /api/health
```

Response:

```json
{
  "status": "UP",
  "service": "PeerDrop Signaling Server",
  "version": "1.0.0",
  "activeRooms": 5,
  "timestamp": 1234567890
}
```

### Get Room Info

```
GET /api/room/{code}
```

Response:

```json
{
  "code": "ABC123",
  "peerCount": 2,
  "maxPeers": 2,
  "isFull": true,
  "createdAt": 1234567890,
  "expiresAt": 1234571490
}
```

### Get Statistics

```
GET /api/stats
```

Response:

```json
{
  "activeRooms": 5,
  "timestamp": 1234567890
}
```

---

## ⚙️ Configuration

Edit `src/main/resources/application.yml`:

```yaml
peerdrop:
  room:
    code-length: 6 # Length of room codes
    expiry-minutes: 60 # Room expiry time
    max-peers-per-room: 2 # Maximum peers per room
```

---

## 🧪 Testing

### Test WebSocket Connection

You can test using a WebSocket client or browser console:

```javascript
const ws = new WebSocket("ws://localhost:8080/api/ws");

ws.onopen = () => {
  console.log("Connected");
  // Create room
  ws.send(JSON.stringify({ type: "create-room" }));
};

ws.onmessage = (event) => {
  console.log("Received:", JSON.parse(event.data));
};
```

---

## 🔒 Security Notes

- **CORS:** Currently allows all origins (`*`). Restrict in production.
- **WebSocket:** No authentication implemented. Add if needed.
- **HTTPS:** Use WSS (WebSocket Secure) in production.
- **TURN Server:** Configure STUN/TURN servers for production WebRTC.

---

## 📦 Building for Production

```bash
mvnw clean package
```

This creates a JAR file in `target/` directory:

```bash
java -jar target/peerdrop-backend-1.0.0.jar
```

---

## 🐛 Troubleshooting

### Port already in use

Change port in `application.yml`:

```yaml
server:
  port: 8081
```

### Database connection error

Check MySQL is running and credentials are correct.

### WebSocket connection refused

- Check firewall settings
- Verify server is running
- Check CORS configuration

---

## 📝 License

MIT License - Feel free to use and modify!

---

**Built with ❤️ for PeerDrop**
