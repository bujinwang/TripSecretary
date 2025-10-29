# Shared Sections - Usage Guide

## Overview

The shared sections are generic, country-agnostic form section components that can be reused across all country travel info screens. They are built entirely with Tamagui components and accept customizable labels and configuration.

## Available Sections

- **PassportSection** - Passport information (name, nationality, passport number, visa, dates, gender)
- **PersonalInfoSection** - Personal details (occupation, residence, contact information)
- **FundsSection** - Proof of funds (cash, cards, bank balance documentation)

## Why Use Shared Sections?

- ✅ **Eliminate duplicate code** - One implementation works for all countries
- ✅ **Consistent UX** - Same look and feel across all countries
- ✅ **Faster development** - Just pass labels and configuration
- ✅ **Easier maintenance** - Fix bugs once, benefit everywhere
- ✅ **Full Tamagui integration** - Modern, responsive design tokens

---

## PassportSection

### Basic Usage

```javascript
import { PassportSection } from '../../components/shared/sections';

<PassportSection
  // Section control
  isExpanded={isPassportExpanded}
  onToggle={() => setIsPassportExpanded(!isPassportExpanded)}
  fieldCount={{ filled: 8, total: 9 }}

  // Form state
  surname={surname}
  middleName={middleName}
  givenName={givenName}
  nationality={nationality}
  passportNo={passportNo}
  visaNumber={visaNumber}
  dob={dob}
  expiryDate={expiryDate}
  sex={sex}

  // Setters
  setSurname={setSurname}
  setMiddleName={setMiddleName}
  setGivenName={setGivenName}
  setNationality={setNationality}
  setPassportNo={setPassportNo}
  setVisaNumber={setVisaNumber}
  setDob={setDob}
  setExpiryDate={setExpiryDate}
  setSex={setSex}

  // Validation
  errors={errors}
  warnings={warnings}
  handleFieldBlur={handleFieldBlur}

  // Actions
  debouncedSaveData={debouncedSaveData}
  saveDataToSecureStorageWithOverride={saveDataToSecureStorageWithOverride}
  setLastEditedAt={setLastEditedAt}

  // Customization (optional)
  labels={{
    title: "护照信息",
    subtitle: "输入您的护照详细信息",
    introText: "请确保所有详细信息与您的护照完全匹配",
    // ... more labels
  }}
  config={{
    showVisaNumber: true,
    genderOptions: [
      { label: '男', value: 'M' },
      { label: '女', value: 'F' },
    ],
  }}
/>
```

### Country-Specific Examples

#### Thailand (Chinese)
```javascript
<PassportSection
  {...allTheProps}
  labels={{
    title: "护照信息",
    subtitle: "输入您的护照详细信息",
    introText: "请确保所有详细信息与您的护照完全匹配",
    fullName: "全名（与护照一致）",
    nationality: "国籍",
    passportNo: "护照号码",
    visaNumber: "签证号码（选填）",
    dob: "出生日期",
    expiryDate: "护照到期日期",
    sex: "性别",
  }}
  config={{
    showVisaNumber: true,
    genderOptions: [
      { label: '男', value: 'M' },
      { label: '女', value: 'F' },
    ],
  }}
/>
```

#### Singapore (English)
```javascript
<PassportSection
  {...allTheProps}
  labels={{
    title: "Passport Information",
    subtitle: "Enter your passport details",
    introText: "Ensure all details match your passport exactly",
    fullName: "Full Name (as in passport)",
    nationality: "Nationality",
    passportNo: "Passport Number",
    visaNumber: "Visa Number (if applicable)",
    dob: "Date of Birth",
    expiryDate: "Passport Expiry Date",
    sex: "Gender",
  }}
  config={{
    showVisaNumber: false, // Singapore often doesn't require visa
    genderOptions: [
      { label: 'Male', value: 'M' },
      { label: 'Female', value: 'F' },
    ],
  }}
/>
```

#### Hong Kong (Cantonese/Chinese)
```javascript
<PassportSection
  {...allTheProps}
  labels={{
    title: "護照資料",
    subtitle: "輸入您的護照詳細資料",
    introText: "請確保所有資料與您的護照完全相符",
    fullName: "全名（與護照相同）",
    nationality: "國籍",
    passportNo: "護照號碼",
    visaNumber: "簽證號碼（如適用）",
    dob: "出生日期",
    expiryDate: "護照到期日期",
    sex: "性別",
  }}
/>
```

### Available Labels

