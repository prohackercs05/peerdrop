#!/bin/bash

echo "========================================"
echo "  PeerDrop Frontend - Starting Server"
echo "========================================"
echo ""

# Check if Python is installed
if command -v python3 &> /dev/null; then
    echo "Python found! Starting HTTP server on port 3000..."
    echo ""
    echo "Open your browser and go to: http://localhost:3000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    cd "$(dirname "$0")"
    python3 -m http.server 3000
    exit 0
fi

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "Node.js found! Installing serve..."
    npx -y serve -p 3000
    exit 0
fi

# Check if PHP is installed
if command -v php &> /dev/null; then
    echo "PHP found! Starting HTTP server on port 3000..."
    echo ""
    echo "Open your browser and go to: http://localhost:3000"
    echo ""
    cd "$(dirname "$0")"
    php -S localhost:3000
    exit 0
fi

# No server found
echo "ERROR: No HTTP server found!"
echo ""
echo "Please install one of the following:"
echo "  - Python: https://www.python.org/downloads/"
echo "  - Node.js: https://nodejs.org/"
echo "  - PHP: https://www.php.net/downloads"
echo ""
echo "Or use VS Code with Live Server extension"
echo ""
exit 1
