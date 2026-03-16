/**
 * PeerDrop Theme Manager
 * 
 * Handles Light/Dark mode transitions and persistence
 */

const ThemeManager = {
    init() {
        this.themeToggle = document.getElementById('themeToggle');
        if (!this.themeToggle) return;

        this.setupEventListeners();
    },

    setupEventListeners() {
        this.themeToggle.addEventListener('click', () => {
            this.toggleTheme();
        });

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('peerdrop_theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                this.setTheme(newTheme);
            }
        });
    },

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    },

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('peerdrop_theme', theme);
        
        // Optional: Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#0F172A' : '#F8FAFC');
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ThemeManager.init();
});