| Label Key | Default Value | Description |
|-----------|---------------|-------------|
| `title` | "Passport Information" | Section title |
| `subtitle` | "Enter your passport details" | Section subtitle |
| `icon` | "📘" | Section icon |
| `introIcon` | "🛂" | Intro card icon |
| `introText` | "Please ensure all details..." | Context help text |
| `fullName` | "Full Name (as in passport)" | Name field label |
| `fullNameHelp` | "Enter your name exactly..." | Name help text |
| `nationality` | "Nationality" | Nationality field label |
| `nationalityHelp` | "Select your nationality" | Nationality help text |
| `passportNo` | "Passport Number" | Passport number label |
| `passportNoHelp` | "Enter your passport number" | Passport number help |
| `visaNumber` | "Visa Number (Optional)" | Visa number label |
| `visaNumberHelp` | "Enter visa number if applicable" | Visa help text |
| `dob` | "Date of Birth" | DOB label |
| `dobHelp` | "Select your date of birth" | DOB help text |
| `expiryDate` | "Passport Expiry Date" | Expiry label |
| `expiryDateHelp` | "Select passport expiry date" | Expiry help text |
| `sex` | "Gender" | Gender label |

### Available Config Options

| Config Key | Default Value | Description |
|------------|---------------|-------------|
| `showVisaNumber` | `true` | Whether to show visa number field |
| `genderOptions` | `[{label: 'Male', value: 'M'}, ...]` | Gender options |

---

## PersonalInfoSection

### Basic Usage

```javascript
import { PersonalInfoSection } from '../../components/shared/sections';

<PersonalInfoSection
  // Section control
  isExpanded={isPersonalExpanded}
  onToggle={() => setIsPersonalExpanded(!isPersonalExpanded)}
  fieldCount={{ filled: 6, total: 6 }}

  // Form state
  occupation={occupation}
  customOccupation={customOccupation}
  cityOfResidence={cityOfResidence}
  residentCountry={residentCountry}
  phoneCode={phoneCode}
  phoneNumber={phoneNumber}
  email={email}

  // Setters
  setOccupation={setOccupation}
  setCustomOccupation={setCustomOccupation}
  setCityOfResidence={setCityOfResidence}
  setResidentCountry={setResidentCountry}
  setPhoneCode={setPhoneCode}
  setPhoneNumber={setPhoneNumber}
  setEmail={setEmail}

  // Validation
  errors={errors}
  warnings={warnings}
  handleFieldBlur={handleFieldBlur}

  // Actions
  debouncedSaveData={debouncedSaveData}

  // Customization (optional)
  labels={{
    title: "个人信息",
    subtitle: "联系方式和职业信息",
    // ... more labels
  }}
  config={{
    uppercaseCity: true,
    uppercaseOccupation: true,
  }}
/>
```

### Country-Specific Examples

#### Thailand (Chinese)
```javascript
<PersonalInfoSection
  {...allTheProps}
  labels={{
    title: "个人信息",
    subtitle: "联系方式和职业信息",
    introText: "用于移民目的的联系信息",
    occupation: "职业",
    occupationHelp: "选择或输入您的职业",
    cityOfResidence: "居住城市",
    cityOfResidenceHelp: "您目前居住的城市",
    residentCountry: "居住国家",
    residentCountryHelp: "您目前居住的国家",
    phoneCode: "区号",
    phoneNumber: "电话号码",
    phoneNumberHelp: "您的联系电话",
    email: "电子邮箱",
    emailHelp: "您的电子邮箱地址",
  }}
  config={{
    uppercaseCity: true,
    uppercaseOccupation: true,
  }}
/>
```

#### Malaysia (Mixed)
```javascript
<PersonalInfoSection
  {...allTheProps}
  labels={{
    title: "Maklumat Peribadi",
    subtitle: "Hubungan dan pekerjaan",
    introText: "Maklumat hubungan untuk tujuan imigresen",
    occupation: "Pekerjaan",
    cityOfResidence: "Bandar Kediaman",
    residentCountry: "Negara Kediaman",
    phoneNumber: "Nombor Telefon",
    email: "E-mel",
  }}
  config={{
    uppercaseCity: false, // Don't uppercase for Malay
    uppercaseOccupation: true,
  }}
/>
```

### Available Labels

| Label Key | Default Value |
|-----------|---------------|
| `title` | "Personal Information" |
| `subtitle` | "Contact and occupation details" |
| `icon` | "👤" |
| `introIcon` | "📱" |
| `introText` | "Contact information for immigration purposes" |
| `occupation` | "Occupation" |
| `occupationHelp` | "Select or enter your occupation" |
| `occupationCustomLabel` | "Enter your occupation" |
| `occupationCustomPlaceholder` | "e.g., ACCOUNTANT, ENGINEER" |
| `occupationCustomHelp` | "Enter your occupation in English" |
| `cityOfResidence` | "City of Residence" |
| `cityOfResidenceHelp` | "City where you currently live" |
| `cityOfResidencePlaceholder` | "e.g., BANGKOK, LONDON" |
| `residentCountry` | "Country of Residence" |
| `residentCountryHelp` | "Country where you currently live" |
| `phoneCode` | "Code" |
| `phoneNumber` | "Phone Number" |
| `phoneNumberHelp` | "Your contact number" |
| `email` | "Email Address" |
| `emailHelp` | "Your email address" |

