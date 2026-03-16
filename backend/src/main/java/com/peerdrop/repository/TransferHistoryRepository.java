package com.peerdrop.repository;

import com.peerdrop.model.TransferHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransferHistoryRepository extends JpaRepository<TransferHistory, Long> {
    List<TransferHistory> findByRoomCodeOrderByTimestampDesc(String roomCode);

    List<TransferHistory> findTop50ByOrderByTimestampDesc();
}
