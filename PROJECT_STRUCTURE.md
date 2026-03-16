# 📁 PeerDrop Project Structure

```
File Share app/
│
├── 📘 ShipMobileApp_Blueprint.Md          # Original blueprint
├── 📗 PHASE_1_COMPLETE.md                 # Phase 1 summary
│
├── backend/                                # Spring Boot Backend
│   ├── 📄 pom.xml                         # Maven dependencies
│   ├── 📄 README.md                       # Backend documentation
│   ├── 📄 HOW_TO_RUN.md                   # How to run guide
│   ├── 🚀 run.bat                         # Windows run script
│   ├── 🚀 run.sh                          # Linux/Mac run script
│   │
│   └── src/main/
│       ├── java/com/peerdrop/
│       │   ├── 🎯 PeerDropApplication.java         # Main app
│       │   │
│       │   ├── config/
│       │   │   ├── WebSocketConfig.java            # WebSocket setup
│       │   │   └── CorsConfig.java                 # CORS setup
│       │   │
│       │   ├── controller/
│       │   │   └── ApiController.java              # REST endpoints
│       │   │
│       │   ├── dto/
│       │   │   ├── WebSocketMessage.java           # Message format
│       │   │   └── RoomInfo.java                   # Room info DTO
│       │   │
│       │   ├── model/
│       │   │   ├── Room.java                       # Room entity
│       │   │   └── PeerSession.java                # Peer entity
│       │   │
│       │   ├── repository/
│       │   │   ├── RoomRepository.java             # Room DB ops
│       │   │   └── PeerSessionRepository.java      # Peer DB ops
│       │   │
│       │   ├── service/
│       │   │   └── RoomService.java                # Business logic
│       │   │
│       │   └── websocket/
│       │       └── SignalingHandler.java           # WebSocket handler
│       │
│       └── resources/
│           └── application.yml                     # Configuration
│
└── frontend/                               # (Coming in Phase 2)
    ├── index.html                          # Main HTML
    ├── css/
    │   └── style.css                       # Styles
    └── js/
        ├── websocket.js                    # WebSocket client
        ├── webrtc.js                       # WebRTC logic
        ├── fileTransfer.js                 # File transfer
        └── ui.js                           # UI interactions
```

---

## 🎯 File Purposes

### Backend Core

| File                       | Purpose                                                 |
| -------------------------- | ------------------------------------------------------- |
| `PeerDropApplication.java` | Main Spring Boot application entry point                |
| `pom.xml`                  | Maven dependencies (Spring Boot, WebSocket, JPA, MySQL) |
| `application.yml`          | Server configuration (port, database, CORS)             |

### Configuration

| File                   | Purpose                                    |
| ---------------------- | ------------------------------------------ |
| `WebSocketConfig.java` | Registers WebSocket endpoint at `/ws`      |
| `CorsConfig.java`      | Allows cross-origin requests from frontend |

### Database

| File                         | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| `Room.java`                  | Room entity with 6-digit code, expiry, peer list |
| `PeerSession.java`           | Peer session entity with connection status       |
| `RoomRepository.java`        | Database queries for rooms                       |
| `PeerSessionRepository.java` | Database queries for peer sessions               |

### Business Logic

| File               | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `RoomService.java` | Room creation, joining, cleanup, code generation |

### WebSocket Signaling

| File                    | Purpose                                                                 |
| ----------------------- | ----------------------------------------------------------------------- |
| `SignalingHandler.java` | Handles WebSocket messages (create-room, join-room, offer, answer, ICE) |
| `WebSocketMessage.java` | Message format for WebSocket communication                              |

### REST API

| File                 | Purpose                                           |
| -------------------- | ------------------------------------------------- |
| `ApiController.java` | HTTP endpoints for health check, room info, stats |
| `RoomInfo.java`      | DTO for room information responses                |

### Documentation & Scripts

| File            | Purpose                            |
| --------------- | ---------------------------------- |
| `README.md`     | Complete API documentation         |
| `HOW_TO_RUN.md` | Beginner-friendly run instructions |
| `run.bat`       | Windows run script                 |
| `run.sh`        | Linux/Mac run script               |

---

## 🔄 Data Flow

### 1. Room Creation Flow

```
User → Frontend → WebSocket → SignalingHandler
                                    ↓
                              RoomService
                                    ↓
                              RoomRepository
                                    ↓
                              Database (H2/MySQL)
                                    ↓
                              Room created with code
                                    ↓
                              Response → User
```

### 2. WebRTC Signaling Flow

```
Peer A → offer → SignalingHandler → Peer B
Peer B → answer → SignalingHandler → Peer A
Both → ICE candidates → SignalingHandler → Other Peer
                                    ↓
                        WebRTC Connection Established
                                    ↓
                        Direct P2P File Transfer
                        (Backend NOT involved)
```

---

## 📊 Technology Stack

### Backend

- **Java 17** - Programming language
- **Spring Boot 3.2** - Application framework
- **Spring WebSocket** - WebSocket support
- **Spring Data JPA** - Database abstraction
- **H2 Database** - In-memory database (dev)
- **MySQL** - Production database
- **Lombok** - Reduces boilerplate code
- **Jackson** - JSON processing

### Frontend (Phase 2)

- **HTML5** - Structure
- **CSS3** - Styling
- **Vanilla JavaScript** - Logic
- **WebRTC API** - P2P connections
- **WebSocket API** - Signaling

---

## 🎓 For Beginners: Understanding the Architecture

### What Each Layer Does:

1. **Controller Layer** (`ApiController.java`)
   - Handles HTTP requests (REST API)
   - Returns JSON responses
   - Example: Health check, room info

2. **WebSocket Layer** (`SignalingHandler.java`)
   - Handles real-time WebSocket connections
   - Routes messages between peers
   - Example: Relaying WebRTC offers/answers

3. **Service Layer** (`RoomService.java`)
   - Contains business logic
   - Validates data
   - Manages room lifecycle

4. **Repository Layer** (`RoomRepository.java`, `PeerSessionRepository.java`)
   - Talks to database
   - CRUD operations
   - Custom queries

5. **Model Layer** (`Room.java`, `PeerSession.java`)
   - Defines database structure
   - Represents data entities
   - Maps to database tables

6. **DTO Layer** (`WebSocketMessage.java`, `RoomInfo.java`)
   - Data Transfer Objects
   - Format for API responses
   - Clean separation from database entities

---

## 🔍 Key Design Decisions

### Why 6-Digit Room Codes?

- Easy to share verbally
- Enough combinations (32^6 = 1 billion+)
- Excludes confusing characters (0, O, I, 1)

### Why WebSocket Instead of HTTP?

- Real-time bidirectional communication
- Low latency for signaling
- Persistent connection

### Why H2 for Development?

- No installation required
- In-memory (fast)
- Auto-configured
- Easy to switch to MySQL for production

### Why Spring Boot?

- Production-ready
- Auto-configuration
- Large ecosystem
- Easy deployment

---

**🚀 Phase 1 Complete - Backend is production-ready!**
