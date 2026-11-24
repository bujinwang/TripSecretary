#!/usr/bin/env node

/**
 * Phase 5: Integrate Section Components
 *
 * This script updates the Singapore Travel Info Screen to use section components
 * for cleaner JSX structure.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Starting Phase 5: Section Component Integration...\n');

const screenPath = path.join(__dirname, '../app/screens/singapore/SingaporeTravelInfoScreen.tsx');

// Read the current screen file
console.log('📖 Reading current screen file...');
let content = fs.readFileSync(screenPath, 'utf8');
const originalLineCount = content.split('\n').length;
console.log(`   Current file: ${originalLineCount} lines\n`);

// Track changes
const changes = [];

// Step 1: Update section component imports
console.log('1️⃣  Updating section component imports...');
const importSectionBefore = `  PassportSection,
  PersonalInfoSection,
  FundsSection,
  TravelDetailsSection,
} from '../../components/singapore/sections';`;

const importSectionAfter = `  PassportSectionContent,
  PersonalInfoSectionContent,
  FundsSectionContent,
  TravelDetailsSectionContent,
} from '../../components/singapore/sections';`;

if (content.includes(importSectionBefore)) {
  content = content.replace(importSectionBefore, importSectionAfter);
  changes.push('✅ Section component imports updated');
} else {
  changes.push('ℹ️  Section imports not found or already updated');
}

// Step 2: Replace Passport Section content
console.log('2️⃣  Replacing Passport Section JSX...');
const passportSectionRegex = /<CollapsibleSection\s+title="🛂 Passport Information[\s\S]*?<\/CollapsibleSection>/;
const passportMatch = content.match(passportSectionRegex);

if (passportMatch) {
  // Extract the CollapsibleSection props
  const passportReplacement = `<CollapsibleSection
          title="🛂 Passport Information / 护照信息"
          subtitle="Your passport is your ID to enter Singapore / 护照是进入新加坡的身份凭证"
          isExpanded={formState.expandedSection === 'passport'}
          onToggle={() => formState.setExpandedSection(expandedSection === 'passport' ? null : 'passport')}
          fieldCount={getFieldCount('passport')}
        >
          <PassportSectionContent
            formState={formState}
            handleFieldBlur={handleFieldBlur}
            debouncedSaveData={debouncedSaveData}
            lastEditedField={lastEditedField}
            styles={styles}
          />
        </CollapsibleSection>`;

  content = content.replace(passportSectionRegex, passportReplacement);
  changes.push('✅ Passport Section replaced with component');
} else {
  changes.push('⚠️  Passport Section pattern not found');
}

// Step 3: Replace Personal Info Section content
console.log('3️⃣  Replacing Personal Info Section JSX...');
const personalSectionRegex = /<CollapsibleSection\s+title="ℹ️ Personal Information[\s\S]*?<\/View>\s*<\/CollapsibleSection>/;
const personalMatch = content.match(personalSectionRegex);

if (personalMatch) {
  const personalReplacement = `<CollapsibleSection
          title="ℹ️ Personal Information / 个人信息"
          subtitle="Singapore needs your basic information / 新加坡需要了解你的基本信息"
          isExpanded={formState.expandedSection === 'personal'}
          onToggle={() => formState.setExpandedSection(expandedSection === 'personal' ? null : 'personal')}
          fieldCount={getFieldCount('personal')}
        >
          <PersonalInfoSectionContent
            formState={formState}
            handleFieldBlur={handleFieldBlur}
            debouncedSaveData={debouncedSaveData}
            renderGenderOptions={renderGenderOptions}
            lastEditedField={lastEditedField}
            styles={styles}
          />
        </CollapsibleSection>`;

  content = content.replace(personalSectionRegex, personalReplacement);
  changes.push('✅ Personal Info Section replaced with component');
} else {
  changes.push('⚠️  Personal Info Section pattern not found');
}

// Step 4: Replace Funds Section content
console.log('4️⃣  Replacing Funds Section JSX...');
const fundsSectionRegex = /<CollapsibleSection\s+title="💰 Funds Proof[\s\S]*?(?=<CollapsibleSection\s+title="✈️)/;
const fundsMatch = content.match(fundsSectionRegex);

if (fundsMatch) {
  const fundsReplacement = `<CollapsibleSection
          title="💰 Funds Proof / 资金证明"
          subtitle="Show Singapore you have enough funds for your trip / 告诉新加坡你有足够的旅行资金"
          isExpanded={formState.expandedSection === 'funds'}
          onToggle={() => formState.setExpandedSection(expandedSection === 'funds' ? null : 'funds')}
          fieldCount={getFieldCount('funds')}
        >
          <FundsSectionContent
            formState={formState}
            addFund={addFund}
            editFundItem={editFundItem}
            t={t}
            styles={styles}
          />
        </CollapsibleSection>

        `;

  content = content.replace(fundsSectionRegex, fundsReplacement);
  changes.push('✅ Funds Section replaced with component');
} else {
  changes.push('⚠️  Funds Section pattern not found');
}

// Step 5: Replace Travel Details Section content
console.log('5️⃣  Replacing Travel Details Section JSX...');
const travelSectionRegex = /<CollapsibleSection\s+title="✈️ Travel Details[\s\S]*?(?=<\/ScrollView>)/;
const travelMatch = content.match(travelSectionRegex);

if (travelMatch) {
  const travelReplacement = `<CollapsibleSection
          title="✈️ Travel Details / 旅程信息"
          subtitle="Tell Singapore about your trip / 告诉新加坡你的旅程"
          isExpanded={formState.expandedSection === 'travel'}
          onToggle={() => formState.setExpandedSection(expandedSection === 'travel' ? null : 'travel')}
          fieldCount={getFieldCount('travel')}
        >
          <TravelDetailsSectionContent
            formState={formState}
            handleFieldBlur={handleFieldBlur}
            debouncedSaveData={debouncedSaveData}
            lastEditedField={lastEditedField}
            styles={styles}
          />
        </CollapsibleSection>

        `;

  content = content.replace(travelSectionRegex, travelReplacement);
  changes.push('✅ Travel Details Section replaced with component');
} else {
  changes.push('⚠️  Travel Details Section pattern not found');
}

// Save the updated file
console.log('\n💾 Saving updated file...');
const outputPath = path.join(__dirname, '../app/screens/singapore/SingaporeTravelInfoScreen.sections.tsx');
fs.writeFileSync(outputPath, content, 'utf8');

const newLineCount = content.split('\n').length;
const lineReduction = originalLineCount - newLineCount;
const reductionPercent = ((lineReduction / originalLineCount) * 100).toFixed(1);

console.log(`   ✅ Saved to: SingaporeTravelInfoScreen.sections.js`);
console.log(`   📊 Original: ${originalLineCount} lines`);
console.log(`   📊 With sections: ${newLineCount} lines`);
console.log(`   📊 Reduction: ${lineReduction} lines (-${reductionPercent}%)\n`);

// Print summary
console.log('📋 Integration Summary:\n');
changes.forEach(change => console.log(`   ${change}`));

console.log('\n🧪 Next steps:');
console.log('   1. Review the .sections.js file');
console.log('   2. Update section components to match implementation');
console.log('   3. Run syntax check');
console.log('   4. Replace original file when ready\n');

console.log('🎉 Phase 5 script complete!');
