/**
 * PeerDrop Utility Functions
 * 
 * Helper functions used throughout the application
 */

const Utils = {
    /**
     * Format bytes to human-readable size
     * @param {number} bytes - Number of bytes
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted size string
     */
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    
    /**
     * Format speed (bytes per second) to human-readable format
     * @param {number} bytesPerSecond - Bytes per second
     * @returns {string} Formatted speed string
     */
    formatSpeed(bytesPerSecond) {
        return this.formatBytes(bytesPerSecond) + '/s';
    },
    
    /**
     * Format time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        if (!isFinite(seconds) || seconds < 0) return '--:--';
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    /**
     * Calculate ETA based on transferred bytes and speed
     * @param {number} totalBytes - Total file size
     * @param {number} transferredBytes - Bytes transferred so far
     * @param {number} bytesPerSecond - Current transfer speed
     * @returns {number} ETA in seconds
     */
    calculateETA(totalBytes, transferredBytes, bytesPerSecond) {
        if (bytesPerSecond === 0) return Infinity;
        
        const remainingBytes = totalBytes - transferredBytes;
        return remainingBytes / bytesPerSecond;
    },
    
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    /**
     * Validate room code format
     * @param {string} code - Room code to validate
     * @returns {boolean} True if valid
     */
    isValidRoomCode(code) {
        if (!code || typeof code !== 'string') return false;
        
        // Must be exactly 6 characters, alphanumeric
        const regex = /^[A-Z0-9]{6}$/;
        return regex.test(code.toUpperCase());
    },
    
    /**
     * Sanitize filename
     * @param {string} filename - Original filename
     * @returns {string} Sanitized filename
     */
    sanitizeFilename(filename) {
        // Remove path separators and other dangerous characters
        return filename.replace(/[/\\?%*:|"<>]/g, '-');
    },
    
    /**
     * Get file icon based on file type
     * @param {string} filename - File name
     * @returns {string} Emoji icon
     */
    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        
        // Common SVG styles
        const svgStyle = 'width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
        
        const fileIcon = `<svg ${svgStyle}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>`;
        const imageIcon = `<svg ${svgStyle}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`;
        const videoIcon = `<svg ${svgStyle}><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`;
        const audioIcon = `<svg ${svgStyle}><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>`;
        const archiveIcon = `<svg ${svgStyle}><polyline points="21 8 21 21 3 21 3 8"></polyline><rect x="1" y="3" width="22" height="5"></rect><line x1="10" y1="12" x2="14" y2="12"></line></svg>`;
        const codeIcon = `<svg ${svgStyle}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
        
        const iconMap = {
            // Images
            'jpg': imageIcon, 'jpeg': imageIcon, 'png': imageIcon, 'gif': imageIcon, 
            'svg': imageIcon, 'webp': imageIcon, 'bmp': imageIcon,
            
            // Videos
            'mp4': videoIcon, 'avi': videoIcon, 'mov': videoIcon, 'wmv': videoIcon,
            'flv': videoIcon, 'mkv': videoIcon, 'webm': videoIcon,
            
            // Audio
            'mp3': audioIcon, 'wav': audioIcon, 'ogg': audioIcon, 'flac': audioIcon,
            'aac': audioIcon, 'm4a': audioIcon,
            
            // Archives
            'zip': archiveIcon, 'rar': archiveIcon, '7z': archiveIcon, 'tar': archiveIcon,
            'gz': archiveIcon, 'bz2': archiveIcon,
            
            // Code
            'js': codeIcon, 'html': codeIcon, 'css': codeIcon, 'json': codeIcon,
            'xml': codeIcon, 'py': codeIcon, 'java': codeIcon, 'cpp': codeIcon,
            'c': codeIcon, 'php': codeIcon, 'rb': codeIcon, 'go': codeIcon,
            
            // Default
            'default': fileIcon
        };
        
        return iconMap[ext] || iconMap['default'];
    },
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textarea);
                return success;
            }
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    },
    
    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Log with timestamp (only in debug mode)
     * @param {string} message - Message to log
     * @param {any} data - Optional data to log
     */
    log(message, data = null) {
        if (!CONFIG.DEBUG) return;
        
        const timestamp = new Date().toLocaleTimeString();
        if (data !== null) {
            console.log(`[${timestamp}] ${message}`, data);
        } else {
            console.log(`[${timestamp}] ${message}`);
        }
    },
    
    /**
     * Check if browser supports required features
     * @returns {object} Support status
     */
    checkBrowserSupport() {
        return {
            webrtc: !!(window.RTCPeerConnection),
            websocket: !!(window.WebSocket),
            fileApi: !!(window.File && window.FileReader && window.FileList && window.Blob),
            supported: !!(window.RTCPeerConnection && window.WebSocket && window.File)
        };
    }
};

// Check browser support on load
if (CONFIG.DEBUG) {
    const support = Utils.checkBrowserSupport();
    console.log('🌐 Browser Support:', support);
    
    if (!support.supported) {
        console.error('❌ Browser does not support required features!');
    }
}
