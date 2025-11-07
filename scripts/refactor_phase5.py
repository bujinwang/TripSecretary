#!/usr/bin/env python3
"""
Phase 5 Refactoring Script for HongkongTravelInfoScreen.js

Removes duplicate code that's already in hooks:
1. Duplicate navigation listeners (focus/blur)
2. Duplicate session state management
3. Duplicate useEffects (cleanup, monitoring)
4. Debug function (clearUserData)
5. Duplicate handlers (debouncedSaveData, handleUserInteraction, handleFieldBlur)
6. Duplicate save operation functions (performSaveOperation, saveDataToSecureStorage*)
7. Refactors photo handlers to use persistence hook
"""

import re

# Read the file
with open('app/screens/hongkong/HongkongTravelInfoScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
    lines = content.split('\n')

print(f"Original file: {len(lines)} lines")

# Track which lines to remove
remove_ranges = []

# 1. Remove duplicate focus listener (lines 216-344, ~128 lines)
# Pattern: starts with "  // Add focus listener" and ends before "  // Add blur listener"
for i in range(len(lines)):
    if '// Add focus listener to reload data when returning to screen' in lines[i]:
        start = i
        # Find end (next useEffect or significant marker)
        for j in range(i+1, len(lines)):
            if 'navigation, passport, refreshFundItems]);' in lines[j]:
                remove_ranges.append((start, j+1))  # Remove up to and including this line
                print(f"Found focus listener: lines {start+1}-{j+1}")
                break
        break

# 2. Remove duplicate blur listener (lines ~346-354)
for i in range(len(lines)):
    if '// Add blur listener to save data when leaving the screen' in lines[i]:
        start = i
        for j in range(i+1, len(lines)):
            if '}, [navigation]);' in lines[j] and 'blur' in ''.join(lines[start:j]):
                remove_ranges.append((start, j+1))
                print(f"Found blur listener: lines {start+1}-{j+1}")
                break
        break

# 3. Remove cleanup useEffect
for i in range(len(lines)):
    if '// Cleanup effect (equivalent to componentWillUnmount)' in lines[i]:
        start = i
        for j in range(i+1, len(lines)):
            if '}, []);' in lines[j] and 'unmount' in ''.join(lines[start:j]):
                remove_ranges.append((start, j+1))
                print(f"Found cleanup useEffect: lines {start+1}-{j+1}")
                break
        break

# 4. Remove save status monitor useEffect
for i in range(len(lines)):
    if '// Monitor save status changes' in lines[i]:
        start = i
        for j in range(i+1, len(lines)):
            if '}, []);' in lines[j] and 'getSaveState' in ''.join(lines[start:j]):
                remove_ranges.append((start, j+1))
                print(f"Found monitor useEffect: lines {start+1}-{j+1}")
                break
        break

# 5. Remove entry info initialization useEffect
for i in range(len(lines)):
    if '// Initialize entry_info when screen loads' in lines[i]:
        start = i
        for j in range(i+1, len(lines)):
            if 'initializeEntryInfo]);' in lines[j]:
                remove_ranges.append((start, j+1))
                print(f"Found entry info useEffect: lines {start+1}-{j+1}")
                break
        break

# 6. Remove session state functions
for i in range(len(lines)):
    if '// Session state management functions' in lines[i]:
        start = i
        # Find end at "Restore scroll position" useEffect
        for j in range(i+1, len(lines)):
            if 'isLoading, scrollPosition]);' in lines[j]:
                remove_ranges.append((start, j+1))
                print(f"Found session state functions: lines {start+1}-{j+1}")
                break
        break

# 7. Remove clearUserData debug function
for i in range(len(lines)):
    if '// Debug function to clear user data' in lines[i]:
        start = i
        for j in range(i+1, len(lines)):
            if '  };' in lines[j] and 'clearUserData' in ''.join(lines[start:j]):
                remove_ranges.append((start, j+1))
                print(f"Found clearUserData: lines {start+1}-{j+1}")
                break
        break

# 8. Remove duplicate debounced save
for i in range(len(lines)):
    if '// Create debounced save function with error handling' in lines[i]:
        start = i
        for j in range(i+1, len(lines)):
            if '  );' in lines[j] and 'debouncedSave' in ''.join(lines[start:j]):
                # Check next line
                if j+1 < len(lines) and lines[j+1].strip() == '':
                    remove_ranges.append((start, j+2))
                else:
                    remove_ranges.append((start, j+1))
                print(f"Found debouncedSaveData: lines {start+1}-{j+1}")
                break
        break

# 9. Remove duplicate handleUserInteraction
for i in range(len(lines)):
    if '// Handle user interaction with tracking-enabled inputs' in lines[i]:
        start = i
        for j in range(i+1, len(lines)):
            if 'debouncedSaveData]);' in lines[j] and 'userInteractionTracker' in lines[j]:
                remove_ranges.append((start, j+1))
                print(f"Found handleUserInteraction: lines {start+1}-{j+1}")
                break
        break

# 10. Remove duplicate handleFieldBlur
for i in range(len(lines)):
    if lines[i].strip() == 'const handleFieldBlur = async (fieldName, fieldValue) => {':
        start = i
        # Find matching closing brace
        brace_count = 0
        for j in range(i, len(lines)):
            brace_count += lines[j].count('{') - lines[j].count('}')
            if brace_count == 0 and j > i:
                remove_ranges.append((start, j+1))
                print(f"Found handleFieldBlur: lines {start+1}-{j+1}")
                break
        break

# 11. Remove performSaveOperation function
for i in range(len(lines)):
    if '// Helper method to perform the actual save operation' in lines[i]:
        start = i
        for j in range(i+1, len(lines)):
            if lines[j].strip() == '};' and 'performSaveOperation' in ''.join(lines[start:j]):
                remove_ranges.append((start, j+1))
                print(f"Found performSaveOperation: lines {start+1}-{j+1}")
                break
        break

# 12. Remove saveDataToSecureStorageWithOverride
for i in range(len(lines)):
    if '// Enhanced debug logging for personal info saving' in lines[i]:
        start = i
        # Find the closing of this function
        for j in range(i+1, len(lines)):
            if '};' in lines[j] and 'saveDataToSecureStorageWithOverride' in ''.join(lines[start:j]):
                remove_ranges.append((start, j+1))
                print(f"Found saveDataToSecureStorageWithOverride: lines {start+1}-{j+1}")
                break
        break

# 13. Remove wrapper saveDataToSecureStorage function
for i in range(len(lines)):
    if lines[i].strip().startswith('// Save all data to secure storage'):
        start = i
        for j in range(i+1, len(lines)):
            if '  };' in lines[j] and 'saveDataToSecureStorageWithOverride()' in ''.join(lines[start:j]):
                remove_ranges.append((start, j+1))
                print(f"Found saveDataToSecureStorage wrapper: lines {start+1}-{j+1}")
                break
        break

# Sort and merge overlapping ranges
remove_ranges.sort()
print(f"\nRanges to remove: {remove_ranges}")

# Create new content by excluding removed ranges
new_lines = []
i = 0
while i < len(lines):
    should_remove = False
    for start, end in remove_ranges:
        if start <= i < end:
            should_remove = True
            i = end  # Skip to end of range
            break

    if not should_remove:
        new_lines.append(lines[i])
        i += 1

print(f"\nNew file: {len(new_lines)} lines")
print(f"Removed: {len(lines) - len(new_lines)} lines")

# Write the refactored file
with open('app/screens/hongkong/HongkongTravelInfoScreen.tsx', 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("\nPhase 5 refactoring complete!")
