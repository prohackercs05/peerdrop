/**
 * PeerDrop File Transfer Manager
 * 
 * Handles chunked file transfer over WebRTC DataChannel
 * Optimized for high-speed transfers (1GB in 30-45 seconds)
 */

const FileTransferManager = {
    // Sending state
    sendQueue: [],
    currentSend: null,
    sendInProgress: false,
    
    // Receiving state
    receiveBuffer: new Map(),
    receivedFiles: [],
    
    // Performance tracking
    startTime: null,
    lastProgressUpdate: 0,
    transferredBytes: 0,
    speedSamples: [],
    maxSpeedSamples: 10,
    
    /**
     * Initialize file transfer manager
     */
    init() {
        Utils.log('📁 Initializing File Transfer Manager...');
        
        // Setup WebRTC data channel message handler
        WebRTCManager.onDataChannelMessage = (data) => {
            this.handleIncomingData(data);
        };
        
        WebRTCManager.onDataChannelOpen = () => {
            Utils.log('✅ Data channel ready for file transfer');
            UI.updatePeerStatus('connected', 'Connected');
            
            // Start sending if files in queue
            if (this.sendQueue.length > 0 && !this.sendInProgress) {
                this.processQueue();
            }
        };
        
        WebRTCManager.onDataChannelClose = () => {
            Utils.log('🔌 Data channel closed');
            UI.updatePeerStatus('disconnected', 'Disconnected');
            this.resetSendState();
        };
        
        Utils.log('✅ File Transfer Manager initialized');
    },
    
    /**
     * Send a file
     * @param {File} file - File to send
     */
    async sendFile(file) {
        Utils.log('📤 Queuing file for send:', file.name);
        
        // Add to queue
        this.sendQueue.push(file);
        
        UI.showToast(`Queued: ${file.name}`, 'info');
        
        // Start processing if not already sending
        if (!this.sendInProgress && WebRTCManager.connected) {
            this.processQueue();
        }
    },
    
    /**
     * Process send queue
     */
    async processQueue() {
        UI.updateFileQueue(this.sendQueue);
        
        if (this.sendQueue.length === 0) {
            this.sendInProgress = false;
            return;
        }
        
        if (!WebRTCManager.connected) {
            UI.showToast('Waiting for peer connection...', 'info');
            return;
        }
        
        this.sendInProgress = true;
        const file = this.sendQueue.shift();
        
        // Update UI after shift
        UI.updateFileQueue(this.sendQueue);
        
        await this.sendFileChunked(file);
        
        // Process next file
        this.processQueue();
    },
    
    /**
     * Send file in chunks
     * @param {File} file - File to send
     */
    // Transfer state
    isPaused: false,
    isCancelled: false,

    /**
     * Send file in chunks
     * @param {File} file - File to send
     */
    async sendFileChunked(file) {
        Utils.log('📤 Starting chunked file send:', file.name);
        
        // Reset state
        this.isPaused = false;
        this.isCancelled = false;

        // Determine the best path to display/send
        let displayPath = file.name;
        if (file.p2pMetadata && file.p2pMetadata.relativePath) {
            displayPath = file.p2pMetadata.relativePath;
        } else if (file.p2pPath) {
            displayPath = file.p2pPath;
        } else if (file.webkitRelativePath) {
            displayPath = file.webkitRelativePath;
        }

        this.currentSend = {
            file: file,
            fileName: displayPath,
            fileSize: file.size,
            fileType: file.type,
            totalChunks: Math.ceil(file.size / CONFIG.FILE_TRANSFER.CHUNK_SIZE),
            sentChunks: 0,
            transferredBytes: 0,
            isFolder: file.p2pMetadata ? file.p2pMetadata.isFolderBundle : false,
            filesCount: file.p2pMetadata ? file.p2pMetadata.filesCount : 1
        };

        // Update UI queue to show current sending file immediately
        UI.updateFileQueue(this.sendQueue);
        
        // Reset performance tracking
        this.startTime = Date.now();
        this.lastProgressUpdate = Date.now();
        this.transferredBytes = 0;
        this.speedSamples = [];
        
        // Send file metadata first (Matching your React logic)
        const metadata = {
            name: displayPath,
            size: file.size,
            mimeType: file.type,
            isFolder: file.p2pMetadata ? file.p2pMetadata.isFolderBundle : false,
            filesCount: file.p2pMetadata ? file.p2pMetadata.filesCount : 1
        };
        
        WebRTCManager.send(JSON.stringify(metadata));
        
        // Immediate UI update to show total size and real filename
        this.transferredBytes = 0;
        this.startTime = performance.now();
        this.lastProgressUpdate = 0; 
        
        UI.showTransferProgress({
            fileName: displayPath,
            fileSize: file.size,
            transferred: 0,
            total: file.size,
            speed: 0,
            eta: Infinity,
            isFolder: metadata.isFolder,
            filesCount: metadata.filesCount
        });
        
        UI.showToast(`Sending: ${displayPath}`, 'info');
        UI.updateTransferControls('sending');
        
        // Safety yield: Allow receiver to parse metadata before flooding with binary
        await this.sleep(100);
        
        // Read and send file in chunks (HIGH SPEED LOOP)
        try {
            await this.readAndSendChunks(file);

            if (!this.isCancelled) {
                // Send completion message if finished normally
                const completion = {
                    type: 'file-complete',
                    name: displayPath
                };
                WebRTCManager.send(JSON.stringify(completion));
                
                UI.showToast(`Sent: ${displayPath}`, 'success');
                UI.hideTransferProgress();

                // Add to history
                UI.addSentFile({
                    name: displayPath,
                    size: file.size,
                    type: file.type,
                    isFolderBundle: metadata.isFolder,
                    filesCount: metadata.filesCount,
                    sentAt: new Date()
                });
            }
        } catch (error) {
            console.error("Transfer error:", error);
            UI.showToast("Transfer failed", 'error');
        }
        
        this.currentSend = null;
    },
    
    /**
     * Read file and send chunks with Backpressure Control
     * @param {File} file - File to read
     */
    async readAndSendChunks(file) {
        const chunkSize = CONFIG.FILE_TRANSFER.CHUNK_SIZE;
        const channel = WebRTCManager.dataChannel;
        let offset = 0;
        
        if (!channel) throw new Error("Data channel not available");
        Utils.log(`🚀 Loop started for ${file.name} (${file.size} bytes)`);

        try {
            while (offset < file.size) {
                // Check flags
                if (this.isCancelled) throw new Error("Transfer cancelled");
                if (this.isPaused) {
                    await this.sleep(200);
                    continue;
                }

                // Backpressure Polling (React Style)
                const threshold = CONFIG.FILE_TRANSFER.BUFFER_THRESHOLD || (16 * 1024 * 1024);
                if (channel.bufferedAmount > threshold * 0.7) {
                    if (CONFIG.DEBUG) Utils.log(`📊 Buffer Full (${Utils.formatBytes(channel.bufferedAmount)}), waiting...`);
                    while (channel.bufferedAmount > threshold * 0.3) {
                        if (this.isCancelled) throw new Error("Transfer cancelled");
                        await new Promise(r => setTimeout(r, 10));
                    }
                }

                // Direct Slice & Send (Using Blob.arrayBuffer() for speed, but handled safely)
                const end = Math.min(offset + chunkSize, file.size);
                const chunkData = await file.slice(offset, end).arrayBuffer();
                
                try {
                    // Send as Uint8Array for maximum browser reliability
                    channel.send(new Uint8Array(chunkData));
                    offset = end;
                    this.transferredBytes = offset;
                    
                    if (this.currentSend) {
                        this.currentSend.transferredBytes = offset;
                    }

                    // Progress update and optional logging
                    this.updateSendProgress();
                    
                    if (CONFIG.DEBUG && offset % (chunkSize * 20) === 0) {
                        Utils.log(`📤 Progress: ${Utils.formatBytes(offset)} / ${Utils.formatBytes(file.size)}`);
                    }
                } catch (e) {
                    Utils.log("⚠️ channel.send error, sleeping...", e);
                    await this.sleep(100);
                }

                // Yield to Browser frequently for UI responsiveness
                await new Promise(r => setTimeout(r, 0));
            }
            Utils.log(`✅ Loop finished for ${file.name}`);
        } catch (err) {
            Utils.log(`❌ Transfer loop error: ${err.message}`);
            throw err;
        }
    },
    
    pauseTransfer() {
        if (!this.isPaused) {
            this.isPaused = true;
            UI.showToast("Transfer paused", 'info');
            
            // If we are receiving, tell the sender to pause
            if (!this.currentSend && this.receiveBuffer.size > 0) {
                WebRTCManager.send(JSON.stringify({ type: 'file-pause' }));
            }
        }
    },

    resumeTransfer() {
        if (this.isPaused) {
            this.isPaused = false;
            UI.showToast("Transfer resumed", 'info');
            
            // If we are receiving, tell the sender to resume
            if (!this.currentSend && this.receiveBuffer.size > 0) {
                WebRTCManager.send(JSON.stringify({ type: 'file-resume' }));
            }
        }
    },

    cancelTransfer() {
        // Handle Sender Cancellation
        if (this.currentSend) {
            this.isCancelled = true;
            WebRTCManager.send(JSON.stringify({ type: 'file-cancel' }));
            UI.showToast("Transfer cancelled", 'info');
        } 
        
        // Handle Receiver Cancellation
        else if (this.receiveBuffer.size > 0) {
            // Send cancel message to sender so they stop
            WebRTCManager.send(JSON.stringify({ type: 'file-cancel' }));
            this.cancelReceiving();
        }

        UI.hideTransferProgress();
        this.isPaused = false; // Reset pause state for next transfer
    },
    
    /**
     * Update send progress
     */
    updateSendProgress() {
        if (!this.currentSend || !this.startTime) return;
        
        const now = performance.now();
        
        // Throttle updates (but allow first one)
        if (this.lastProgressUpdate !== 0 && (now - this.lastProgressUpdate < CONFIG.FILE_TRANSFER.PROGRESS_UPDATE_INTERVAL)) {
            return;
        }
        
        this.lastProgressUpdate = now;
        const elapsedSeconds = (now - this.startTime) / 1000;
        
        // Ensure we don't divide by zero or very small time
        if (elapsedSeconds < 0.01) return;
        
        const currentSpeed = this.transferredBytes / elapsedSeconds;
        
        // Store speed sample
        this.speedSamples.push(currentSpeed);
        if (this.speedSamples.length > this.maxSpeedSamples) {
            this.speedSamples.shift();
        }
        
        // Calculate average speed
        const avgSpeed = this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length;
        
        // Calculate ETA
        const remainingBytes = this.currentSend.fileSize - this.transferredBytes;
        const eta = Utils.calculateETA(this.currentSend.fileSize, this.transferredBytes, avgSpeed);
        
        // Update UI
        UI.showTransferProgress({
            fileName: this.currentSend.fileName,
            fileSize: this.currentSend.fileSize,
            transferred: this.transferredBytes,
            total: this.currentSend.fileSize,
            speed: avgSpeed,
            eta: eta,
            isFolder: this.currentSend.isFolder,
            filesCount: this.currentSend.filesCount
        });
    },
    
    /**
     * Handle incoming data (React Logic style)
     * @param {ArrayBuffer|string} data - Incoming data
     */
    handleIncomingData(data) {
        if (typeof data !== 'string') {
            // Binary data (Chunk)
            const activeReceive = Array.from(this.receiveBuffer.values())[0];
            if (!activeReceive) {
                if (CONFIG.DEBUG) Utils.log('⚠️ Received binary data but no active receive state');
                return;
            }

            try {
                // 'data' is ArrayBuffer by default due to binaryType setting
                const byteLen = data.byteLength || data.size || 0;
                activeReceive.receivedBytes += byteLen;
                
                // Buffer the data
                if (!activeReceive.chunks) activeReceive.chunks = [];
                activeReceive.chunks.push(data);

                // Update UI (Throttled inside)
                this.updateReceiveProgress(activeReceive);

                // Check completion
                if (activeReceive.receivedBytes >= activeReceive.size) {
                    this.completeReceiving(activeReceive.name);
                }
            } catch (err) {
                console.error("❌ Binary processing error:", err);
            }
            return;
        }

        // String Metadata Handling
        const meta = JSON.parse(data);
        Utils.log('📥 Received message:', meta);
        
        if (meta.type === 'file-cancel') {
            Utils.log('🚫 Peer cancelled the transfer');
            if (this.currentSend) {
                this.isCancelled = true;
            } else {
                this.cancelReceiving();
            }
            return;
        }

        if (meta.type === 'file-pause') {
            Utils.log('⏸️ Peer paused the transfer');
            this.isPaused = true;
            const item = document.getElementById('active-transfer-item');
            if (item) {
                item.classList.add('paused');
                const tag = item.querySelector('.transfer-status-tag');
                if (tag) {
                    tag.textContent = 'Paused';
                    tag.className = 'transfer-status-tag status-paused';
                }
                const btn = item.querySelector('[data-action="pause"]');
                if (btn) {
                    btn.dataset.action = 'resume';
                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                    btn.title = 'Resume Transfer';
                }
            }
            return;
        }

        if (meta.type === 'file-resume') {
            Utils.log('▶️ Peer resumed the transfer');
            this.isPaused = false;
            const item = document.getElementById('active-transfer-item');
            if (item) {
                item.classList.remove('paused');
                const tag = item.querySelector('.transfer-status-tag');
                if (tag) {
                    const isSending = this.currentSend !== null;
                    tag.textContent = isSending ? 'Sending' : 'Receiving';
                    tag.className = `transfer-status-tag status-${isSending ? 'sending' : 'receiving'}`;
                }
                const btn = item.querySelector('[data-action="resume"]');
                if (btn) {
                    btn.dataset.action = 'pause';
                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
                    btn.title = 'Pause Transfer';
                }
            }
            return;
        }

        if (meta.type === 'file-complete') {
            return;
        }

        // Cleanup any old state before starting new
        if (this.receiveBuffer.size > 0) {
            const oldFile = Array.from(this.receiveBuffer.keys())[0];
            Utils.log(`🧹 Cleaning up old transfer state for ${oldFile}`);
            this.receiveBuffer.delete(oldFile);
        }

        // Regular metadata (New Transfer)
        const receiveState = {
            name: meta.name,
            size: meta.size,
            mimeType: meta.mimeType || 'application/octet-stream',
            isFolder: meta.isFolder,
            filesCount: meta.filesCount,
            receivedBytes: 0,
            chunks: [],
            startTime: performance.now(),
            lastUpdate: Date.now()
        };
        
        this.receiveBuffer.set(meta.name, receiveState);
        UI.showToast(`Receiving: ${meta.name}`, 'info');
        
        // Refresh UI queue to show receiving item
        UI.updateFileQueue(this.sendQueue);
    },

    // Properties to store receiver state compatible with React logic
    currentFileName: { current: "" },
    expectedSize: { current: 0 },
    recvBuffer: { current: [] },
    recvSize: { current: 0 },

    /**
     * Cancel receiving (from sender or local)
     */
    cancelReceiving() {
        const activeReceive = Array.from(this.receiveBuffer.values())[0];
        if (activeReceive) {
            UI.showToast(`Transfer cancelled: ${activeReceive.name}`, 'error');
            this.receiveBuffer.delete(activeReceive.name);
        }
        UI.hideTransferProgress();
        this.receivedFiles = []; 
    },

    /**
     * Update receive progress
     * @param {object} receiveState - Receive state
     */
    updateReceiveProgress(receiveState) {
        const now = Date.now();
        if (now - receiveState.lastUpdate < CONFIG.FILE_TRANSFER.PROGRESS_UPDATE_INTERVAL) {
            return;
        }
        receiveState.lastUpdate = now;
        const elapsedSeconds = (performance.now() - receiveState.startTime) / 1000;
        const speed = receiveState.receivedBytes / elapsedSeconds;
        const eta = Utils.calculateETA(receiveState.size, receiveState.receivedBytes, speed);
        
        UI.showTransferProgress({
            fileName: receiveState.name,
            fileSize: receiveState.size,
            transferred: receiveState.receivedBytes,
            total: receiveState.size,
            speed: speed,
            eta: eta,
            isFolder: receiveState.isFolder,
            filesCount: receiveState.filesCount
        });
    },
    
    /**
     * Complete file receiving
     * @param {string} fileName - File name
     */
    completeReceiving(fileName) {
        const receiveState = this.receiveBuffer.get(fileName);
        
        if (!receiveState) {
            Utils.log('⚠️ Receive complete but no state found');
            return;
        }
        
        Utils.log('✅ File receive complete:', fileName);
        
        // Combine chunks into single blob
        const blob = new Blob(receiveState.chunks, { type: receiveState.mimeType });
        
        // Create file data
        const fileData = {
            id: Utils.generateId(),
            name: receiveState.name,
            size: receiveState.size,
            type: receiveState.mimeType,
            data: blob,
            receivedAt: new Date(),
            isFolderBundle: receiveState.isFolderBundle,
            filesCount: receiveState.filesCount
        };
        
        // Add to received files
        this.receivedFiles.push(fileData);
        
        // Update UI
        UI.addReceivedFile(fileData);
        UI.showToast(`Received: ${fileName}`, 'success');
        UI.hideTransferProgress();
        
        // Clean up
        this.receiveBuffer.delete(fileName);
    },
    
    /**
     * Reset send state
     */
    resetSendState() {
        this.sendQueue = [];
        this.currentSend = null;
        this.sendInProgress = false;
    },
    
    /**
     * Reset receive state
     */
    resetReceiveState() {
        this.receiveBuffer.clear();
        this.receivedFiles = [];
    },
    
    /**
     * Reset all state
     */
    reset() {
        this.resetSendState();
        this.resetReceiveState();
        this.startTime = null;
        this.lastProgressUpdate = 0;
        this.transferredBytes = 0;
        this.speedSamples = [];
    },
    
    /**
     * Sleep utility
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after delay
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
