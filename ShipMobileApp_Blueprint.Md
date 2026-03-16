## ShipWebApp Blueprint Method

The Complete Guide to Building a File Sharing Web App (No Paywall, No Auth)
You don’t need to know how to code.
You just need this blueprint and AI.
This version is specifically designed for:
❌ No paywall
❌ No user authentication
🌐 Web-based app (not mobile)
📂 File sharing application
🧱 Tech Stack:
Frontend: HTML5 + CSS3 + Vanilla JavaScript + WebRTC DataChannels
Backend: Java 17 + Spring Boot + WebSocket
Database: MySQL

---

📖 TABLE OF CONTENTS

1. Introduction – How This Works
2. Tech Stack Overview
3. The Master Prompt (Start Here)
4. Your Web App Idea Template
5. Understanding Web App Architecture
6. Real-Time File Sharing with WebRTC
7. Backend with Spring Boot + WebSocket
8. Database Design (MySQL)
9. UI & UX Design
10. Step-by-Step Build Workflow
11. Deployment Guide
12. Common Mistakes to Avoid
13. Quick Prompts Library

---

SECTION 1: INTRODUCTION
What Is This Blueprint?
This is your complete guide to building a production-ready file sharing web app using AI.
You will build:
✅ Real-time file sharing
✅ Peer-to-peer transfers (WebRTC DataChannels)
✅ WebSocket signaling server
✅ MySQL persistence layer (for room/session metadata)
✅ Modern responsive UI
❌ No login system
❌ No subscriptions or payments

---

How It Works

1. Create a folder on your computer
2. Add this blueprint file
3. Open it in VS Code
4. Paste the Master Prompt to AI
5. AI builds your entire web app step-by-step

---

What You’ll End Up With
A web app where:
Users open a URL
Create or join a room
Connect peer-to-peer
Share files directly
Files transfer securely using WebRTC
Backend only handles signaling (not file data)

---

SECTION 2: TECH STACK OVERVIEW
🌐 Frontend
HTML5
CSS3
Vanilla JavaScript (no frameworks)
WebRTC DataChannels (for file transfer)
🔌 Backend
Java 17
Spring Boot
WebSocket (for signaling server)
🗄 Database
MySQL
Stores:
Room IDs
Session metadata
File transfer logs (optional)

---

SECTION 3: ⭐ THE MASTER PROMPT ⭐
Copy this entire prompt and paste it into your AI coding assistant.

---

📋 COPY THIS PROMPT:
You are ShipWebApp Assistant — an expert full-stack engineer specializing in real-time web applications.
IMPORTANT:
There is a file called "ShipWebApp_Blueprint.md" in this folder. Read it completely before writing any code.
ROLE:

- Build a production-ready file sharing web app.
- No authentication.
- No payments.
- Clean architecture.
- Explain everything simply.
- Build step-by-step.
  APP REQUIREMENTS:
  Frontend:
- HTML5
- CSS3
- Vanilla JavaScript
- WebRTC DataChannels for peer-to-peer file transfer
  Backend:
- Java 17
- Spring Boot
- WebSocket signaling server
  Database:
- MySQL
  FEATURES:

1. Create Room
2. Join Room
3. Real-time peer connection
4. File selection
5. File chunk transfer over DataChannel
6. Transfer progress indicator
7. Clean UI
   RULES:

- No frameworks on frontend
- Use modular JS files
- Clean folder structure
- Comment code clearly
- Add error handling
- Add connection status UI
  WORKFLOW:

1. Ask me clarifying questions first.
2. Summarize the app structure.
3. Create backend project first.
4. Then build frontend.
5. Then integrate.
6. Then test.
   Start by asking:
   "What name would you like to give your file sharing web app?"

---

SECTION 4: YOUR WEB APP IDEA TEMPLATE
Fill this before starting:

---

📝 MY FILE SHARING WEB APP
App Name:

---

## One-line description:

## Max file size limit:

## Should rooms auto-expire? (Yes/No):

## Should files be stored on server? (Yes/No — recommended: No, P2P only):

SECTION 5: WEB APP ARCHITECTURE
🏗 High-Level Architecture
Browser A <--WebRTC--> Browser B
\ /
\ /
--- WebSocket ---
Spring Boot

---

🔄 How File Sharing Works

1. User A creates room
2. User B joins room
3. Backend exchanges SDP offers via WebSocket
4. WebRTC connection established
5. DataChannel opens
6. File sent in chunks
7. Receiver reconstructs file

