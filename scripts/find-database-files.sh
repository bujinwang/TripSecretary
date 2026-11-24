#!/bin/bash

# Script to find tripsecretary_secure.db files in all iOS simulators
# Run with: bash scripts/find-database-files.sh

echo "🔍 Searching for tripsecretary_secure.db files in iOS simulators..."
echo ""

SIMULATOR_DEVICES_PATH="$HOME/Library/Developer/CoreSimulator/Devices"

if [ ! -d "$SIMULATOR_DEVICES_PATH" ]; then
    echo "❌ Simulator devices path not found: $SIMULATOR_DEVICES_PATH"
    exit 1
fi

# Find all database files
find "$SIMULATOR_DEVICES_PATH" -name "tripsecretary_secure.db" -type f 2>/dev/null | while read dbpath; do
    echo "📊 Found database: $dbpath"
    
    # Get device ID from path
    device_id=$(echo "$dbpath" | sed -E 's|.*/Devices/([^/]+)/.*|\1|')
    
    # Get file info
    size=$(stat -f%z "$dbpath" 2>/dev/null || stat -c%s "$dbpath" 2>/dev/null)
    modified=$(stat -f%Sm "$dbpath" 2>/dev/null || stat -c%y "$dbpath" 2>/dev/null)
    
    echo "   Device ID: $device_id"
    echo "   Size: $((size / 1024)) KB"
    echo "   Modified: $modified"
    
    # Try to get simulator name
    device_info=$(xcrun simctl list devices --json 2>/dev/null | grep -A 5 "\"$device_id\"" | grep -E '"name"|"state"' | head -2)
    if [ ! -z "$device_info" ]; then
        echo "   Simulator: $device_info"
    fi
    
    # Try to count entry_info records
    if command -v sqlite3 &> /dev/null; then
        count=$(sqlite3 "$dbpath" "SELECT COUNT(*) FROM entry_info WHERE user_id = 'user_001';" 2>/dev/null)
        if [ ! -z "$count" ]; then
            echo "   Entry info records for user_001: $count"
            if [ "$count" -eq 9 ]; then
                echo "   ⭐ This database has 9 records!"
            elif [ "$count" -eq 1 ]; then
                echo "   ⚠️  This database only has 1 record"
            fi
        fi
    fi
    
    echo ""
done

echo "✅ Search complete"

