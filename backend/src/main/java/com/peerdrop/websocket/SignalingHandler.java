package com.peerdrop.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.peerdrop.dto.RoomInfo;
import com.peerdrop.dto.WebSocketMessage;
import com.peerdrop.model.PeerSession;
import com.peerdrop.model.Room;
import com.peerdrop.service.RoomService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SignalingHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(SignalingHandler.class);
    private final RoomService roomService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SignalingHandler(RoomService roomService) {
        this.roomService = roomService;
    }

    // Store active WebSocket sessions
    private final Map<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    // Map session ID to room code
    private final Map<String, String> sessionToRoom = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        sessions.put(sessionId, session);
        log.info("🔌 WebSocket connected: {}", sessionId);

        // Send welcome message
        WebSocketMessage welcome = WebSocketMessage.success("connected", null,
                Map.of("sessionId", sessionId, "message", "Connected to PeerDrop signaling server"));
        sendMessage(session, welcome);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String sessionId = session.getId();
        String payload = message.getPayload();

        try {
            WebSocketMessage msg = objectMapper.readValue(payload, WebSocketMessage.class);
            log.info("📨 Received: {} from {}", msg.getType(), sessionId);

            switch (msg.getType()) {
                case "create-room" -> handleCreateRoom(session, msg);
                case "join-room" -> handleJoinRoom(session, msg);
                case "offer" -> handleOffer(session, msg);
                case "answer" -> handleAnswer(session, msg);
                case "ice-candidate" -> handleIceCandidate(session, msg);
                case "leave-room" -> handleLeaveRoom(session, msg);
                default -> {
                    log.warn("⚠️ Unknown message type: {}", msg.getType());
                    sendError(session, "Unknown message type: " + msg.getType());
                }
            }
        } catch (Exception e) {
            log.error("❌ Error handling message: {}", e.getMessage(), e);
            sendError(session, "Error processing message: " + e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        String sessionId = session.getId();
        log.info("🔌 WebSocket disconnected: {} ({})", sessionId, status);

        // Mark as disconnected but don't purge immediately to allow refresh
        // reconnection
        roomService.disconnectPeer(sessionId);

        sessions.remove(sessionId);
        sessionToRoom.remove(sessionId);
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        log.error("❌ WebSocket error for {}: {}", session.getId(), exception.getMessage());
        session.close(CloseStatus.SERVER_ERROR);
    }

    /**
     * Handle room creation
     */
    private void handleCreateRoom(WebSocketSession session, WebSocketMessage msg) throws IOException {
        String sessionId = session.getId();
        String userId = msg.getUserId();

        if (userId == null || userId.trim().isEmpty()) {
            sendError(session, "User ID is required");
            return;
        }

        try {
            Room room = roomService.createRoom();
            String roomCode = room.getCode();

            // Join the room using userId
            String upperCode = roomCode.toUpperCase();
            roomService.joinRoom(upperCode, userId, sessionId, null);
            sessionToRoom.put(sessionId, upperCode);

            // Send success response
            RoomInfo roomInfo = roomService.getRoomInfo(roomCode);
            WebSocketMessage response = WebSocketMessage.success("room-created", roomCode, roomInfo);
            sendMessage(session, response);

            log.info("✅ Room created: {} by User {} (Session {})", roomCode, userId, sessionId);
        } catch (Exception e) {
            log.error("❌ Error creating room: {}", e.getMessage());
            sendError(session, "Failed to create room: " + e.getMessage());
        }
    }

    /**
     * Handle room joining
     */
    private void handleJoinRoom(WebSocketSession session, WebSocketMessage msg) throws IOException {
        String sessionId = session.getId();
        String roomCode = msg.getRoomCode();
        String userId = msg.getUserId();

        if (roomCode == null || roomCode.trim().isEmpty()) {
            sendError(session, "Room code is required");
            return;
        }

        if (userId == null || userId.trim().isEmpty()) {
            sendError(session, "User ID is required");
            return;
        }

        try {
            // Join the room using userId
            roomService.joinRoom(roomCode.toUpperCase(), userId, sessionId, null);
            sessionToRoom.put(sessionId, roomCode.toUpperCase());

            // Send success response
            RoomInfo roomInfo = roomService.getRoomInfo(roomCode.toUpperCase());
            WebSocketMessage response = WebSocketMessage.success("room-joined", roomCode.toUpperCase(), roomInfo);
            sendMessage(session, response);

            // Notify other peers in the room
            notifyPeersInRoom(roomCode.toUpperCase(), sessionId, "peer-connected");

            // Role assignment:
            // Query connected peers directly to ensure we have the latest count
            String upperRoomCode = roomCode.toUpperCase();
            List<PeerSession> currentPeers = roomService.getRoomPeers(upperRoomCode);
            log.info("📊 Signaling: Room {} has {} connected peers", upperRoomCode, currentPeers.size());

            if (currentPeers.size() >= 2) {
                log.info("📢 Triggering Role Assignment for room {}", upperRoomCode);
                assignRoles(upperRoomCode);
            }

            log.info("✅ User {} (Peer {}) joined room {}", userId, sessionId, roomCode);
        } catch (Exception e) {
            log.error("❌ Error joining room: {}", e.getMessage());
            sendError(session, "Failed to join room: " + e.getMessage());
        }
    }

    /**
     * Assign WebRTC roles (Initiator/Receiver) to peers in a room
     */
    private void assignRoles(String roomCode) throws IOException {
        String upperRoomCode = roomCode.toUpperCase();
        List<PeerSession> peers = roomService.getRoomPeers(upperRoomCode);
        if (peers.size() < 2)
            return;

        // Peer 0 is the oldest (initiator), Peer 1 is the newest (receiver)
        PeerSession initiator = peers.get(0);
        PeerSession receiver = peers.get(1);

        // Send role message to initiator
        WebSocketSession initSession = sessions.get(initiator.getSessionId());
        if (initSession != null && initSession.isOpen()) {
            sendMessage(initSession, WebSocketMessage.roleAssignment(roomCode, "initiator"));
            log.info("📢 Assigned INITIATOR to peer {}", initiator.getSessionId());
        }

        // Send role message to receiver
        WebSocketSession recvSession = sessions.get(receiver.getSessionId());
        if (recvSession != null && recvSession.isOpen()) {
            sendMessage(recvSession, WebSocketMessage.roleAssignment(roomCode, "receiver"));
            log.info("📢 Assigned RECEIVER to peer {}", receiver.getSessionId());
        }
    }

    /**
     * Handle WebRTC offer
     */
    private void handleOffer(WebSocketSession session, WebSocketMessage msg) throws IOException {
        String sessionId = session.getId();
        String roomCode = sessionToRoom.get(sessionId);

        if (roomCode == null) {
            sendError(session, "Not in a room");
            return;
        }

        // Forward offer to other peers in room
        WebSocketMessage offerMsg = new WebSocketMessage();
        offerMsg.setType("offer");
        offerMsg.setRoomCode(roomCode);
        offerMsg.setSessionId(sessionId);
        offerMsg.setData(msg.getData());
        offerMsg.setTimestamp(System.currentTimeMillis());

        broadcastToRoom(roomCode, sessionId, offerMsg);
        log.info("📤 Forwarded offer from {} in room {}", sessionId, roomCode);
    }

    /**
     * Handle WebRTC answer
     */
    private void handleAnswer(WebSocketSession session, WebSocketMessage msg) throws IOException {
        String sessionId = session.getId();
        String roomCode = sessionToRoom.get(sessionId);

        if (roomCode == null) {
            sendError(session, "Not in a room");
            return;
        }

        // Forward answer to other peers in room
        WebSocketMessage answerMsg = new WebSocketMessage();
        answerMsg.setType("answer");
        answerMsg.setRoomCode(roomCode);
        answerMsg.setSessionId(sessionId);
        answerMsg.setData(msg.getData());
        answerMsg.setTimestamp(System.currentTimeMillis());

        broadcastToRoom(roomCode, sessionId, answerMsg);
        log.info("📤 Forwarded answer from {} in room {}", sessionId, roomCode);
    }

    /**
     * Handle ICE candidate
     */
    private void handleIceCandidate(WebSocketSession session, WebSocketMessage msg) throws IOException {
        String sessionId = session.getId();
        String roomCode = sessionToRoom.get(sessionId);

        if (roomCode == null) {
            sendError(session, "Not in a room");
            return;
        }

        // Forward ICE candidate to other peers in room
        WebSocketMessage iceMsg = new WebSocketMessage();
        iceMsg.setType("ice-candidate");
        iceMsg.setRoomCode(roomCode);
        iceMsg.setSessionId(sessionId);
        iceMsg.setData(msg.getData());
        iceMsg.setTimestamp(System.currentTimeMillis());

        broadcastToRoom(roomCode, sessionId, iceMsg);
        log.debug("📤 Forwarded ICE candidate from {} in room {}", sessionId, roomCode);
    }

    /**
     * Handle leaving room
     */
    private void handleLeaveRoom(WebSocketSession session, WebSocketMessage msg) throws IOException {
        String sessionId = session.getId();
        String roomCode = sessionToRoom.get(sessionId);
        String userId = msg.getUserId();

        if (roomCode != null && userId != null) {
            roomService.leaveRoom(userId);
            sessionToRoom.remove(sessionId);

            // Notify other peers
            notifyPeersInRoom(roomCode, sessionId, "peer-disconnected");

            log.info("👋 User {} (Peer {}) explicitly left room {}", userId, sessionId, roomCode);
        }
    }

    /**
     * Broadcast message to all peers in room except sender
     */
    private void broadcastToRoom(String roomCode, String excludeSessionId, WebSocketMessage msg) throws IOException {
        List<PeerSession> peers = roomService.getOtherPeersInRoom(roomCode, excludeSessionId);

        for (PeerSession peer : peers) {
            WebSocketSession peerSession = sessions.get(peer.getSessionId());
            if (peerSession != null && peerSession.isOpen()) {
                sendMessage(peerSession, msg);
            }
        }
    }

    /**
     * Notify peers about connection/disconnection
     */
    private void notifyPeersInRoom(String roomCode, String sessionId, String notificationType) throws IOException {
        WebSocketMessage notification = WebSocketMessage.peerNotification(notificationType, roomCode, sessionId);
        broadcastToRoom(roomCode, sessionId, notification);
    }

    /**
     * Send message to specific session
     */
    private void sendMessage(WebSocketSession session, WebSocketMessage msg) throws IOException {
        if (session.isOpen()) {
            String json = objectMapper.writeValueAsString(msg);
            session.sendMessage(new TextMessage(json));
        }
    }

    /**
     * Send error message
     */
    private void sendError(WebSocketSession session, String errorMessage) throws IOException {
        WebSocketMessage error = WebSocketMessage.error(errorMessage);
        sendMessage(session, error);
    }
}