---

SECTION 6: REAL-TIME FILE SHARING (WebRTC)
Why WebRTC?
Direct peer-to-peer
Backend does NOT handle file data
Faster
Scalable
Lower server cost
Key Concepts
Concept Meaning
RTCPeerConnection Creates connection
DataChannel Sends file data
ICE Candidates Network discovery
SDP Session negotiation

---

SECTION 7: BACKEND (Spring Boot + WebSocket)
What Backend Does
Creates rooms
Handles signaling
Exchanges SDP offers/answers
Exchanges ICE candidates
Manages active sessions
Backend Folder Structure
shipwebapp-backend/
├── src/main/java/com/app/
│ ├── config/
│ ├── controller/
│ ├── websocket/
│ ├── service/
│ └── model/
├── resources/
│ └── application.yml
└── pom.xml

---

WebSocket Flow

1. Client connects to /ws
2. Sends:
   create-room
   join-room
   offer
   answer
   ice-candidate
3. Server relays messages to correct peer

---

SECTION 8: DATABASE DESIGN (MySQL)
Tables
rooms
Column Type
id VARCHAR
created_at TIMESTAMP
expires_at TIMESTAMP
sessions
Column Type
id VARCHAR
room_id VARCHAR
connected_at TIMESTAMP

---

Example MySQL Schema
CREATE TABLE rooms (
id VARCHAR(50) PRIMARY KEY,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
expires_at TIMESTAMP
);
CREATE TABLE sessions (
id VARCHAR(50) PRIMARY KEY,
room_id VARCHAR(50),
connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
FOREIGN KEY (room_id) REFERENCES rooms(id)
);

---

SECTION 9: DESIGN
UI Must Include:
Room creation screen
Join room screen
Drag & drop file area
Transfer progress bar
Connection status indicator
Mobile responsive layout

---

Design Rules
Clean minimal UI
Rounded corners (12–16px)
Subtle shadows
Smooth transitions
Dark mode support
Clear error messages

---

## SECTION 10: BUILD WORKFLOW

PHASE 1: Backend (Spring Boot)

1. Generate Spring Boot project (Java 17)
2. Add dependencies:
   Web
   WebSocket
   Spring Data JPA
   MySQL Driver
3. Configure WebSocket endpoint
4. Create signaling handler
5. Test with Postman/WebSocket client

---

PHASE 2: Frontend

1. Create folder:
   shipwebapp-frontend/
   ├── index.html
   ├── css/
   ├── js/
   │ ├── websocket.js
   │ ├── webrtc.js
   │ ├── fileTransfer.js
   │ └── ui.js
2. Build:
   Room UI
   WebSocket connection
   WebRTC handshake
   File chunk sending
   Progress tracking

---

PHASE 3: Integration
Connect frontend to backend WebSocket
Test 2-browser transfer
Test large files
Add error recovery

---

PHASE 4: Polish
Add:
Loading states
Better animations
File size validation
Mobile styling
Copy room link button

---

SECTION 11: DEPLOYMENT
Backend Deployment Options
Docker + VPS
Railway
Render
AWS EC2
Frontend Deployment
Vercel
Netlify
Nginx

---

Production Setup
Use HTTPS
Configure STUN/TURN server
Environment variables for DB
CORS config

---

SECTION 12: COMMON MISTAKES
❌ Sending file through backend
✅ Only use backend for signaling
❌ Not chunking large files
✅ Split into 512KB–1024KB chunks
❌ Ignoring connection states
✅ Show connected/disconnected
❌ No STUN server
✅ Add STUN for NAT traversal

---

SECTION 13: QUICK PROMPTS
Create Backend:
Create a Spring Boot 3 project using Java 17 with:

- WebSocket signaling server
- MySQL integration
- Room management service
- Clean layered architecture

---

Create WebRTC Frontend:
Build a WebRTC file transfer module using:

- RTCPeerConnection
- DataChannel
- Chunked file sending
- Progress tracking
- Reassembly on receiver

---

Add STUN Server:
Integrate public STUN and STUN servers for production WebRTC reliability.

---

🎉 YOU’RE READY
You now have a full blueprint for building your file sharing web app:
No Signupl
No paywall
Real-time P2P transfer
Spring Boot backend
MySQL database
Vanilla JS frontend
Ship it. Improve it. Scale it. 🚀

---

ShipWebApp Blueprint Method
Version 1.0 – Web Edition
