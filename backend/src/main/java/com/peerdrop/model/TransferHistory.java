package com.peerdrop.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "transfer_history")
public class TransferHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fileName;
    private Long fileSize;
    private String fileType;
    private String direction; // "SENT" or "RECEIVED"
    private String roomCode;

    private LocalDateTime timestamp = LocalDateTime.now();

    private Boolean isFolder;
    private Integer filesCount;

    public TransferHistory() {
    }

    public TransferHistory(Long id, String fileName, Long fileSize, String fileType, String direction, String roomCode,
            LocalDateTime timestamp, Boolean isFolder, Integer filesCount) {
        this.id = id;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.fileType = fileType;
        this.direction = direction;
        this.roomCode = roomCode;
        this.timestamp = timestamp;
        this.isFolder = isFolder;
        this.filesCount = filesCount;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public Boolean getIsFolder() {
        return isFolder;
    }

    public void setIsFolder(Boolean isFolder) {
        this.isFolder = isFolder;
    }

    public Integer getFilesCount() {
        return filesCount;
    }

    public void setFilesCount(Integer filesCount) {
        this.filesCount = filesCount;
    }
}
