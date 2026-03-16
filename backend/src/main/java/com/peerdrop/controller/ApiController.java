package com.peerdrop.controller;

import com.peerdrop.dto.RoomInfo;
import com.peerdrop.service.RoomService;
import com.peerdrop.repository.TransferHistoryRepository;
import com.peerdrop.model.TransferHistory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST API Controller
 * 
 * Provides HTTP endpoints for health checks and room information.
 */
@RestController
@RequestMapping
public class ApiController {

    private final RoomService roomService;
    private final TransferHistoryRepository historyRepository;

    public ApiController(RoomService roomService, TransferHistoryRepository historyRepository) {
        this.roomService = roomService;
        this.historyRepository = historyRepository;
    }

    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "service", "PeerDrop Signaling Server",
                "version", "1.0.0",
                "activeRooms", roomService.getActiveRoomCount(),
                "timestamp", System.currentTimeMillis()));
    }

    /**
     * Get room information
     */
    @GetMapping("/room/{code}")
    public ResponseEntity<?> getRoomInfo(@PathVariable String code) {
        try {
            RoomInfo roomInfo = roomService.getRoomInfo(code.toUpperCase());
            return ResponseEntity.ok(roomInfo);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", e.getMessage()));
        }
    }

    /**
     * Save transfer history
     */
    @PostMapping("/history")
    public ResponseEntity<?> saveHistory(@RequestBody TransferHistory history) {
        try {
            return ResponseEntity.ok(historyRepository.save(history));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get global transfer history
     */
    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        return ResponseEntity.ok(historyRepository.findTop50ByOrderByTimestampDesc());
    }

    /**
     * Get server statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(Map.of(
                "activeRooms", roomService.getActiveRoomCount(),
                "timestamp", System.currentTimeMillis()));
    }
}