### Available Config Options

| Config Key | Default Value | Description |
|------------|---------------|-------------|
| `uppercaseCity` | `true` | Auto-uppercase city input |
| `uppercaseOccupation` | `true` | Auto-uppercase custom occupation |

---

## FundsSection

### Basic Usage

```javascript
import { FundsSection } from '../../components/shared/sections';

<FundsSection
  // Section control
  isExpanded={isFundsExpanded}
  onToggle={() => setIsFundsExpanded(!isFundsExpanded)}
  fieldCount={{ filled: funds.length, total: 1 }}

  // Form state
  funds={funds}

  // Actions
  addFund={addFund}
  handleFundItemPress={handleFundItemPress}

  // Customization (optional)
  labels={{
    title: "资金证明",
    subtitle: "证明您有足够资金旅行",
    // ... more labels
  }}
  config={{
    fundTypes: ['cash', 'credit_card', 'bank_balance'],
  }}
/>
```

### Country-Specific Examples

#### Thailand (Chinese)
```javascript
<FundsSection
  {...allTheProps}
  labels={{
    title: "资金证明",
    subtitle: "证明您有足够资金在泰国旅行",
    introText: "泰国海关想确保您不会成为负担。只需证明您有足够钱支付旅行费用，通常是每天至少500泰铢。",
    addCash: "添加现金",
    addCreditCard: "添加信用卡照片",
    addBankBalance: "添加银行账户余额",
    empty: "尚未添加资金证明，请先新建条目。",
    fundTypes: {
      cash: "现金",
      credit_card: "信用卡",
      bank_balance: "银行余额",
    },
  }}
  config={{
    fundTypes: ['cash', 'credit_card', 'bank_balance'],
  }}
/>
```

#### Singapore (English - Higher Requirements)
```javascript
<FundsSection
  {...allTheProps}
  labels={{
    title: "Proof of Sufficient Funds",
    subtitle: "Show you can support yourself during your stay",
    introText: "Singapore immigration requires proof of sufficient funds. Provide evidence you can cover accommodation, food, and other expenses.",
    addCash: "Add Cash",
    addCreditCard: "Add Credit Card",
    addBankBalance: "Add Bank Statement",
    addBankCard: "Add Debit Card",
    empty: "No funds declared. Please add at least one proof of funds.",
    fundTypes: {
      cash: "Cash",
      credit_card: "Credit Card",
      bank_card: "Debit Card",
      bank_balance: "Bank Statement",
    },
  }}
  config={{
    fundTypes: ['cash', 'credit_card', 'bank_card', 'bank_balance'],
  }}
/>
```

### Available Labels

| Label Key | Default Value |
|-----------|---------------|
| `title` | "Proof of Funds" |
| `subtitle` | "Show you have sufficient money for your trip" |
| `icon` | "💰" |
| `introIcon` | "💳" |
| `introText` | "Immigration wants to ensure..." |
| `addCash` | "Add Cash" |
| `addCreditCard` | "Add Credit Card Photo" |
| `addBankBalance` | "Add Bank Balance" |
| `addBankCard` | "Add Bank Card" |
| `addDocument` | "Add Document" |
| `empty` | "No funds added yet..." |
| `fundTypes.cash` | "Cash" |
| `fundTypes.credit_card` | "Credit Card" |
| `fundTypes.bank_card` | "Bank Card" |
| `fundTypes.bank_balance` | "Bank Balance" |
| `fundTypes.document` | "Document" |
| `fundTypes.other` | "Other" |
| `notProvided` | "Not provided" |
| `photoAttached` | "Photo attached" |

### Available Config Options

| Config Key | Default Value | Description |
|------------|---------------|-------------|
| `fundTypes` | `['cash', 'credit_card', 'bank_balance']` | Which fund types to show as buttons |
| `showCustomFundType` | `false` | Whether to show "Add Other" button |

---

## Complete Country Example: Malaysia

Here's a complete example of how to build a Malaysia travel info screen using all shared sections:

