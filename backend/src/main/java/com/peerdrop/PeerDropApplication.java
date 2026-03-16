package com.peerdrop;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * PeerDrop - P2P File Sharing Application
 * Main application entry point
 * 
 * This is a WebSocket signaling server that enables peer-to-peer
 * file transfers using WebRTC DataChannels. The server does NOT
 * handle file data - only signaling (SDP, ICE candidates).
 */
@SpringBootApplication
@EnableScheduling  // Enable scheduled tasks for room cleanup
public class PeerDropApplication {

    public static void main(String[] args) {
        SpringApplication.run(PeerDropApplication.class, args);
        System.out.println("\n" +
            "╔═══════════════════════════════════════════════════════╗\n" +
            "║                                                       ║\n" +
            "║              🚀 PeerDrop Backend Started 🚀          ║\n" +
            "║                                                       ║\n" +
            "║  WebSocket Endpoint: ws://localhost:8080/api/ws      ║\n" +
            "║  H2 Console: http://localhost:8080/api/h2-console    ║\n" +
            "║  Health Check: http://localhost:8080/api/health      ║\n" +
            "║                                                       ║\n" +
            "║  Status: ✅ Ready for peer connections               ║\n" +
            "║                                                       ║\n" +
            "╚═══════════════════════════════════════════════════════╝\n"
        );
    }
}
