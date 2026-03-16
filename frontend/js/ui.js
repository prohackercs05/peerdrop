/**
 * PeerDrop UI Manager
 * 
 * Handles all UI interactions and screen transitions
 */

const UI = {
    // Screen elements
    screens: {
        welcome: null,
        join: null,
        room: null,
        howItWorks: null,
        security: null,
        faq: null,
        about: null,
        contact: null,
        privacy: null,
        terms: null,
        history: null
    },
    
    // UI elements
    elements: {},

    // Unique ID for this specific tab session
    tabId: null,

    // Selection state for batch actions
    selectedHistoryItems: {
        RECEIVED: new Set(),
        SENT: new Set()
    },

    // History management
    HistoryManager: {
        STORAGE_KEY: 'peerdrop_history',
        sessionData: new Map(), // Runtime cache for Blobs (lost on refresh)
        
        save(item) {
            const history = this.getAll();
            const id = Date.now() + Math.random().toString(36).substr(2, 9);
            
            // Extract data for session cache
            const { data, ...metadata } = item;
            if (data) {
                this.sessionData.set(id, data);
            }

            const historyItem = {
                ...metadata,
                id: id,
                tabId: UI.tabId,
                timestamp: new Date().toISOString()
            };
            
            history.unshift(historyItem);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
            
            // Optional: Sync with backend database
            this.syncWithBackend(historyItem);
            
            // Update History Screen UI
            UI.loadHistory();
        },
        
        getAll() {
            const str = localStorage.getItem(this.STORAGE_KEY);
            return str ? JSON.parse(str) : [];
        },

        delete(id) {
            const history = this.getAll().filter(item => item.id !== id);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
            this.sessionData.delete(id);
            UI.loadHistory();
        },

        clear(direction = null) {
            if (!direction) {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
            } else {
                const history = this.getAll().filter(item => item.direction !== direction);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
            }
            UI.loadHistory();
        },
        
        async syncWithBackend(item) {
            try {
                await fetch('/api/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        fileName: item.name,
                        fileSize: item.size,
                        fileType: item.type,
                        direction: item.direction,
                        roomCode: App.currentRoom,
                        isFolder: item.isFolderBundle,
                        filesCount: item.filesCount
                    })
                });
            } catch (e) {
                // Silently fail if backend is not available or DB not configured
            }
        }
    },
    
    /**
     * Initialize UI
     */
    init() {
        Utils.log('🎨 Initializing UI...');
        
        // Setup unique tab ID for history isolation
        this.tabId = sessionStorage.getItem('peerdrop_tab_id');
        if (!this.tabId) {
            this.tabId = Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('peerdrop_tab_id', this.tabId);
        }
        
        // Get screen elements
        this.screens.welcome = document.getElementById('welcomeScreen');
        this.screens.join = document.getElementById('joinScreen');
        this.screens.room = document.getElementById('roomScreen');
        this.screens.howItWorks = document.getElementById('howItWorksScreen');
        this.screens.security = document.getElementById('securityScreen');
        this.screens.faq = document.getElementById('faqScreen');
        this.screens.about = document.getElementById('aboutScreen');
        this.screens.contact = document.getElementById('contactScreen');
        this.screens.privacy = document.getElementById('privacyScreen');
        this.screens.terms = document.getElementById('termsScreen');
        this.screens.history = document.getElementById('historyScreen');
        
        // Get all UI elements
        this.elements = {
            // Connection status
            connectionStatus: document.getElementById('connectionStatus'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            
            // Welcome screen
            createRoomBtn: document.getElementById('createRoomBtn'),
            joinRoomBtn: document.getElementById('joinRoomBtn'),
            
            // Join screen
            backFromJoin: document.getElementById('backFromJoin'),
            roomCodeInput: document.getElementById('roomCodeInput'),
            joinRoomSubmitBtn: document.getElementById('joinRoomSubmitBtn'),
            roomNavLink: document.getElementById('roomNavLink'),
            
            // Room screen
            roomCode: document.getElementById('roomCode'),
            copyCodeBtn: document.getElementById('copyCodeBtn'),
            leaveRoomBtn: document.getElementById('leaveRoomBtn'),
            roomStatusText: document.getElementById('roomStatusText'),
            peerStatus: document.getElementById('peerStatus'),
            peerStatusText: document.getElementById('peerStatusText'),
            
            // File transfer (Multi-queue)
            dropZone: document.getElementById('dropZone'),
            triggerFileBtn: document.getElementById('triggerFileBtn'),
            triggerFolderBtn: document.getElementById('triggerFolderBtn'),
            fileInput: document.getElementById('fileInput'),
            folderInput: document.getElementById('folderInput'),
            fileQueue: document.getElementById('fileQueue'),
            activeTransferContainer: document.getElementById('activeTransferContainer'),
            transferList: document.getElementById('transferList'),
            
            // Dedicated History Screen
            receivedHistoryList: document.getElementById('receivedHistoryList'),
            sentHistoryList: document.getElementById('sentHistoryList'),
            clearReceivedBtn: document.getElementById('clearReceivedBtn'),
            clearSentBtn: document.getElementById('clearSentBtn'),
            selectAllReceived: document.getElementById('selectAllReceived'),
            selectAllSent: document.getElementById('selectAllSent'),
            
            // Navigation
            mainNav: document.getElementById('mainNav'),
            mobileMenuBtn: document.getElementById('mobileMenuBtn'),
            
            // Toast container
            toastContainer: document.getElementById('toastContainer')
        };
        
        this.roomTimerInterval = null;
        
        /* Before unload warning removed */
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Show welcome screen
        this.showScreen('welcome');
        
        // Load history
        this.loadHistory();
        
        // Transfer controls delegation
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-mini-control');
            if (btn) {
                const action = btn.dataset.action;
                if (action === 'pause') {
                    FileTransferManager.pauseTransfer();
                    btn.dataset.action = 'resume';
                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                    btn.title = 'Resume Transfer';
                    const item = btn.closest('.transfer-item-compact');
                    item.classList.add('paused');
                    const tag = item.querySelector('.transfer-status-tag');
                    if (tag) {
                        tag.textContent = 'Paused';
                        tag.className = 'transfer-status-tag status-paused';
                    }
                } else if (action === 'resume') {
                    FileTransferManager.resumeTransfer();
                    btn.dataset.action = 'pause';
                    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
                    btn.title = 'Pause Transfer';
                    const item = btn.closest('.transfer-item-compact');
                    item.classList.remove('paused');
                    const tag = item.querySelector('.transfer-status-tag');
                    if (tag) {
                        const isSending = item.classList.contains('sending');
                        tag.textContent = isSending ? 'Sending' : 'Receiving';
                        tag.className = `transfer-status-tag status-${isSending ? 'sending' : 'receiving'}`;
                    }
                } else if (action === 'cancel') {
                    FileTransferManager.cancelTransfer();
                }
            }
        });

        Utils.log('✅ UI initialized');
    },

    /**
     * Load history from storage and update multiple UI locations
     */
    loadHistory() {
        const history = this.HistoryManager.getAll();
        
        // Filter history to show only items belonging to this tab session
        // This solves the issue where sender/receiver see duplicates in local testing
        const myHistory = history.filter(item => item.tabId === this.tabId);
        
        // Update Dedicated History Screen only (Room history removed per user request)
        this.renderHistoryDashboard(myHistory);
    },

    /**
     * Render the dedicated history dashboard
     */
    renderHistoryDashboard(history) {
        if (!this.elements.receivedHistoryList || !this.elements.sentHistoryList) return;

        const received = history.filter(item => item.direction === 'RECEIVED');
        const sent = history.filter(item => item.direction === 'SENT');

        // Render Received
        this.renderHistorySection(received, 'RECEIVED', this.elements.receivedHistoryList, this.elements.clearReceivedBtn, this.elements.selectAllReceived);

        // Render Sent
        this.renderHistorySection(sent, 'SENT', this.elements.sentHistoryList, this.elements.clearSentBtn, this.elements.selectAllSent);
    },

    /**
     * Render a section (Received or Sent) and update its controls
     */
    renderHistorySection(items, direction, listElem, clearBtn, selectAllCheckbox) {
        listElem.innerHTML = '';
        
        if (items.length > 0) {
            items.forEach(item => {
                listElem.appendChild(this.createHistoryItem(item));
            });
            
            // Show "Select All" option
            if (selectAllCheckbox) {
                const wrapper = selectAllCheckbox.closest('.select-all-wrapper');
                if (wrapper) wrapper.style.display = 'flex';
                
                // Sync "Select All" state
                const allSelected = items.every(item => this.selectedHistoryItems[direction].has(item.id));
                selectAllCheckbox.checked = allSelected && items.length > 0;
            }
        } else {
            const icon = direction === 'RECEIVED' ? '📥' : '📤';
            listElem.innerHTML = `<div class="empty-state">${icon} No ${direction.toLowerCase()} files yet</div>`;
            if (selectAllCheckbox) {
                const wrapper = selectAllCheckbox.closest('.select-all-wrapper');
                if (wrapper) wrapper.style.display = 'none';
            }
        }

        this.updateClearSelectedBtn(direction, clearBtn);
    },

    /**
     * Update the text and state of the "Clear Selected" button
     */
    updateClearSelectedBtn(direction, btn) {
        if (!btn) return;
        const count = this.selectedHistoryItems[direction].size;
        btn.textContent = `Clear Selected (${count})`;
        btn.disabled = count === 0;
    },

    /**
     * Create a history row for the dashboard
     */
    createHistoryItem(item) {
        const row = document.createElement('div');
        row.className = 'history-item';
        row.dataset.id = item.id;

        const isFolder = item.isFolderBundle || false;
        const icon = isFolder ? 
            `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>` : 
            Utils.getFileIcon(item.name);

        const sessionData = this.HistoryManager.sessionData.get(item.id);
        const isReceived = item.direction === 'RECEIVED';
        
        // If it's a received file, we always want to show the button so the user can see it
        // but it will be disabled if session data is lost (on refresh)
        const canDownload = isReceived && sessionData;

        const displayName = item.name.length > 25 ? 
            item.name.substring(0, 15) + '...' + item.name.substring(item.name.length - 10) : 
            item.name;

        row.innerHTML = `
            <div class="history-item-content">
                <label class="custom-checkbox">
                    <input type="checkbox" class="history-select" ${this.selectedHistoryItems[item.direction].has(item.id) ? 'checked' : ''}>
                    <span class="checkbox-box"></span>
                </label>
                <span class="file-icon-static">${icon}</span>
                <div class="history-item-info">
                    <span class="file-name" title="${item.name}">${displayName}</span>
                    <div class="file-meta">
                        <span class="status-tag ${item.direction.toLowerCase()}">${item.direction}</span>
                        <span>•</span>
                        <span>${Utils.formatBytes(item.size)}</span>
                        ${isFolder ? `<span>• ${item.filesCount} files</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="history-actions">
                ${isReceived ? `<button class="download-btn" ${!canDownload ? 'disabled title="File data lost after refresh"' : 'title="Download file"'}>Download</button>` : ''}
            </div>
        `;

        // Selection Toggle
        const checkbox = row.querySelector('.history-select');
        checkbox.addEventListener('change', (e) => {
            this.toggleHistorySelection(item.id, item.direction, e.target.checked);
        });

        // Click row to toggle (excluding actions)
        row.addEventListener('click', (e) => {
            if (e.target.closest('.history-actions') || e.target.closest('.custom-checkbox')) return;
            const newChecked = !checkbox.checked;
            checkbox.checked = newChecked;
            this.toggleHistorySelection(item.id, item.direction, newChecked);
        });

        if (canDownload) {
            row.querySelector('.download-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.downloadFile({
                    data: sessionData,
                    name: item.name,
                    type: item.type
                });
            });
        }

        return row;
    },

    /**
     * Toggle individual selection
     */
    toggleHistorySelection(id, direction, isSelected) {
        if (isSelected) {
            this.selectedHistoryItems[direction].add(id);
        } else {
            this.selectedHistoryItems[direction].delete(id);
        }
        
        // Update header UI
        const isReceived = direction === 'RECEIVED';
        const clearBtn = isReceived ? this.elements.clearReceivedBtn : this.elements.clearSentBtn;
        const selectAllCheckbox = isReceived ? this.elements.selectAllReceived : this.elements.selectAllSent;
        const history = this.HistoryManager.getAll().filter(item => item.direction === direction);

        if (selectAllCheckbox) {
            const allSelected = history.length > 0 && history.every(item => this.selectedHistoryItems[direction].has(item.id));
            selectAllCheckbox.checked = allSelected;
        }

        this.updateClearSelectedBtn(direction, clearBtn);
    },

    /**
     * Toggle "Select All"
     */
    toggleHistorySelectAll(direction, isSelected) {
        const history = this.HistoryManager.getAll().filter(item => item.direction === direction);
        
        if (isSelected) {
            history.forEach(item => this.selectedHistoryItems[direction].add(item.id));
        } else {
            this.selectedHistoryItems[direction].clear();
        }

        this.loadHistory();
    },

    /**
     * Delete selected items with animation
     */
    async clearSelectedHistory(direction) {
        const selectedIds = this.selectedHistoryItems[direction];
        if (selectedIds.size === 0) return;

        if (!confirm(`Permanently delete ${selectedIds.size} selected items?`)) return;

        const listId = direction === 'RECEIVED' ? 'receivedHistoryList' : 'sentHistoryList';
        const listElem = document.getElementById(listId);
        
        // 1. Trigger Animation
        const itemsToAnimate = Array.from(listElem.querySelectorAll('.history-item'))
            .filter(item => selectedIds.has(item.dataset.id));

        itemsToAnimate.forEach(item => item.classList.add('removing'));

        // 2. Wait for animation
        await new Promise(resolve => setTimeout(resolve, 450));

        // 3. Update Storage
        const currentHistory = this.HistoryManager.getAll();
        const filteredHistory = currentHistory.filter(item => !selectedIds.has(item.id));
        
        // Batch delete Blobs
        selectedIds.forEach(id => this.HistoryManager.sessionData.delete(id));
        
        localStorage.setItem(this.HistoryManager.STORAGE_KEY, JSON.stringify(filteredHistory));
        
        // 4. Clear selections and Refresh UI
        this.selectedHistoryItems[direction].clear();
        this.loadHistory();
        
        this.showToast('Selected items removed', 'success');
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Welcome screen
        this.elements.createRoomBtn.addEventListener('click', () => {
            App.createRoom();
        });
        
        this.elements.joinRoomBtn.addEventListener('click', () => {
            this.showScreen('join');
        });
        
        // Join screen
        this.elements.backFromJoin.addEventListener('click', () => {
            this.showScreen('welcome');
        });
        
        this.elements.roomCodeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
        
        this.elements.roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.joinRoom();
            }
        });
        
        this.elements.joinRoomSubmitBtn.addEventListener('click', () => {
            this.joinRoom();
        });
        
        // Room screen
        this.elements.copyCodeBtn.addEventListener('click', () => {
            this.copyRoomCode();
        });
        
        this.elements.leaveRoomBtn.addEventListener('click', () => {
            App.leaveRoom();
        });
        
        // Navigation links (Navbar, Footer, and Logo)
        const navLinks = document.querySelectorAll('.nav-link, .footer-link, .logo[data-page]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const pageId = link.getAttribute('data-page');
                if (pageId) {
                    e.preventDefault();
                    this.showScreen(pageId);
                    
                    // Update active state in navbar
                    document.querySelectorAll('.nav-link').forEach(nl => {
                        nl.classList.toggle('active', nl.getAttribute('data-page') === pageId);
                    });

                    // Close mobile menu if open
                    if (this.elements.mainNav) {
                        this.elements.mainNav.classList.remove('open');
                    }
                }
            });
        });

        // Mobile Menu Toggle
        if (this.elements.mobileMenuBtn && this.elements.mainNav) {
            this.elements.mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.elements.mainNav.classList.toggle('open');
            });
        }

        // History Selection & Bulk Actions
        if (this.elements.clearReceivedBtn) {
            this.elements.clearReceivedBtn.addEventListener('click', () => {
                this.clearSelectedHistory('RECEIVED');
            });
        }

        if (this.elements.clearSentBtn) {
            this.elements.clearSentBtn.addEventListener('click', () => {
                this.clearSelectedHistory('SENT');
            });
        }

        if (this.elements.selectAllReceived) {
            this.elements.selectAllReceived.addEventListener('change', (e) => {
                this.toggleHistorySelectAll('RECEIVED', e.target.checked);
            });
        }

        if (this.elements.selectAllSent) {
            this.elements.selectAllSent.addEventListener('change', (e) => {
                this.toggleHistorySelectAll('SENT', e.target.checked);
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            if (this.elements.mainNav && this.elements.mainNav.classList.contains('open')) {
                this.elements.mainNav.classList.remove('open');
            }
        });

        // Prevent menu from closing when clicking inside
        if (this.elements.mainNav) {
            this.elements.mainNav.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        }

        // FAQ accordion
        this.setupFaqAccordion();
        
        // Native Triggers (Formerly JS, now native labels):
        const fBtn = document.getElementById('triggerFileBtn');
        if (fBtn) {
            fBtn.addEventListener('click', () => {
                Utils.log('🖱️ File selection button clicked');
                // Label handles input trigger natively, but this log confirms the click was captured.
            });
        }

        const dBtn = document.getElementById('triggerFolderBtn');
        if (dBtn) {
            dBtn.addEventListener('click', () => {
                Utils.log('🖱️ Folder selection button clicked');
                // Label handles input trigger natively.
            });
        }

        // Handle file selection (Always use direct lookup for reliability during change)
        const fInp = document.getElementById('fileInput');
        if (fInp) {
            fInp.addEventListener('change', (e) => {
                Utils.log(`📄 File selection detected: ${e.target.files.length} items`);
                this.handleFileSelect(e.target.files);
                e.target.value = ''; 
            });
        }

        // Handle folder selection
        const dInp = document.getElementById('folderInput');
        if (dInp) {
            dInp.addEventListener('change', (e) => {
                Utils.log(`📁 Folder selection detected: ${e.target.files.length} items`);
                if (e.target.files && e.target.files.length > 0) {
                    this.handleFolderSelect(e.target.files);
                }
                e.target.value = ''; 
            });
        }
        
        // Drag and drop
        this.elements.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.add('drag-over');
        });
        
        this.elements.dropZone.addEventListener('dragleave', () => {
            this.elements.dropZone.classList.remove('drag-over');
        });
        
        this.elements.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.remove('drag-over');
            
            // Use DataTransferItems for folder support if available
            if (e.dataTransfer.items) {
                this.handleDropItems(e.dataTransfer.items);
            } else {
                this.handleFileSelect(e.dataTransfer.files);
            }
        });

        // Transfer Controls Simplified
    },
    
    /**
     * Setup FAQ accordion logic
     */
    setupFaqAccordion() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                const wasActive = item.classList.contains('active');
                
                // Close all other items
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                
                // Toggle current item
                if (!wasActive) {
                    item.classList.add('active');
                }
            });
        });
    },

    // Transfer Controls logic removed - handled per-item in multi-queue

    /**
     * Trigger fallback for folder selection using dynamic input
     */
    triggerFolderFallback() {
        if (this.elements.folderInput) {
            // Need to reset value to allow same folder selection
            this.elements.folderInput.value = '';
            this.elements.folderInput.click();
        }
    },
    
    /**
     * Show specific screen
     * @param {string} screenName - Name of screen to show
     */
    showScreen(screenId) {
        // Toggle screens
        Object.keys(this.screens).forEach(id => {
            if (id === screenId) {
                this.screens[id].classList.add('active');
            } else {
                this.screens[id].classList.remove('active');
            }
        });

        // Update active state in navbar
        document.querySelectorAll('.nav-link').forEach(nl => {
            nl.classList.toggle('active', nl.getAttribute('data-page') === screenId);
        });

        // Toggle room-specific status bar visibility
        document.body.classList.toggle('on-room-screen', screenId === 'room');
    },

    /**
     * Show or hide the Room button in the navbar
     * @param {boolean} isVisible 
     */
    setRoomNavVisible(isVisible) {
        if (this.elements.roomNavLink) {
            this.elements.roomNavLink.style.display = isVisible ? 'block' : 'none';
        }
    },
    
    /**
     * Update connection status
     * @param {string} status - Status: 'connecting', 'connected', 'disconnected'
     * @param {string} text - Status text
     */
    updateConnectionStatus(status, text) {
        this.elements.statusDot.className = 'status-dot ' + status;
        this.elements.statusText.textContent = text;
        
        // Add status class to parent for pill-level styling
        if (this.elements.connectionStatus) {
            this.elements.connectionStatus.classList.remove('connecting', 'connected', 'disconnected', 'waiting');
            this.elements.connectionStatus.classList.add(status);
        }
    },
    
    /**
     * Join room from input
     */
    joinRoom() {
        const code = this.elements.roomCodeInput.value.trim().toUpperCase();
        
        if (!Utils.isValidRoomCode(code)) {
            this.showToast('Please enter a valid 6-digit room code', 'error');
            return;
        }
        
        App.joinRoom(code);
    },
    
    /**
     * Display room code
     * @param {string} code - Room code
     */
    displayRoomCode(code) {
        // Character spacing is now handled by CSS letter-spacing
        this.elements.roomCode.textContent = code;
        this.showScreen('room');
    },

    // Timer logic removed
    
    /**
     * Copy room code to clipboard
     */
    async copyRoomCode() {
        // Clean the code by removing spaces before copying
        const code = this.elements.roomCode.textContent.replace(/\s+/g, '');
        const success = await Utils.copyToClipboard(code);
        
        if (success) {
            this.showToast('Room code copied to clipboard!', 'success');
            
            // Visual feedback
            const originalHTML = this.elements.copyCodeBtn.innerHTML;
            this.elements.copyCodeBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            setTimeout(() => {
                this.elements.copyCodeBtn.innerHTML = originalHTML;
            }, 2000);
        } else {
            this.showToast('Failed to copy room code', 'error');
        }
    },
    
    /**
     * Update peer status
     * @param {string} status - Status: 'connecting', 'connected', 'disconnected'
     * @param {string} text - Status text
     */
    updatePeerStatus(status, text) {
        const peerDot = document.getElementById('peerStatusDot');
        const peerStatusContainer = this.elements.peerStatus;
        
        const statusClass = status === 'connected' ? 'peer-connected' : status;
        
        if (peerDot) {
            peerDot.className = 'status-dot ' + statusClass;
        }
        
        if (peerStatusContainer) {
            peerStatusContainer.classList.remove('connecting', 'connected', 'peer-connected', 'disconnected', 'waiting');
            peerStatusContainer.classList.add(statusClass);
        }
        
        if (this.elements.peerStatusText) {
            this.elements.peerStatusText.textContent = text || (status === 'connected' ? 'Connected' : 'Waiting...');
        }

        if (this.elements.roomStatusText) {
            if (status === 'connected') {
                this.elements.roomStatusText.textContent = 'Collaborating with peer';
                this.elements.roomStatusText.style.color = '#10B981';
            } else if (status === 'connecting') {
                this.elements.roomStatusText.textContent = 'Connecting to peer...';
                this.elements.roomStatusText.style.color = '#F59E0B';
            } else {
                this.elements.roomStatusText.textContent = 'Once your peer joins using this code, you can start sharing';
                this.elements.roomStatusText.style.color = 'var(--text-secondary)';
            }
        }
    },

    /**
     * Share full invite link
     */
    handleFileSelect(files) {
        if (!files || files.length === 0) return;
        
        Array.from(files).forEach(file => {
            // Check file size
            if (file.size > CONFIG.FILE_TRANSFER.MAX_FILE_SIZE) {
                this.showToast(`File too large: ${file.name} (max 5GB)`, 'error');
                return;
            }
            
            App.sendFile(file);
        });
        
        // Reset inputs
        this.elements.fileInput.value = '';
    },

    /**
     * Update visual file queue (Both sending and waiting)
     */
    updateFileQueue(queue) {
        if (!this.elements.transferList) return;
        
        // Show container if we have any transfers (sending or receiving)
        const hasActiveSend = FileTransferManager.currentSend !== null;
        const receivingState = Array.from(FileTransferManager.receiveBuffer.values())[0];
        const hasActiveReceive = receivingState !== undefined;
        const hasQueued = queue.length > 0;
        
        if (hasActiveSend || hasActiveReceive || hasQueued) {
            this.elements.activeTransferContainer.classList.remove('hidden');
        } else {
            this.elements.activeTransferContainer.classList.add('hidden');
            return;
        }

        this.elements.transferList.innerHTML = '';
        
        // 1. Render Current Send
        if (FileTransferManager.currentSend) {
            const current = FileTransferManager.currentSend;
            const status = FileTransferManager.isPaused ? 'Paused' : 'Sending';
            const item = this.createTransferItem(current.fileName, status, 0, '0 MB/s', current.fileSize);
            item.id = 'active-transfer-item';
            
            // If it was paused, update the button state
            if (FileTransferManager.isPaused) {
                const pauseBtn = item.querySelector('[data-action="pause"]');
                if (pauseBtn) {
                    pauseBtn.dataset.action = 'resume';
                    pauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                    pauseBtn.title = 'Resume Transfer';
                }
            }
            
            this.elements.transferList.appendChild(item);
        }

        // 2. Render Current Receive (if any)
        if (receivingState) {
            const status = FileTransferManager.isPaused ? 'Paused' : 'Receiving';
            const item = this.createTransferItem(receivingState.name, status, 0, '0 MB/s', receivingState.size);
            item.id = 'active-transfer-item';
            
            // If it was paused, update the button state
            if (FileTransferManager.isPaused) {
                const pauseBtn = item.querySelector('[data-action="pause"]');
                if (pauseBtn) {
                    pauseBtn.dataset.action = 'resume';
                    pauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
                    pauseBtn.title = 'Resume Transfer';
                }
            }
            
            this.elements.transferList.appendChild(item);
        }

        // 3. Render Queued Files (Only for sending side usually)
        queue.forEach(file => {
            const name = file.p2pPath || file.name;
            const item = this.createTransferItem(name, 'Queued', 0, '--', file.size);
            this.elements.transferList.appendChild(item);
        });
    },

    /**
     * Create a compact transfer item DOM element
     */
    createTransferItem(name, status, percent, speed, size) {
        const div = document.createElement('div');
        const statusLower = status.toLowerCase();
        const isQueued = statusLower === 'queued';
        const isCompleted = statusLower === 'completed';
        
        div.className = `transfer-item-compact ${statusLower.includes('send') ? 'sending' : (statusLower.includes('receive') ? 'receiving' : statusLower)}`;
        
        const statusClass = `status-${statusLower.includes('send') ? 'sending' : (statusLower.includes('receive') ? 'receiving' : statusLower)}`;
        const sizeText = size ? `<span class="transfer-file-size">${Utils.formatBytes(size)}</span>` : '';
        
        // Only show controls for active transfers (sending or receiving)
        const showControls = !isQueued && !isCompleted;
        
        div.innerHTML = `
            <div class="transfer-info-row">
                <div class="transfer-file-details">
                    <span class="transfer-file-name" title="${name}">${name}</span>
                    ${sizeText}
                </div>
                <div class="transfer-stats-group">
                    <span class="transfer-status-tag ${statusClass}">${status}</span>
                    <span class="transfer-speed">${speed}</span>
                    <span class="transfer-percentage">${percent}%</span>
                    ${showControls ? `
                        <div class="transfer-item-controls">
                            <button class="btn-mini-control" data-action="pause" title="Pause Transfer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
                            </button>
                            <button class="btn-mini-control cancel" data-action="cancel" title="Cancel Transfer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="progress-bar-mini">
                <div class="progress-fill-compact" style="width: ${percent}%"></div>
            </div>
        `;
        return div;
    },

    /**
     * Update transfer controls visibility - DEPRECATED for compact multi-queue
     */
    updateTransferControls(state) {
        // Multi-queue uses per-item management now
    },
    
    /**
     * Handle dropped items (supports folders)
     * @param {DataTransferItemList} items - Dropped items
     */
    async handleDropItems(items) {
        const files = [];
        const queue = [];
        
        // Convert items to entries
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : (item.getAsEntry ? item.getAsEntry() : null);
                if (entry) {
                    queue.push(this.scanEntry(entry));
                } else {
                    // Fallback
                    const file = item.getAsFile();
                    if (file) files.push(file);
                }
            }
        }
        
        // Wait for all scans to complete
        const results = await Promise.all(queue);
        results.flat().forEach(file => files.push(file));
        
        if (files.length > 0) {
            // Check if dropped items look like a folder structure (common path prefix)
            const hasPaths = files.some(f => f.p2pPath && f.p2pPath.includes('/'));
            
            if (hasPaths && files.length > 1) {
                this.handleFolderSelect(files);
            } else {
                this.handleFileSelect(files);
            }
        }
    },
    
    /**
     * Recursively get files from a directory handle (File System Access API)
     * @param {FileSystemDirectoryHandle} dirHandle - Directory handle
     * @param {string} path - Current relative path
     * @returns {Promise<File[]>} - List of files with p2pPath
     */
    async getFilesFromDirectoryHandle(dirHandle, path = '') {
        const files = [];
        
        try {
            for await (const entry of dirHandle.values()) {
                const relativePath = path ? `${path}/${entry.name}` : entry.name;
                
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    // Attach p2pPath for zipping logic which handleFolderSelect uses
                    Object.defineProperty(file, 'p2pPath', {
                        value: relativePath,
                        writable: false,
                        configurable: true
                    });
                    files.push(file);
                } else if (entry.kind === 'directory') {
                    const subFiles = await this.getFilesFromDirectoryHandle(entry, relativePath);
                    files.push(...subFiles);
                }
            }
        } catch (err) {
            console.error('Error scanning directory handle:', err);
        }
        
        return files;
    },
    
    /**
     * Handle folder selection (Optimized to bundle complete folder structure)
     * @param {FileList|Array} files - Selected files from folder
     */
    async handleFolderSelect(files) {
        // Validation: If no files selected, show error message as required
        if (!files || files.length === 0) {
            this.showToast("No files found in the selected folder", 'error');
            return;
        }

        const fileList = Array.from(files);
        
        /**
         * LOGGING REQUIREMENTS:
         * 1. Total number of files
         * 2. name, size, and webkitRelativePath for each file
         */
        Utils.log(`📂 Folder selection detected: ${fileList.length} files total.`);

        /**
         * TECHNICAL NOTES & BROWSER COMPATIBILITY:
         * - webkitRelativePath: REQUIRED to preserve folder structure. It contains the path 
         *   relative to the selected root directory. file.name only provides the base name.
         * - JSZip is used here to bundle the structure into a single ZIP file. This is the 
         *   only way to "share a complete folder" that the receiver can download as one unit
         *   without losing hierarchy due to browser security restrictions.
         * - Browser Limitation: Standard <input webkitdirectory> DOES NOT capture empty folders.
         *   It only iterates over files. Empty subfolders are handled gracefully by exclusion.
         * - Dialog Behavior: The system dialog shows "Open" or "Select Folder" because it's
         *   triggering a directory picker.
         * - Compatibility: Optimized for Chrome, Edge, and Brave.
         */
        
        // Log each file's details as requested
        fileList.forEach((file, index) => {
            const path = file.webkitRelativePath || file.p2pPath || file.name;
            Utils.log(`[File ${index + 1}] Name: ${file.name}, Size: ${file.size} bytes, Path: ${path}`);
        });

        // Determine the root folder name for the ZIP filename
        let folderName = "folder_archive";
        const firstFile = fileList[0];
        const initialPath = firstFile.webkitRelativePath || firstFile.p2pPath;
        if (initialPath) {
            const parts = initialPath.split('/');
            if (parts.length > 0) folderName = parts[0];
        }

        this.showToast(`Bundling '${folderName}' (${fileList.length} files)...`, 'info');

        try {
            const zip = new JSZip();
            
            // Add all files to the ZIP preserving their relative paths
            fileList.forEach(file => {
                const path = file.webkitRelativePath || file.p2pPath || file.name;
                zip.file(path, file);
            });
            
            // Generate the ZIP blob
            // Using DEFLATE compression to optimize transfer speed vs size
            const zipBlob = await zip.generateAsync({
                type: "blob",
                compression: "DEFLATE",
                compressionOptions: { level: 6 }
            });
            
            // Create a pseudo-file object for the ZIP bundle
            const zipFile = new File([zipBlob], `${folderName}.zip`, {
                type: "application/zip",
                lastModified: Date.now()
            });

            // Prepare metadata for transfer
            zipFile.p2pMetadata = {
                fileName: zipFile.name,
                fileSize: zipFile.size,
                isFolderBundle: true,
                originalFolderName: folderName,
                filesCount: fileList.length
            };

            Utils.log(`✅ Folder '${folderName}' successfully bundled: ${Utils.formatBytes(zipFile.size)}`);
            
            // Send the bundled folder as a single ZIP
            App.sendFile(zipFile);
            
        } catch (error) {
            console.error("Error bundling folder:", error);
            this.showToast("Failed to bundle folder structure", 'error');
        }
    },
    
    /**
     * Recursively scan entry for files
     * @param {FileSystemEntry} entry - File or Directory entry
     * @returns {Promise<File[]>} List of files
     */
    async scanEntry(entry) {
        if (entry.isFile) {
            return new Promise(resolve => {
                entry.file(file => {
                    // Attach full path for folder structure
                    // Remove leading slash if present
                    const path = entry.fullPath.startsWith('/') ? entry.fullPath.substring(1) : entry.fullPath;
                    // We can't overwrite webkitRelativePath (read-only), so we add a custom property
                    Object.defineProperty(file, 'p2pPath', {
                        value: path,
                        writable: false
                    });
                    resolve([file]);
                });
            });
        } else if (entry.isDirectory) {
            return new Promise(resolve => {
                const reader = entry.createReader();
                const files = [];
                
                const readEntries = () => {
                    reader.readEntries(async entries => {
                        if (entries.length === 0) {
                            resolve(files);
                        } else {
                            const promises = entries.map(e => this.scanEntry(e));
                            const results = await Promise.all(promises);
                            results.flat().forEach(f => files.push(f));
                            readEntries(); // Continue reading
                        }
                    }, error => {
                        console.error('Error reading directory:', error);
                        resolve(files);
                    });
                };
                
                readEntries();
            });
        }
        return [];
    },
    
    /**
     * Show file transfer progress
     * @param {object} progress - Progress data
     */
    showTransferProgress(progress) {
        if (!this.elements.transferList) return;
        
        let activeItem = document.getElementById('active-transfer-item');
        if (!activeItem) {
            // If it doesn't exist (e.g. first call after shift), refresh the queue
            this.updateFileQueue(FileTransferManager.sendQueue);
            activeItem = document.getElementById('active-transfer-item');
        }

        if (activeItem) {
            const percent = Math.round((progress.transferred / progress.total) * 100);
            
            // Update percentage
            const percentEl = activeItem.querySelector('.transfer-percentage');
            if (percentEl) percentEl.textContent = percent + '%';
            
            // Update speed
            const speedEl = activeItem.querySelector('.transfer-speed');
            if (speedEl) speedEl.textContent = Utils.formatSpeed(progress.speed);
            
            // Update progress bar
            const fillEl = activeItem.querySelector('.progress-fill-compact');
            if (fillEl) fillEl.style.width = percent + '%';

            // Mark completed if finished
            if (percent >= 100) {
                activeItem.classList.remove('sending', 'receiving');
                activeItem.classList.add('completed');
                
                const tag = activeItem.querySelector('.transfer-status-tag');
                if (tag) {
                    tag.textContent = 'Completed';
                    tag.className = 'transfer-status-tag status-completed';
                }

                // Replace controls with download button on completion if receiving
                const controls = activeItem.querySelector('.transfer-item-controls');
                if (controls) {
                    const isReceiving = activeItem.classList.contains('received-item') || 
                                       activeItem.querySelector('.transfer-status-tag').textContent.toLowerCase().includes('receiv');
                    
                    if (isReceiving) {
                        // For received items, show download button
                        controls.innerHTML = `<button class="download-btn" title="Download file">Download</button>`;
                        const downloadBtn = controls.querySelector('.download-btn');
                        if (downloadBtn) {
                            downloadBtn.addEventListener('click', () => {
                                // Extract file data from FileTransferManager
                                const fileData = FileTransferManager.receivedFiles.find(f => f.name === progress.fileName);
                                if (fileData) {
                                    this.downloadFile(fileData);
                                } else {
                                    this.showToast("File data not found. Please check History tab.", "error");
                                }
                            });
                        }
                    } else {
                        // For sent items, just remove controls
                        controls.remove();
                    }
                }
            }
        }
    },
    
    /**
     * Hide transfer progress
     */
    hideTransferProgress() {
        if (this.elements.activeTransferContainer) {
            this.elements.activeTransferContainer.classList.add('hidden');
        }
    },
    
    /**
     * Add a received file to the list
     * @param {object} fileData - Received file information
     */
    addReceivedFile(fileData) {
        fileData.direction = 'RECEIVED';
        this.HistoryManager.save(fileData);
        this.showToast(`Received: ${fileData.name}. Check History tab to download.`, 'success');
    },

    /**
     * Add a sent file to the list
     * @param {object} fileData - Sent file information
     */
    addSentFile(fileData) {
        fileData.direction = 'SENT';
        this.HistoryManager.save(fileData);
    },

    /**
     * Create a file item component (Reusable)
     */
    createFileItem(fileData, isReceived = false, direction = 'RECEIVED') {
        const item = document.createElement('div');
        item.className = 'received-item'; // Both use same base style now
        
        const isFolder = fileData.isFolderBundle || false;
        const icon = isFolder ? 
            `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>` : 
            Utils.getFileIcon(fileData.name);

        const directionTag = `<span class="transfer-tag ${direction.toLowerCase()}">${direction}</span>`;

        const content = `
            <div class="file-item-content">
                <span class="file-icon-static">${icon}</span>
                <div class="file-item-info">
                    <div class="file-name-row">
                        <span class="file-name" title="${fileData.name}">${fileData.name}</span>
                        ${directionTag}
                    </div>
                    <p class="file-size">${Utils.formatBytes(fileData.size)} ${isFolder ? `• ${fileData.filesCount} files` : ''}</p>
                </div>
            </div>
            ${isReceived && fileData.data ? `<button class="download-btn" aria-label="Download file">${isFolder ? 'Download Folder' : 'Download'}</button>` : ''}
        `;
        
        item.innerHTML = content;
        
        if (isReceived) {
            item.querySelector('.download-btn').addEventListener('click', () => {
                this.downloadFile(fileData);
            });
        }
        
        return item;
    },
    /**
     * Download received file
     * @param {object} fileData - File data
     */
    downloadFile(fileData) {
        const blob = new Blob([fileData.data], { type: fileData.type || 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileData.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast(`Downloaded: ${fileData.name}`, 'success');
    },
    
    /**
     * Show toast notification
     * @param {string} message - Message to show
     * @param {string} type - Type: 'success', 'error', 'info'
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto-remove after duration
        if (CONFIG.UI.AUTO_HIDE_NOTIFICATIONS) {
            setTimeout(() => {
                toast.style.animation = 'slideIn 0.3s ease reverse';
                setTimeout(() => {
                    toast.remove();
                }, 300);
            }, CONFIG.UI.TOAST_DURATION);
        }
    },
    
    /**
     * Reset UI to initial state
     */
    reset() {
        this.showScreen('welcome');
        if (this.elements.roomCodeInput) this.elements.roomCodeInput.value = '';
        if (this.elements.fileQueue) this.elements.fileQueue.innerHTML = '';
        this.hideTransferProgress();
        this.setRoomNavVisible(false);
        this.updatePeerStatus('disconnected', 'Waiting...');
    },

    /**
     * Show create room screen logic
     */
    showCreateRoom() {
        App.createRoom();
    },

    /**
     * Show join room screen
     */
    showJoinRoom() {
        this.showScreen('join');
    },

    // Error banner methods removed
};

// Expose these for HTML onclicks
window.UI = UI;
