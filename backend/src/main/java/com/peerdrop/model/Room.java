package com.peerdrop.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Room Entity - Represents a file sharing room
 * 
 * A room is created when a user wants to share files.
 * Other users can join using the 6-digit room code.
 * Rooms expire after a configured time period.
 */
@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @Column(length = 6, nullable = false)
    private String code;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private int maxPeers = 2;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PeerSession> peers = new ArrayList<>();

    public Room() {
    }

    public Room(String code, LocalDateTime createdAt, LocalDateTime expiresAt, boolean active, int maxPeers,
            List<PeerSession> peers) {
        this.code = code;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.active = active;
        this.maxPeers = maxPeers;
        this.peers = peers;
    }

    // Getters and Setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public int getMaxPeers() {
        return maxPeers;
    }

    public void setMaxPeers(int maxPeers) {
        this.maxPeers = maxPeers;
    }

    public List<PeerSession> getPeers() {
        return peers;
    }

    public void setPeers(List<PeerSession> peers) {
        this.peers = peers;
    }

    /**
     * Check if room has expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /**
     * Check if room is full
     */
    public boolean isFull() {
        return peers.size() >= maxPeers;
    }

    /**
     * Get number of connected peers
     */
    public int getPeerCount() {
        return (int) peers.stream()
                .filter(PeerSession::isConnected)
                .count();
    }
}
