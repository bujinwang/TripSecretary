#!/bin/bash

# Script to find the most recent TDAC PDF file in iOS Simulator
# Usage: ./find-tdac-pdf.sh

DEVICE_ID="69A62B34-93E6-4C79-89E8-3674756671DA"
BASE_PATH="$HOME/Library/Developer/CoreSimulator/Devices/$DEVICE_ID/data/Containers/Data/Application"

echo "🔍 Searching for TDAC PDF files..."
echo ""

# Method 1: Search for PDF files by name
echo "📄 Method 1: Searching by filename (TDAC_*.pdf)..."
PDF_FILES=$(find "$BASE_PATH" -name "TDAC_*.pdf" -type f 2>/dev/null)

if [ -n "$PDF_FILES" ]; then
    echo "✅ Found TDAC PDF files:"
    echo "$PDF_FILES" | while read -r file; do
        SIZE=$(ls -lh "$file" | awk '{print $5}')
        MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file")
        echo "  📋 File: $file"
        echo "     Size: $SIZE"
        echo "     Modified: $MODIFIED"
        echo ""
    done

    # Get the most recent one
    MOST_RECENT=$(find "$BASE_PATH" -name "TDAC_*.pdf" -type f 2>/dev/null | xargs ls -t 2>/dev/null | head -1)
    if [ -n "$MOST_RECENT" ]; then
        echo "🎯 Most recent PDF: $MOST_RECENT"
        echo ""
        echo "To open: open \"$MOST_RECENT\""
    fi
else
    echo "❌ No TDAC_*.pdf files found"
fi

echo ""
echo "📄 Method 2: Searching for any PDF files..."
ALL_PDFS=$(find "$BASE_PATH" -name "*.pdf" -type f 2>/dev/null)

if [ -n "$ALL_PDFS" ]; then
    echo "✅ Found PDF files:"
    echo "$ALL_PDFS" | while read -r file; do
        FILENAME=$(basename "$file")
        SIZE=$(ls -lh "$file" | awk '{print $5}')
        MODIFIED=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$file")
        echo "  📋 $FILENAME"
        echo "     Path: $file"
        echo "     Size: $SIZE"
        echo "     Modified: $MODIFIED"
        echo ""
    done
else
    echo "❌ No PDF files found in Documents directory"
    echo ""
    echo "💡 This might mean:"
    echo "   1. No TDAC submission has been completed yet"
    echo "   2. The PDF save failed during submission"
    echo "   3. The PDF is stored in a different location"
fi

echo ""
echo "📱 Method 3: Checking app's Documents directory..."
APP_DOCS=$(find "$BASE_PATH" -type d -name "Documents" 2>/dev/null | grep -v "WebKit" | head -1)
if [ -n "$APP_DOCS" ]; then
    echo "✅ App Documents directory: $APP_DOCS"
    echo "   Contents:"
    ls -lah "$APP_DOCS" 2>/dev/null | tail -n +4
else
    echo "❌ Could not find app Documents directory"
fi

echo ""
echo "💾 Method 4: Checking for TDAC data in AsyncStorage..."
# Find the AsyncStorage/ExpoFileSystem directory
ASYNC_STORAGE=$(find "$BASE_PATH" -type d -name "ExponentExperienceData" 2>/dev/null | head -1)
if [ -n "$ASYNC_STORAGE" ]; then
    echo "✅ Found Expo storage: $ASYNC_STORAGE"
    echo "   Looking for TDAC entries..."
    grep -r "tdac_qr_" "$ASYNC_STORAGE" 2>/dev/null | head -5
    grep -r "TDAC_" "$ASYNC_STORAGE" 2>/dev/null | head -5
fi

echo ""
echo "✅ Search complete!"
echo ""
echo "💡 TIP: After submitting a TDAC form, check the app console for:"
echo "   'LOG  ✅ PDF saved to app storage: <path>'"
echo "   This will show you the exact path where the PDF was saved."
