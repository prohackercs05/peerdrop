/**
 * PeerDrop WebSocket Manager
 * 
 * Handles WebSocket connection to signaling server
 */

const WebSocketManager = {
    ws: null,
    connected: false,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    reconnectDelay: 2000,
    
    // Callbacks
    onConnected: null,
    onDisconnected: null,
    onRoomCreated: null,
    onRoomJoined: null,
    onPeerConnected: null,
    onPeerDisconnected: null,
    onOffer: null,
    onAnswer: null,
    onIceCandidate: null,
    onRoleAssignment: null,
    onError: null,
    
    /**
     * Initialize WebSocket connection
     */
    async init() {
        Utils.log('🔌 Initializing WebSocket connection...');
        UI.updateConnectionStatus('connecting', 'CONNECTING...');
        
        // Optional: Check health endpoint first
        await this.checkServerHealth();
        
        this.connect();
    },

    /**
     * Check if the backend server is reachable via HTTP
     */
    async checkServerHealth() {
        try {
            const healthUrl = CONFIG.WS_URL.replace('ws://', 'http://').replace('wss://', 'https://').replace('/ws', '/health');
            Utils.log('🩺 Checking server health:', healthUrl);
            
            const response = await fetch(healthUrl, { mode: 'cors' });
            if (response.ok) {
                Utils.log('✅ Server health check passed');
                return true;
            }
        } catch (error) {
            Utils.log('⚠️ Server health check failed (expected if backend not running or CORS blocked):', error);
        }
        return false;
    },
    
    /**
     * Connect to WebSocket server
     */
    connect() {
        try {
            UI.updateConnectionStatus('connecting', 'CONNECTING...');
            this.ws = new WebSocket(CONFIG.WS_URL);
            
            this.ws.onopen = () => this.handleOpen();
            this.ws.onmessage = (event) => this.handleMessage(event);
            this.ws.onerror = (error) => this.handleError(error);
            this.ws.onclose = () => this.handleClose();
            
        } catch (error) {
            Utils.log('❌ WebSocket connection error:', error);
            this.handleError(error);
        }
    },
    
    /**
     * Handle WebSocket open
     */
    handleOpen() {
        Utils.log('✅ WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        UI.updateConnectionStatus('connected', 'SERVER CONNECTED');
        
        if (this.onConnected) {
            this.onConnected();
        }
    },
    
    /**
     * Handle incoming WebSocket message
     * @param {MessageEvent} event - WebSocket message event
     */
    handleMessage(event) {
        try {
            const message = JSON.parse(event.data);
            Utils.log('📨 Received message:', message);
            
            switch (message.type) {
                case 'connected':
                    // Initial connection confirmation
                    break;
                    
                case 'room-created':
                    if (this.onRoomCreated) {
                        this.onRoomCreated(message.roomCode, message.data);
                    }
                    break;
                    
                case 'room-joined':
                    if (this.onRoomJoined) {
                        this.onRoomJoined(message.roomCode, message.data);
                    }
                    break;
                    
                case 'peer-connected':
                    if (this.onPeerConnected) {
                        this.onPeerConnected(message.sessionId);
                    }
                    break;
                    
                case 'peer-disconnected':
                    if (this.onPeerDisconnected) {
                        this.onPeerDisconnected(message.sessionId);
                    }
                    break;
                    
                case 'offer':
                    if (this.onOffer) {
                        this.onOffer(message.data, message.sessionId);
                    }
                    break;
                    
                case 'answer':
                    if (this.onAnswer) {
                        this.onAnswer(message.data, message.sessionId);
                    }
                    break;
                    
                case 'ice-candidate':
                    if (this.onIceCandidate) {
                        this.onIceCandidate(message.data, message.sessionId);
                    }
                    break;
                    
                case 'role':
                    if (this.onRoleAssignment) {
                        this.onRoleAssignment(message.role);
                    }
                    break;
                    
                case 'error':
                    Utils.log('❌ Server error:', message.error);
                    UI.showToast(message.error, 'error');
                    if (this.onError) {
                        this.onError(message.error);
                    }
                    break;
                    
                default:
                    Utils.log('⚠️ Unknown message type:', message.type);
            }
        } catch (error) {
            Utils.log('❌ Error parsing message:', error);
        }
    },
    
    /**
     * Handle WebSocket error
     * @param {Event} error - Error event
     */
    handleError(error) {
        Utils.log('❌ WebSocket error:', error);
        UI.updateConnectionStatus('disconnected', 'SERVER ERROR');
        
        if (this.onError) {
            this.onError(error);
        }
    },
    
    /**
     * Handle WebSocket close
     */
    handleClose() {
        Utils.log('🔌 WebSocket disconnected');
        this.connected = false;
        
        UI.updateConnectionStatus('disconnected', 'SERVER OFFLINE');
        
        if (this.onDisconnected) {
            this.onDisconnected();
        }
        
        // Attempt reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            Utils.log(`🔄 Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            UI.updateConnectionStatus('connecting', 'Retrying...');
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            UI.showToast('Failed to connect to server. Please refresh the page.', 'error');
        }
    },
    
    /**
     * Send message to server
     * @param {object} message - Message to send
     */
    send(message) {
        if (!this.connected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
            Utils.log('❌ Cannot send message: WebSocket not connected');
            return false;
        }
        
        try {
            this.ws.send(JSON.stringify(message));
            Utils.log('📤 Sent message:', message);
            return true;
        } catch (error) {
            Utils.log('❌ Error sending message:', error);
            return false;
        }
    },
    
    /**
     * Create a room
     */
    createRoom() {
        return this.send({ 
            type: 'create-room',
            userId: App.userId
        });
    },
    
    /**
     * Join a room
     * @param {string} roomCode - Room code to join
     */
    joinRoom(roomCode) {
        return this.send({
            type: 'join-room',
            roomCode: roomCode,
            userId: App.userId
        });
    },
    
    /**
     * Send WebRTC offer
     * @param {RTCSessionDescriptionInit} offer - SDP offer
     */
    sendOffer(offer) {
        return this.send({
            type: 'offer',
            data: offer
        });
    },
    
    /**
     * Send WebRTC answer
     * @param {RTCSessionDescriptionInit} answer - SDP answer
     */
    sendAnswer(answer) {
        return this.send({
            type: 'answer',
            data: answer
        });
    },
    
    /**
     * Send ICE candidate
     * @param {RTCIceCandidate} candidate - ICE candidate
     */
    sendIceCandidate(candidate) {
        return this.send({
            type: 'ice-candidate',
            data: {
                candidate: candidate.candidate,
                sdpMid: candidate.sdpMid,
                sdpMLineIndex: candidate.sdpMLineIndex
            }
        });
    },
    
    /**
     * Leave room
     */
    leaveRoom() {
        return this.send({ 
            type: 'leave-room',
            userId: App.userId
        });
    },
    
    /**
     * Close WebSocket connection
     */
    close() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.connected = false;
        }
    }
};
