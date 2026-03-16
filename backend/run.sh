#!/bin/bash

echo "========================================"
echo "  PeerDrop Backend - Starting Server"
echo "========================================"
echo ""

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "ERROR: Maven is not installed or not in PATH"
    echo ""
    echo "Please install Maven from: https://maven.apache.org/download.cgi"
    echo "Or use your IDE to run the Spring Boot application"
    exit 1
fi

echo "Maven found! Starting Spring Boot application..."
echo ""

cd "$(dirname "$0")"
mvn spring-boot:run