```javascript
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  PassportSection,
  PersonalInfoSection,
  FundsSection,
} from '../../components/shared/sections';

const MalaysiaTravelInfoScreen = () => {
  // Form state
  const [passportData, setPassportData] = useState({...});
  const [personalData, setPersonalData] = useState({...});
  const [funds, setFunds] = useState([]);

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState({
    passport: true,
    personal: false,
    funds: false,
  });

  return (
    <ScrollView>
      <PassportSection
        isExpanded={expandedSections.passport}
        onToggle={() => toggleSection('passport')}
        fieldCount={{ filled: 8, total: 9 }}
        {...passportData}
        // Setters...
        labels={{
          title: "Maklumat Pasport",
          subtitle: "Masukkan butiran pasport anda",
          introText: "Pastikan semua butiran sepadan dengan pasport anda",
          fullName: "Nama Penuh (seperti dalam pasport)",
          nationality: "Kewarganegaraan",
          passportNo: "Nombor Pasport",
          visaNumber: "Nombor Visa (jika berkenaan)",
          dob: "Tarikh Lahir",
          expiryDate: "Tarikh Tamat Pasport",
          sex: "Jantina",
        }}
        config={{
          showVisaNumber: true,
          genderOptions: [
            { label: 'Lelaki', value: 'M' },
            { label: 'Perempuan', value: 'F' },
          ],
        }}
      />

      <PersonalInfoSection
        isExpanded={expandedSections.personal}
        onToggle={() => toggleSection('personal')}
        fieldCount={{ filled: 6, total: 6 }}
        {...personalData}
        // Setters...
        labels={{
          title: "Maklumat Peribadi",
          subtitle: "Hubungan dan pekerjaan",
          occupation: "Pekerjaan",
          cityOfResidence: "Bandar Kediaman",
          residentCountry: "Negara Kediaman",
          phoneNumber: "Nombor Telefon",
          email: "E-mel",
        }}
        config={{
          uppercaseCity: false,
          uppercaseOccupation: true,
        }}
      />

      <FundsSection
        isExpanded={expandedSections.funds}
        onToggle={() => toggleSection('funds')}
        funds={funds}
        addFund={addFund}
        handleFundItemPress={handleFundItemPress}
        labels={{
          title: "Bukti Dana",
          subtitle: "Tunjukkan anda mempunyai wang yang mencukupi",
          addCash: "Tambah Tunai",
          addCreditCard: "Tambah Kad Kredit",
          addBankBalance: "Tambah Baki Bank",
        }}
      />
    </ScrollView>
  );
};
```

---

## Migration from Thailand Sections

### Before (Thailand-specific)
```javascript
import PassportSection from '../../components/thailand/sections/PassportSection';

<PassportSection
  t={t}
  isExpanded={isPassportExpanded}
  onToggle={togglePassport}
  // ... other props
/>
```

### After (Shared)
```javascript
import { PassportSection } from '../../components/shared/sections';

<PassportSection
  isExpanded={isPassportExpanded}
  onToggle={togglePassport}
  // ... other props
  labels={{
    title: t('passport.title'),
    subtitle: t('passport.subtitle'),
    // ... other translated labels
  }}
/>
```

---

## Best Practices

1. **Keep labels in a separate file**
   ```javascript
   // labels/thailand.js
   export const thailandLabels = {
     passport: {
       title: "护照信息",
       subtitle: "输入您的护照详细信息",
       // ...
     },
     personal: {
       title: "个人信息",
       // ...
     },
   };
   ```

2. **Use i18n for multi-language support**
   ```javascript
   import { useTranslation } from 'react-i18next';

   const { t } = useTranslation();

   <PassportSection
     labels={{
       title: t('passport.title'),
       subtitle: t('passport.subtitle'),
       // ...
     }}
   />
   ```

3. **Create country configuration files**
   ```javascript
   // config/thailand.js
   export const thailandConfig = {
     passport: {
       showVisaNumber: true,
       genderOptions: [
         { label: '男', value: 'M' },
         { label: '女', value: 'F' },
       ],
     },
     funds: {
       fundTypes: ['cash', 'credit_card', 'bank_balance'],
     },
   };
   ```

4. **Reuse validation logic**
   - All sections accept `errors`, `warnings`, and `handleFieldBlur`
   - Use the same validation logic across countries
   - Only customize error messages per language

---

## Benefits Summary

| Before (Country-specific) | After (Shared) |
|---------------------------|----------------|
| ~800 lines per country | ~200 lines per country |
| Duplicate validation logic | Shared validation |
| Inconsistent UI | Consistent UI |
| Hard to maintain | Easy to maintain |
| Slow to add new countries | Fast to add new countries |

---

## Next Steps

1. Create label configuration files for each country
2. Migrate existing countries to use shared sections
3. Use shared sections for all new countries
4. Extend with more section types as needed (TravelDetailsSection, AccommodationSection, etc.)
