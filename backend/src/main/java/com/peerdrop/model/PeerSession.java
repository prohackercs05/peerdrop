package com.peerdrop.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "peer_sessions")
public class PeerSession {

    @Id
    @Column(length = 50, nullable = false)
    private String sessionId;

    @Column(length = 50, nullable = false)
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_code", nullable = false)
    private Room room;

    @Column(nullable = false)
    private LocalDateTime connectedAt;

    @Column
    private LocalDateTime disconnectedAt;

    @Column(nullable = false)
    private boolean connected = true;

    @Column(length = 100)
    private String peerName;

    public PeerSession() {
    }

    public PeerSession(String userId, String sessionId, Room room, LocalDateTime connectedAt,
            LocalDateTime disconnectedAt,
            boolean connected, String peerName) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.room = room;
        this.connectedAt = connectedAt;
        this.disconnectedAt = disconnectedAt;
        this.connected = connected;
        this.peerName = peerName;
    }

    // Getters and Setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public Room getRoom() {
        return room;
    }

    public void setRoom(Room room) {
        this.room = room;
    }

    public LocalDateTime getConnectedAt() {
        return connectedAt;
    }

    public void setConnectedAt(LocalDateTime connectedAt) {
        this.connectedAt = connectedAt;
    }

    public LocalDateTime getDisconnectedAt() {
        return disconnectedAt;
    }

    public void setDisconnectedAt(LocalDateTime disconnectedAt) {
        this.disconnectedAt = disconnectedAt;
    }

    public boolean isConnectedValue() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
    }

    public String getPeerName() {
        return peerName;
    }

    public void setPeerName(String peerName) {
        this.peerName = peerName;
    }

    /**
     * Mark peer as disconnected
     */
    public void disconnect() {
        this.connected = false;
        this.disconnectedAt = LocalDateTime.now();
    }

    /**
     * Check if peer is currently connected
     */
    public boolean isConnected() {
        return connected && disconnectedAt == null;
    }
}
