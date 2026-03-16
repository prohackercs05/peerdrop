package com.peerdrop.service;

import com.peerdrop.dto.RoomInfo;
import com.peerdrop.model.PeerSession;
import com.peerdrop.model.Room;
import com.peerdrop.repository.PeerSessionRepository;
import com.peerdrop.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

/**
 * Room Service
 * 
 * Manages room creation, joining, and cleanup.
 * Generates unique 6-digit room codes.
 */
@Service
public class RoomService {

    private static final Logger log = LoggerFactory.getLogger(RoomService.class);
    private final RoomRepository roomRepository;
    private final PeerSessionRepository peerSessionRepository;

    public RoomService(RoomRepository roomRepository, PeerSessionRepository peerSessionRepository) {
        this.roomRepository = roomRepository;
        this.peerSessionRepository = peerSessionRepository;
    }

    @Value("${peerdrop.room.code-length:6}")
    private int codeLength;

    @Value("${peerdrop.room.expiry-minutes:60}")
    private int expiryMinutes;

    @Value("${peerdrop.room.max-peers-per-room:2}")
    private int maxPeersPerRoom;

    private static final String CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    /**
     * Create a new room with unique 6-digit code
     */
    @Transactional
    public Room createRoom() {
        String code = generateUniqueCode();

        Room room = new Room();
        room.setCode(code);
        room.setCreatedAt(LocalDateTime.now());
        room.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
        room.setActive(true);
        room.setMaxPeers(maxPeersPerRoom);

        Room savedRoom = roomRepository.save(room);
        log.info("✅ Created room: {} (expires in {} minutes)", code, expiryMinutes);

        return savedRoom;
    }

    /**
     * Find room by code
     */
    public Optional<Room> findRoomByCode(String code) {
        return roomRepository.findActiveByCode(code.toUpperCase());
    }

    /**
     * Join a room
     */
    @Transactional
    public PeerSession joinRoom(String roomCode, String userId, String sessionId, String peerName) {
        Room room = roomRepository.findActiveByCode(roomCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomCode));

        if (room.isExpired()) {
            room.setActive(false);
            roomRepository.save(room);
            throw new RuntimeException("Room has expired: " + roomCode);
        }

        // Check if THIS specific session already exists
        Optional<PeerSession> existingSession = peerSessionRepository.findById(sessionId);
        if (existingSession.isPresent()) {
            PeerSession peer = existingSession.get();
            log.info("🔄 Session {} rejoining room {}", sessionId, roomCode);
            peer.setConnected(true);
            peer.setDisconnectedAt(null);
            return peerSessionRepository.save(peer);
        }

        // Only check "full" for NEW sessions
        if (room.isFull()) {
            throw new RuntimeException("Room is full: " + roomCode);
        }

        PeerSession peer = new PeerSession();
        peer.setUserId(userId);
        peer.setSessionId(sessionId);
        peer.setRoom(room);
        peer.setConnectedAt(LocalDateTime.now());
        peer.setConnected(true);
        peer.setPeerName(peerName);

        PeerSession savedPeer = peerSessionRepository.saveAndFlush(peer);
        log.info("✅ Peer {} (User {}) joined room {}", sessionId, userId, roomCode);

        return savedPeer;
    }

    /**
     * Leave a room
     */
    @Transactional
    public void disconnectPeer(String sessionId) {
        Optional<PeerSession> peerOpt = peerSessionRepository.findBySessionId(sessionId);

        if (peerOpt.isPresent()) {
            PeerSession peer = peerOpt.get();
            peer.setConnected(false);
            peer.setDisconnectedAt(LocalDateTime.now());
            peerSessionRepository.save(peer);
            log.info("🔌 Peer {} temporarily disconnected from room {}", sessionId, peer.getRoom().getCode());
        }
    }

    @Transactional
    public void leaveRoom(String userId) {
        Optional<PeerSession> peerOpt = peerSessionRepository.findById(userId);

        if (peerOpt.isPresent()) {
            PeerSession peer = peerOpt.get();
            peerSessionRepository.delete(peer);
            log.info("👋 User {} explicitly left room {}", userId, peer.getRoom().getCode());
        }
    }

    /**
     * Get all connected peers in a room (excluding self)
     */
    public List<PeerSession> getOtherPeersInRoom(String roomCode, String excludeSessionId) {
        return peerSessionRepository.findConnectedPeersByRoomCode(roomCode)
                .stream()
                .filter(peer -> !peer.getSessionId().equals(excludeSessionId))
                .toList();
    }

    /**
     * Get all connected peers in a room
     */
    public List<PeerSession> getRoomPeers(String roomCode) {
        return peerSessionRepository.findConnectedPeersByRoomCode(roomCode);
    }

    /**
     * Get room info
     */
    public RoomInfo getRoomInfo(String roomCode) {
        Room room = roomRepository.findActiveByCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Room not found: " + roomCode));

        RoomInfo info = new RoomInfo();
        info.setCode(room.getCode());
        info.setPeerCount(room.getPeerCount());
        info.setMaxPeers(room.getMaxPeers());
        info.setFull(room.isFull());
        info.setCreatedAt(room.getCreatedAt().toEpochSecond(java.time.ZoneOffset.UTC));
        info.setExpiresAt(room.getExpiresAt().toEpochSecond(java.time.ZoneOffset.UTC));

        return info;
    }

    /**
     * Generate unique 6-digit room code
     */
    private String generateUniqueCode() {
        Random random = new Random();
        String code;
        int attempts = 0;

        do {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < codeLength; i++) {
                sb.append(CODE_CHARS.charAt(random.nextInt(CODE_CHARS.length())));
            }
            code = sb.toString();
            attempts++;

            if (attempts > 100) {
                throw new RuntimeException("Failed to generate unique room code after 100 attempts");
            }
        } while (roomRepository.findById(code).isPresent());

        return code;
    }

    /**
     * Cleanup expired rooms (runs every 5 minutes)
     */
    @Scheduled(fixedRate = 300000)
    @Transactional
    public void cleanupExpiredRooms() {
        List<Room> expiredRooms = roomRepository.findExpiredRooms(LocalDateTime.now());

        if (!expiredRooms.isEmpty()) {
            expiredRooms.forEach(room -> room.setActive(false));
            roomRepository.saveAll(expiredRooms);
            log.info("🧹 Cleaned up {} expired rooms", expiredRooms.size());
        }
    }

    /**
     * Get active room count
     */
    public long getActiveRoomCount() {
        return roomRepository.countActive();
    }
}
