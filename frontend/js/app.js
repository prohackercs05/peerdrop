/**
 * PeerDrop Main Application
 * 
 * Orchestrates all components and manages application state
 */

const App = {
    currentRoom: null,
    isInitiator: false,
    userId: null,
    STORAGE_KEY: 'peerdrop_room_session',
    USER_ID_KEY: 'peerdrop_user_id',
    
    /**
     * Initialize application
     */
    async init() {
        Utils.log('🚀 Starting PeerDrop...');
        
        // Check browser support
        const support = Utils.checkBrowserSupport();
        if (!support.supported) {
            this.showBrowserNotSupported();
            return;
        }
        
        // Initialize User ID
        this.userId = localStorage.getItem(this.USER_ID_KEY);
        if (!this.userId) {
            this.userId = Utils.generateId();
            localStorage.setItem(this.USER_ID_KEY, this.userId);
        }
        Utils.log('👤 User ID:', this.userId);

        // Initialize UI
        UI.init();
        
        // Initialize WebSocket
        this.setupWebSocket();
        WebSocketManager.init();
        
        // Handle persistence
        this.checkPersistedSession();
        
        Utils.log('✅ PeerDrop initialized successfully');
    },
    
    /**
     * Setup WebSocket callbacks
     */
    setupWebSocket() {
        // Room created
        WebSocketManager.onRoomCreated = (roomCode, data) => {
            this.handleRoomCreated(roomCode, data);
        };
        
        // Room joined
        WebSocketManager.onRoomJoined = (roomCode, data) => {
            this.handleRoomJoined(roomCode, data);
        };
        
        // Peer connected
        WebSocketManager.onPeerConnected = (sessionId) => {
            this.handlePeerConnected(sessionId);
        };
        
        // Peer disconnected
        WebSocketManager.onPeerDisconnected = (sessionId) => {
            this.handlePeerDisconnected(sessionId);
        };
        
        // WebRTC signaling
        WebSocketManager.onOffer = (offer, sessionId) => {
            this.handleOffer(offer, sessionId);
        };
        
        WebSocketManager.onAnswer = (answer, sessionId) => {
            this.handleAnswer(answer, sessionId);
        };
        
        WebSocketManager.onIceCandidate = (candidate, sessionId) => {
            this.handleIceCandidate(candidate, sessionId);
        };
        
        WebSocketManager.onRoleAssignment = (role) => {
            this.handleRoleAssignment(role);
        };
        
        // Connection events
        WebSocketManager.onConnected = () => {
            Utils.log('✅ Connected to signaling server');
            UI.updateConnectionStatus('connected', 'NETWORK ONLINE');
            
            // Auto-rejoin if we were in a room
            if (this.currentRoom) {
                Utils.log('🔄 Re-joining room after socket reconnect:', this.currentRoom);
                WebSocketManager.joinRoom(this.currentRoom);
            }
        };
        
        WebSocketManager.onDisconnected = () => {
            Utils.log('🔌 Disconnected from signaling server');
            UI.updateConnectionStatus('disconnected', 'NETWORK OFFLINE');
        };
        
        WebSocketManager.onError = (error) => {
            Utils.log('❌ WebSocket error:', error);
            // If room not found while attempting to rejoin
            if (error && (error.includes('Room not found') || error.includes('Invalid room'))) {
                this.clearSession();
                this.currentRoom = null;
                this.isInitiator = false;
                UI.showScreen('welcome');
            }
        };
    },
    
    /**
     * Create a new room
     */
    async createRoom() {
        Utils.log('📝 Requesting room creation...');
        WebSocketManager.createRoom();
    },
    
    async joinRoom(roomCode) {
        Utils.log('🔗 Requesting to join room:', roomCode);
        WebSocketManager.joinRoom(roomCode);
    },
    
    /**
     * Leave current room
     */
    leaveRoom() {
        Utils.log('👋 Leaving room...');
        
        // Notify server
        WebSocketManager.leaveRoom();
        
        // Close WebRTC connection
        WebRTCManager.close();
        
        // Reset file transfer
        FileTransferManager.reset();
        
        // Clear persisted session
        this.clearSession();
        
        // Reset UI
        UI.reset();
        UI.setRoomNavVisible(false);
        
        // Reset state
        this.currentRoom = null;
        this.isInitiator = false;
        
        UI.showToast('Left room', 'info');
    },
    
    /**
     * Session Persistence Logic
     */
    saveSession() {
        if (this.currentRoom) {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                roomId: this.currentRoom,
                userId: this.userId,
                isInitiator: this.isInitiator
            }));
        }
    },

    clearSession() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    checkPersistedSession() {
        const savedSession = localStorage.getItem(this.STORAGE_KEY);
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                if (session && session.roomId) {
                    Utils.log('📂 Found persisted session:', session.roomId);
                    
                    this.currentRoom = session.roomId;
                    this.isInitiator = session.isInitiator;
                    
                    // Show room UI immediately
                    UI.displayRoomCode(this.currentRoom);
                    UI.setRoomNavVisible(true);
                    UI.showScreen('room');
                    UI.updatePeerStatus('connecting', 'Reconnecting...');
                    
                    // Attempt to rejoin when WebSocket is ready
                    if (WebSocketManager.connected) {
                        this.rejoinRoom();
                    } else {
                        const originalOnConnected = WebSocketManager.onConnected;
                        WebSocketManager.onConnected = () => {
                            if (originalOnConnected) originalOnConnected();
                            this.rejoinRoom();
                        };
                    }
                    return true;
                }
            } catch (e) {
                this.clearSession();
            }
        }
        return false;
    },

    async rejoinRoom() {
        Utils.log('🔗 Re-joining room:', this.currentRoom);
        
        // Update UI status
        UI.updatePeerStatus('connecting', 'Reconnecting...');
        
        // Send join request (includes persistent userId)
        WebSocketManager.joinRoom(this.currentRoom);
    },
    
    /**
     * Handle room created event
     * @param {string} roomCode - Created room code
     * @param {object} data - Room data
     */
    async handleRoomCreated(roomCode, data) {
        Utils.log('✅ Room created:', roomCode);
        
        this.currentRoom = roomCode;
        this.saveSession();
        
        // Display room code
        UI.displayRoomCode(roomCode);
        UI.setRoomNavVisible(true);
        UI.updatePeerStatus('waiting', 'Waiting for peer...');
        UI.showToast(`Room created: ${roomCode}`, 'success');
    },
    
    /**
     * Handle room joined event
     * @param {string} roomCode - Joined room code
     * @param {object} data - Room data
     */
    async handleRoomJoined(roomCode, data) {
        Utils.log('✅ Room joined:', roomCode, data);
        
        this.currentRoom = roomCode;
        this.saveSession();
        
        // Display room code
        UI.displayRoomCode(roomCode);
        UI.setRoomNavVisible(true);
        
        // Check if we should wait or connect
        if (data && data.peerCount > 1) {
            UI.updatePeerStatus('connecting', 'Waiting for handshake...');
        } else {
            UI.updatePeerStatus('waiting', 'Waiting for peer...');
        }
        
        UI.showToast(`Joined room: ${roomCode}`, 'success');
        
        // If there's already a peer in the room, they will send an offer
        // We just wait for it
    },
    
    /**
     * Handle role assignment from server
     * @param {string} role - 'initiator' or 'receiver'
     */
    async handleRoleAssignment(role) {
        Utils.log(`🎭 Assigned role: ${role.toUpperCase()}`);
        UI.showToast(`Handshake started...`, 'info');
        
        this.isInitiator = (role === 'initiator');
        this.saveSession();

        // Show connecting status immediately
        UI.updatePeerStatus('connecting', this.isInitiator ? 'Initializing...' : 'Awaiting offer...');

        // Initialize WebRTC with assigned role
        await WebRTCManager.init(this.isInitiator);
        
        // Initialize file transfer
        FileTransferManager.init();

        if (this.isInitiator) {
            Utils.log('📤 I am initiator. Creating offer...');
            UI.updatePeerStatus('connecting', 'Creating offer...');
            await WebRTCManager.createOffer();
        } else {
            Utils.log('📥 I am receiver. Waiting for offer...');
            // Status already set to 'Awaiting offer...' above
        }
    },
    
    /**
     * Handle peer connected event
     * @param {string} sessionId - Peer session ID
     */
    async handlePeerConnected(sessionId) {
        Utils.log('👤 Peer connected:', sessionId);
        UI.showToast('Peer joined the room!', 'success');
    },
    
    /**
     * Handle peer disconnected event
     * @param {string} sessionId - Peer session ID
     */
    handlePeerDisconnected(sessionId) {
        Utils.log('👋 Peer disconnected:', sessionId);
        
        UI.showToast('Peer left the room', 'info');
        UI.updatePeerStatus('disconnected', 'Waiting...');
        
        // Close WebRTC connection
        WebRTCManager.close();
        
        // Reset file transfer
        FileTransferManager.resetSendState();
    },
    
    /**
     * Handle WebRTC offer
     * @param {RTCSessionDescriptionInit} offer - SDP offer
     * @param {string} sessionId - Sender session ID
     */
    async handleOffer(offer, sessionId) {
        Utils.log('📥 Received offer from peer');
        UI.updatePeerStatus('connecting', 'Received offer...');
        
        try {
            await WebRTCManager.handleOffer(offer);
        } catch (error) {
            Utils.log('❌ Error handling offer:', error);
            UI.showToast('Failed to establish connection', 'error');
            UI.updatePeerStatus('disconnected', 'Handshake failed');
        }
    },
    
    /**
     * Handle WebRTC answer
     * @param {RTCSessionDescriptionInit} answer - SDP answer
     * @param {string} sessionId - Sender session ID
     */
    async handleAnswer(answer, sessionId) {
        Utils.log('📥 Received answer from peer');
        
        try {
            await WebRTCManager.handleAnswer(answer);
        } catch (error) {
            Utils.log('❌ Error handling answer:', error);
            UI.showToast('Failed to establish connection', 'error');
        }
    },
    
    /**
     * Handle ICE candidate
     * @param {RTCIceCandidateInit} candidate - ICE candidate
     * @param {string} sessionId - Sender session ID
     */
    async handleIceCandidate(candidate, sessionId) {
        Utils.log('🧊 Received ICE candidate from peer');
        
        try {
            await WebRTCManager.addIceCandidate(candidate);
        } catch (error) {
            Utils.log('❌ Error adding ICE candidate:', error);
        }
    },
    
    /**
     * Send a file
     * @param {File} file - File to send
     */
    async sendFile(file) {
        if (!WebRTCManager.connected) {
            UI.showToast('Please wait for peer to connect', 'error');
            return;
        }
        
        try {
            await FileTransferManager.sendFile(file);
        } catch (error) {
            Utils.log('❌ Error sending file:', error);
            UI.showToast('Failed to send file', 'error');
        }
    },
    
    /**
     * Show browser not supported message
     */
    showBrowserNotSupported() {
        const support = Utils.checkBrowserSupport();
        let message = 'Your browser does not support required features:\n\n';
        
        if (!support.webrtc) message += '❌ WebRTC\n';
        if (!support.websocket) message += '❌ WebSocket\n';
        if (!support.fileApi) message += '❌ File API\n';
        
        message += '\nPlease use a modern browser like Chrome, Firefox, or Edge.';
        
        alert(message);
        
        document.body.innerHTML = `
            <div style="
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                text-align: center;
                padding: 2rem;
                background: #0a0e1a;
                color: white;
                font-family: 'Inter', sans-serif;
            ">
                <div>
                    <h1 style="font-size: 3rem; margin-bottom: 1rem;">⚠️</h1>
                    <h2 style="margin-bottom: 1rem;">Browser Not Supported</h2>
                    <p style="color: #a0aec0; max-width: 500px;">
                        Your browser does not support the required features for PeerDrop.
                        Please use a modern browser like Chrome, Firefox, or Edge.
                    </p>
                </div>
            </div>
        `;
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Handle page unload removed to prevent session loss on refresh

// Expose App to window for debugging
if (CONFIG.DEBUG) {
    window.PeerDrop = {
        App,
        UI,
        WebSocketManager,
        WebRTCManager,
        FileTransferManager,
        Utils,
        CONFIG
    };
    console.log('🐛 Debug mode enabled. Access components via window.PeerDrop');
}
