const WebRTCManager = {
    peerConnection: null,
    dataChannel: null,
    isInitiator: false,
    connected: false,
    iceCandidateQueue: [],
    
    // Callbacks
    onDataChannelOpen: null,
    onDataChannelClose: null,
    onDataChannelMessage: null,
    onConnectionStateChange: null,
    
    /**
     * Initialize WebRTC
     * @param {boolean} initiator - Whether this peer initiates the connection
     */
    async init(initiator = false) {
        Utils.log('🔗 Initializing WebRTC...', { initiator });
        
        // Cleanup previous connection if any
        this.close();
        
        this.isInitiator = initiator;
        this.iceCandidateQueue = [];
        this.connected = false;
        
        try {
            // Create peer connection
            this.peerConnection = new RTCPeerConnection(CONFIG.WEBRTC);
            
            // Setup event listeners
            this.peerConnection.onicecandidate = (event) => this.handleIceCandidate(event);
            this.peerConnection.onconnectionstatechange = () => this.handleConnectionStateChange();
            this.peerConnection.oniceconnectionstatechange = () => this.handleIceConnectionStateChange();
            this.peerConnection.onicegatheringstatechange = () => {
                Utils.log('🧊 ICE Gathering State:', this.peerConnection.iceGatheringState);
            };
            
            if (initiator) {
                // Initiator creates the data channel
                this.createDataChannel();
            } else {
                // Receiver waits for data channel
                this.peerConnection.ondatachannel = (event) => {
                    Utils.log('📡 Data channel received from initiator');
                    this.dataChannel = event.channel;
                    this.setupDataChannel();
                };
            }
            
            Utils.log('✅ WebRTC initialized and waiting for signaling');
            
        } catch (error) {
            Utils.log('❌ Error initializing WebRTC:', error);
            throw error;
        }
    },
    
    /**
     * Create data channel (initiator only)
     */
    createDataChannel() {
        if (!this.peerConnection) return;
        
        Utils.log('📡 Creating data channel (initiator)');
        
        // Data channel options for reliable file transfer
        const options = {
            ordered: true
        };
        
        this.dataChannel = this.peerConnection.createDataChannel('fileTransfer', options);
        this.setupDataChannel();
    },
    
    /**
     * Setup data channel event listeners
     */
    setupDataChannel() {
        if (!this.dataChannel) return;
        
        this.dataChannel.binaryType = 'arraybuffer';
        
        // Set threshold for onbufferedamountlow event
        this.dataChannel.bufferedAmountLowThreshold = CONFIG.FILE_TRANSFER.BUFFER_THRESHOLD / 2;
        
        this.dataChannel.onopen = () => {
            Utils.log('✅ Data channel is OPEN');
            
            this.connected = true;
            UI.updatePeerStatus('connected', 'PEER CONNECTED');
            UI.showToast('Ready for file transfer!', 'success');
            
            if (this.onDataChannelOpen) {
                this.onDataChannelOpen();
            }
        };
        
        this.dataChannel.onclose = () => {
            Utils.log('🔌 Data channel is CLOSED');
            this.connected = false;
            UI.updatePeerStatus('disconnected', 'Waiting...');
            
            if (this.onDataChannelClose) {
                this.onDataChannelClose();
            }
        };
        
        this.dataChannel.onerror = (error) => {
            Utils.log('❌ Data channel error:', error);
            this.connected = false;
        };
        
        this.dataChannel.onmessage = (event) => {
            if (this.onDataChannelMessage) {
                this.onDataChannelMessage(event.data);
            }
        };
    },
    
    /**
     * Create and send offer (Initiator)
     */
    async createOffer() {
        if (!this.peerConnection) return;
        
        try {
            Utils.log('📤 Step 1: Creating Offer...');
            const offer = await this.peerConnection.createOffer();
            
            Utils.log('📤 Step 2: Setting Local Description...');
            await this.peerConnection.setLocalDescription(offer);
            
            Utils.log('✅ Offer ready, sending to signaling server');
            WebSocketManager.sendOffer(offer);
            
        } catch (error) {
            Utils.log('❌ Error in createOffer:', error);
            UI.showToast('Handshake failed. Refresh and try again.', 'error');
        }
    },
    
    /**
     * Handle received offer (Receiver)
     */
    async handleOffer(offer) {
        if (!this.peerConnection) {
            Utils.log('⚠️ PeerConnection not initialized during handleOffer. Initializing as receiver...');
            await this.init(false);
        }
        
        try {
            Utils.log('📥 Step 1: Received Offer, setting Remote Description...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Process queued ICE candidates
            await this.processQueuedIceCandidates();
            
            Utils.log('📥 Step 2: Creating Answer...');
            const answer = await this.peerConnection.createAnswer();
            
            Utils.log('📥 Step 3: Setting Local Description...');
            await this.peerConnection.setLocalDescription(answer);
            
            Utils.log('✅ Answer ready, sending to signaling server');
            WebSocketManager.sendAnswer(answer);
            
        } catch (error) {
            Utils.log('❌ Error in handleOffer:', error);
        }
    },
    
    /**
     * Handle received answer (Initiator)
     */
    async handleAnswer(answer) {
        if (!this.peerConnection) return;
        
        try {
            Utils.log('📥 Received Answer, setting Remote Description...');
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            
            // Process queued ICE candidates
            await this.processQueuedIceCandidates();
            
        } catch (error) {
            Utils.log('❌ Error in handleAnswer:', error);
        }
    },
    
    /**
     * Track and send local ICE candidates
     */
    handleIceCandidate(event) {
        if (event.candidate) {
            Utils.log('🧊 Local ICE candidate generated');
            WebSocketManager.sendIceCandidate(event.candidate);
        } else {
            Utils.log('🧊 All local ICE candidates sent');
        }
    },
    
    /**
     * Receive ICE candidate from peer
     */
    async addIceCandidate(candidate) {
        if (!this.peerConnection || !this.peerConnection.remoteDescription) {
            Utils.log('🧊 Candidate received but remote description not set. Queuing...');
            this.iceCandidateQueue.push(candidate);
            return;
        }
        
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            Utils.log('✅ Remote ICE candidate added');
        } catch (error) {
            Utils.log('❌ Error adding remote ICE candidate:', error);
        }
    },
    
    /**
     * Process internal queue of candidates
     */
    async processQueuedIceCandidates() {
        if (this.iceCandidateQueue.length === 0) return;
        
        Utils.log(`🧊 Processing ${this.iceCandidateQueue.length} queued ICE candidates...`);
        for (const candidate of this.iceCandidateQueue) {
            try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                Utils.log('❌ Error processing queued candidate:', error);
            }
        }
        this.iceCandidateQueue = [];
    },
    
    /**
     * Handle global connection state changes
     */
    handleConnectionStateChange() {
        const state = this.peerConnection.connectionState;
        Utils.log('🌐 Peer Connection State:', state);
        
        if (this.onConnectionStateChange) {
            this.onConnectionStateChange(state);
        }
        
        switch (state) {
            case 'connected':
                // Note: We wait for DataChannel onopen before marking as fully "Connected" in UI
                Utils.log('✨ ICE Connection fully established.');
                break;
                
            case 'disconnected':
                Utils.log('🔌 Peer disconnected.');
                this.connected = false;
                UI.updatePeerStatus('disconnected', 'Waiting...');
                break;
                
            case 'failed':
                Utils.log('❌ Connection failed. Attempting ICE restart...');
                this.restartIce();
                break;
                
            case 'closed':
                this.connected = false;
                break;
        }
    },
    
    /**
     * Handle ICE-specific connection state
     */
    handleIceConnectionStateChange() {
        const state = this.peerConnection.iceConnectionState;
        Utils.log('🧊 ICE Status:', state);
        
        if (state === 'failed') {
            Utils.log('🧊 ICE Failed. Restarting...');
            this.restartIce();
        }
    },

    /**
     * Attempt to restart ICE on failure
     */
    async restartIce() {
        if (!this.isInitiator || !this.peerConnection) return;
        
        try {
            Utils.log('🔄 Restarting ICE...');
            const offer = await this.peerConnection.createOffer({ iceRestart: true });
            await this.peerConnection.setLocalDescription(offer);
            WebSocketManager.sendOffer(offer);
        } catch (error) {
            Utils.log('❌ ICE Restart failed:', error);
        }
    },
    
    /**
     * Safe send through DataChannel
     */
    send(data) {
        if (!this.connected || !this.dataChannel || this.dataChannel.readyState !== 'open') {
            return false;
        }
        
        try {
            this.dataChannel.send(data);
            return true;
        } catch (error) {
            Utils.log('❌ DataChannel send error:', error);
            return false;
        }
    },
    
    isReadyToSend() {
        return this.connected && 
               this.dataChannel && 
               this.dataChannel.readyState === 'open' &&
               this.dataChannel.bufferedAmount < CONFIG.FILE_TRANSFER.BUFFER_THRESHOLD;
    },
    
    getBufferedAmount() {
        return this.dataChannel ? this.dataChannel.bufferedAmount : 0;
    },
    
    /**
     * Close connection and cleanup
     */
    close() {
        if (this.dataChannel) {
            this.dataChannel.onopen = null;
            this.dataChannel.onclose = null;
            this.dataChannel.onmessage = null;
            this.dataChannel.onerror = null;
            this.dataChannel.close();
            this.dataChannel = null;
        }
        
        if (this.peerConnection) {
            this.peerConnection.onicecandidate = null;
            this.peerConnection.onconnectionstatechange = null;
            this.peerConnection.oniceconnectionstatechange = null;
            this.peerConnection.ondatachannel = null;
            this.peerConnection.close();
            this.peerConnection = null;
        }
        
        this.connected = false;
        this.iceCandidateQueue = [];
    }
};
