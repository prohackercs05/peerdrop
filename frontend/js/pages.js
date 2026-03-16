/**
 * PeerDrop Static Pages Logic
 * 
 * Handles navigation, FAQ accordion, and contact form for static pages.
 * Extends the existing UI system without modifying it.
 */

const Pages = {
    init() {
        if (typeof UI === 'undefined' || !UI.screens) {
            console.error('UI system not initialized. Retrying in 100ms...');
            setTimeout(() => this.init(), 100);
            return;
        }

        console.log('📖 Initializing Pages System...');

        // 1. Register new screens to UI.screens
        const newScreens = [
            'about', 'howItWorks', 'security', 'faq', 'contact', 
            'privacy', 'terms', 'roomExpired', 'notFound', 'error', 
            'history', 'settings', 'mobile', 'connectionStatus'
        ];

        newScreens.forEach(screenName => {
            const element = document.getElementById(screenName + 'Screen');
            if (element) {
                UI.screens[screenName] = element;
            }
        });

        // 2. Setup Navigation
        this.setupNavigation();

        // 3. Setup FAQ Accordion
        this.setupAccordion();

        // 4. Setup Contact Form
        this.setupContactForm();
        
        // 5. Check URL hash
        this.checkHashNavigation();
        window.addEventListener('hashchange', () => this.checkHashNavigation());

        console.log('✅ Pages System Ready');
    },

    setupNavigation() {
        const navLinks = document.querySelectorAll('[data-page]');
        
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const pageName = link.getAttribute('data-page');
                
                // Special case for 'welcome' -> Home
                if (pageName === 'welcome') {
                    // Check if we are in a room
                    if (typeof App !== 'undefined' && App.currentRoom) {
                        if (confirm('Leave current room? Connection will be closed.')) {
                            App.leaveRoom();
                        }
                    } else {
                        UI.showScreen('welcome');
                    }
                } 
                else if (pageName === 'connectionStatus') {
                    UI.showScreen('connectionStatus');
                    this.refreshStats();
                }
                else {
                    UI.showScreen(pageName);
                }
                
                // Update active state in navbar
                this.updateActiveLink(pageName);
                
                // Scroll to top
                window.scrollTo(0, 0);
            });
        });
    },

    updateActiveLink(activePage) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const page = link.getAttribute('data-page');
            if (page === activePage) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    },

    setupAccordion() {
        const questions = document.querySelectorAll('.faq-question');
        
        questions.forEach(question => {
            question.addEventListener('click', () => {
                const item = question.parentElement;
                const isActive = item.classList.contains('active');
                
                document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
                
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        });
    },

    setupContactForm() {
        const form = document.getElementById('contactForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const btn = form.querySelector('button[type="submit"]');
                const originalText = btn.textContent;
                btn.textContent = 'Sending...';
                btn.disabled = true;
                
                setTimeout(() => {
                    if (typeof UI !== 'undefined' && UI.showToast) {
                        UI.showToast('Message sent! We will get back to you soon.', 'success');
                    } else {
                        alert('Message sent!');
                    }
                    
                    form.reset();
                    btn.textContent = originalText;
                    btn.disabled = false;
                }, 1500);
            });
        }
    },
    
    checkHashNavigation() {
        const hash = window.location.hash.substring(1); // remove #
        if (hash) {
            if (UI.screens[hash]) {
                UI.showScreen(hash);
                this.updateActiveLink(hash);
                
                if (hash === 'connectionStatus') {
                    this.refreshStats();
                }
            } else {
                // Show 404 if hash not found (and not empty)
                UI.showScreen('notFound');
            }
        }
    },
    
    async refreshStats() {
        // Safe check for managers
        if (typeof WebRTCManager === 'undefined' || typeof WebSocketManager === 'undefined') return;
        
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };
        
        // WebSocket Status
        const wsState = WebSocketManager.socket ? WebSocketManager.socket.readyState : -1;
        const wsStates = ['Connecting', 'Open', 'Closing', 'Closed'];
        setText('diag-signaling', wsStates[wsState] || 'Disconnected');
        
        // WebRTC Status
        if (WebRTCManager.peerConnection) {
            setText('diag-webrtc', WebRTCManager.peerConnection.connectionState);
            setText('diag-ice', WebRTCManager.peerConnection.iceConnectionState);
        } else {
            setText('diag-webrtc', 'Not Initialized');
            setText('diag-ice', 'N/A');
        }
        
        // Data Channel
        if (WebRTCManager.dataChannel) {
            setText('diag-channel', WebRTCManager.dataChannel.readyState);
            setText('diag-buffer', Utils.formatBytes(WebRTCManager.dataChannel.bufferedAmount));
        } else {
            setText('diag-channel', 'None');
        }
        
        // Stats
        const stats = await WebRTCManager.getStats();
        if (stats && stats.dataChannel) {
            setText('diag-sent', Utils.formatBytes(stats.dataChannel.bytesSent));
            setText('diag-received', Utils.formatBytes(stats.dataChannel.bytesReceived));
        }
    }
};

window.addEventListener('load', () => {
    setTimeout(() => Pages.init(), 100);
});
