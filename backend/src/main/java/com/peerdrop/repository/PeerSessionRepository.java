package com.peerdrop.repository;

import com.peerdrop.model.PeerSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for PeerSession entity
 * Handles database operations for peer sessions
 */
@Repository
public interface PeerSessionRepository extends JpaRepository<PeerSession, String> {

    /**
     * Find session by session ID
     */
    Optional<PeerSession> findBySessionId(String sessionId);

    /**
     * Find all connected peers in a room
     */
    @Query("SELECT p FROM PeerSession p WHERE p.room.code = ?1 AND p.connected = true ORDER BY p.connectedAt ASC")
    List<PeerSession> findConnectedPeersByRoomCode(String roomCode);

    /**
     * Count connected peers in a room
     */
    @Query("SELECT COUNT(p) FROM PeerSession p WHERE p.room.code = ?1 AND p.connected = true")
    long countConnectedPeersByRoomCode(String roomCode);

    /**
     * Find all peers in a room (connected or disconnected)
     */
    @Query("SELECT p FROM PeerSession p WHERE p.room.code = ?1")
    List<PeerSession> findAllByRoomCode(String roomCode);
}
