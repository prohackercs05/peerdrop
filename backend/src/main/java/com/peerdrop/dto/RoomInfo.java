package com.peerdrop.dto;

public class RoomInfo {

    private String code;
    private int peerCount;
    private int maxPeers;
    private boolean isFull;
    private long createdAt;
    private long expiresAt;

    public RoomInfo() {
    }

    public RoomInfo(String code, int peerCount, int maxPeers, boolean isFull, long createdAt, long expiresAt) {
        this.code = code;
        this.peerCount = peerCount;
        this.maxPeers = maxPeers;
        this.isFull = isFull;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
    }

    // Getters and Setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public int getPeerCount() {
        return peerCount;
    }

    public void setPeerCount(int peerCount) {
        this.peerCount = peerCount;
    }

    public int getMaxPeers() {
        return maxPeers;
    }

    public void setMaxPeers(int maxPeers) {
        this.maxPeers = maxPeers;
    }

    public boolean isFull() {
        return isFull;
    }

    public void setFull(boolean isFull) {
        this.isFull = isFull;
    }

    public long getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }

    public long getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(long expiresAt) {
        this.expiresAt = expiresAt;
    }
}
