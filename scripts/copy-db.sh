#!/bin/bash

# Find the most recently used simulator directory
SIMULATOR_DIR=$(ls -t ~/Library/Developer/CoreSimulator/Devices/ | head -n 1)
SIMULATOR_PATH=~/Library/Developer/CoreSimulator/Devices/$SIMULATOR_DIR

# Find the database file within the simulator directory
DB_PATH=$(find "$SIMULATOR_PATH" -name "tripsecretary_secure" 2>/dev/null | head -n 1)

# Check if the database file was found
if [ -z "$DB_PATH" ]; then
    echo "Error: Could not find the 'tripsecretary_secure' database file."
    echo "Please make sure you have run the app in the iOS Simulator at least once."
    exit 1
fi

# Copy the database file to the project root
cp "$DB_PATH" ./tripsecretary_secure.db

echo "✅ Database file 'tripsecretary_secure.db' has been copied to the project root."
echo "You can now open 'database-browser.html' and select the copied file."
