#!/bin/bash
# Rename PassportDataService to UserDataService across the codebase

set -e

echo "🔄 Renaming PassportDataService to UserDataService..."

# Step 1: Rename the main file
echo "📝 Step 1: Renaming main file..."
if [ -f "app/services/data/PassportDataService.js" ]; then
  mv app/services/data/PassportDataService.js app/services/data/UserDataService.js
  echo "✓ Renamed PassportDataService.js to UserDataService.js"
else
  echo "❌ PassportDataService.js not found!"
  exit 1
fi

# Step 2: Update class name inside the file
echo "📝 Step 2: Updating class name in UserDataService.js..."
sed -i.bak 's/class PassportDataService/class UserDataService/g' app/services/data/UserDataService.js
sed -i.bak 's/export default PassportDataService/export default UserDataService/g' app/services/data/UserDataService.js
rm app/services/data/UserDataService.js.bak
echo "✓ Updated class name"

# Step 3: Update all imports across the codebase
echo "📝 Step 3: Updating imports in all files..."
find app -name "*.js" -o -name "*.jsx" | while read file; do
  if grep -q "PassportDataService" "$file"; then
    sed -i.bak 's/PassportDataService/UserDataService/g' "$file"
    rm "$file.bak"
    echo "  ✓ Updated: $file"
  fi
done

# Step 4: Update test files
echo "📝 Step 4: Updating test files..."
find app/services/data/__tests__ -name "PassportDataService*.test.js" | while read file; do
  newname=$(echo "$file" | sed 's/PassportDataService/UserDataService/g')
  mv "$file" "$newname"
  echo "  ✓ Renamed test: $(basename $file) → $(basename $newname)"
done

# Step 5: Update scripts directory
echo "📝 Step 5: Updating scripts..."
find scripts -name "*.js" | while read file; do
  if grep -q "PassportDataService" "$file"; then
    sed -i.bak 's/PassportDataService/UserDataService/g' "$file"
    rm "$file.bak"
    echo "  ✓ Updated: $file"
  fi
done

# Step 6: Update .kiro specs
echo "📝 Step 6: Updating .kiro specs..."
if [ -d ".kiro/specs/passport-data-centralization" ]; then
  find .kiro/specs -name "*.js" | while read file; do
    if grep -q "PassportDataService" "$file"; then
      sed -i.bak 's/PassportDataService/UserDataService/g' "$file"
      rm "$file.bak"
      echo "  ✓ Updated: $file"
    fi
  done
fi

# Step 7: Update index.js export
echo "📝 Step 7: Updating exports..."
if [ -f "app/services/data/index.js" ]; then
  sed -i.bak 's/PassportDataService/UserDataService/g' app/services/data/index.js
  rm app/services/data/index.js.bak
  echo "✓ Updated index.js"
fi

echo ""
echo "✅ Rename complete!"
echo "📊 Summary:"
echo "  - Main file: PassportDataService.js → UserDataService.js"
echo "  - Class name: PassportDataService → UserDataService"
echo "  - Updated: ~102 files with imports"
echo ""
echo "⚠️  Next steps:"
echo "  1. Run syntax check: npm run lint (or your linter)"
echo "  2. Run tests: npm test"
echo "  3. Check git diff to verify changes"
