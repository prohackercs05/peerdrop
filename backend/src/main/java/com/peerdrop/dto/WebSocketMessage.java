package com.peerdrop.dto;

public class WebSocketMessage {

    private String type;
    private String roomCode;
    private String userId;
    private String sessionId;
    private String targetSessionId;
    private String role;
    private Object data;
    private String error;
    private Long timestamp;

    public WebSocketMessage() {
    }

    public WebSocketMessage(String type, String roomCode, String userId, String sessionId, String targetSessionId,
            Object data,
            String error, Long timestamp) {
        this.type = type;
        this.roomCode = roomCode;
        this.userId = userId;
        this.sessionId = sessionId;
        this.targetSessionId = targetSessionId;
        this.data = data;
        this.error = error;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

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

    public String getTargetSessionId() {
        return targetSessionId;
    }

    public void setTargetSessionId(String targetSessionId) {
        this.targetSessionId = targetSessionId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public Object getData() {
        return data;
    }

    public void setData(Object data) {
        this.data = data;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    /**
     * Create a success response
     */
    public static WebSocketMessage success(String type, String roomCode, Object data) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(type);
        msg.setRoomCode(roomCode);
        msg.setData(data);
        msg.setTimestamp(System.currentTimeMillis());
        return msg;
    }

    /**
     * Create an error response
     */
    public static WebSocketMessage error(String errorMessage) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType("error");
        msg.setError(errorMessage);
        msg.setTimestamp(System.currentTimeMillis());
        return msg;
    }

    /**
     * Create a peer notification
     */
    public static WebSocketMessage peerNotification(String type, String roomCode, String sessionId) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType(type);
        msg.setRoomCode(roomCode);
        msg.setSessionId(sessionId);
        msg.setTimestamp(System.currentTimeMillis());
        return msg;
    }

    /**
     * Create a role assignment message
     */
    public static WebSocketMessage roleAssignment(String roomCode, String role) {
        WebSocketMessage msg = new WebSocketMessage();
        msg.setType("role");
        msg.setRoomCode(roomCode);
        msg.setRole(role);
        msg.setTimestamp(System.currentTimeMillis());
        return msg;
    }
}
