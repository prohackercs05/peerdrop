package com.peerdrop.repository;

import com.peerdrop.model.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Room entity
 * Handles database operations for rooms
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, String> {

    /**
     * Find active room by code
     */
    @Query("SELECT r FROM Room r WHERE r.code = ?1 AND r.active = true")
    Optional<Room> findActiveByCode(String code);

    /**
     * Find all expired rooms
     */
    @Query("SELECT r FROM Room r WHERE r.expiresAt < ?1")
    List<Room> findExpiredRooms(LocalDateTime now);

    /**
     * Find all active rooms
     */
    @Query("SELECT r FROM Room r WHERE r.active = true")
    List<Room> findAllActive();

    /**
     * Count active rooms
     */
    @Query("SELECT COUNT(r) FROM Room r WHERE r.active = true")
    long countActive();
}
