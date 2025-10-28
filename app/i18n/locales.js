import countryTranslations from './translations/index.js';
import { convertToTraditional } from './chineseConverter.js';

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const deepMergeTranslations = (base = {}, overrides = {}) => {
  if (!isPlainObject(base)) {
    return overrides !== undefined ? overrides : base;
  }

  const result = { ...base };

  Object.keys(overrides || {}).forEach((key) => {
    const baseValue = result[key];
    const overrideValue = overrides[key];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMergeTranslations(baseValue, overrideValue);
    } else {
      result[key] = overrideValue;
    }
  });

  return result;
};

export const SUPPORTED_LANGUAGES = ['en', 'zh-CN', 'zh-TW', 'fr', 'de', 'es'];

// Progressive Entry Flow namespaces
export const PROGRESSIVE_FLOW_NAMESPACES = ['progressiveFlow', 'entryPack', 'notifications'];

// Language fallback configuration
export const LANGUAGE_FALLBACK = {
  'zh-TW': 'zh-CN',
  'zh-HK': 'zh-CN',
  'zh': 'zh-CN',
  'fr': 'en',
  'de': 'en',
  'es': 'en'
};

// Base translations object (will be extended with Traditional Chinese variants)
const baseTranslations = {
  en: {
    languages: {
      en: 'English',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
      zh: '中文',
    },
    malaysia: {
      info: {
        headerTitle: 'Malaysia Entry Information',
        title: 'Malaysia Entry Guide',
        subtitle: 'Visa-free for 30 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Since December 1, 2023, Chinese passport visa-free for 30 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, family visits, business purposes',
              '• New requirement: MDAC Digital Arrival Card must be submitted (submission time limit applies)',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• MDAC has strict time limit: Submit too early = rejected, too late = can\'t make it',
              '• Time calculation error-prone: Must calculate by Malaysia time, timezone issues cause mistakes',
              '• PIN code easy to lose: Must show PIN upon entry, can\'t find email or lost screenshot is troublesome',
              '• CAPTCHA recognition difficult: Alphanumeric code unclear, multiple wrong attempts may get locked',
              '• High accuracy requirement: Any error in passport, flight, accommodation may affect entry',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Auto-tracks itinerary, reminds you at the perfect time',
              '• Zero errors: Smart-fill MDAC, accurate information',
              '• Zero hassle: Enter once, we manage the entire process',
              '• PIN management: Auto-save PIN and confirmation email, quick display upon entry',
            ],
          },
        },
        continueButton: 'Understood, continue to checklist',
      },
      requirements: {
        headerTitle: 'Malaysia MDAC Checklist',
        introTitle: 'Confirm you have everything ready',
        introSubtitle: 'These items are required to submit the Malaysia Digital Arrival Card',
        items: {
          validPassport: {
            title: 'Passport validity',
            description: 'Passport valid at least 6 months with blank pages',
            details: 'Malaysia immigration requires your passport to remain valid >=6 months beyond your entry date. Renew before traveling if needed.',
          },
          submissionWindow: {
            title: 'Within 3-day window',
            description: 'MDAC only accepts submissions within 3 calendar days before arrival',
            details: 'Count calendar days based on Malaysia time (GMT+8). If it is too early the system will reject the request—set a reminder to submit once inside the window.',
          },
          contactableEmail: {
            title: 'Reachable email inbox',
            description: 'Able to receive the confirmation email and MDAC PIN',
            details: 'Use an email you can log into overseas. Check spam for messages from imigresen.gov.my and keep the PIN handy for arrival.',
          },
          travelDetails: {
            title: 'Flight & stay details',
            description: 'Have your flight number, arrival port, accommodation and phone ready',
            details: 'The form asks for airline, flight number, arrival airport, address in Malaysia, phone number (with country code), and purpose of visit.',
          },
          captchaReady: {
            title: 'Captcha ready',
            description: 'Able to type the letters/numbers shown before submitting',
            details: 'MDAC uses an alphanumeric CAPTCHA. If the code is unclear you can refresh it—complete submission within 5 minutes to avoid timeout.',
          },
        },
        status: {
          success: {
            title: 'Great! You can proceed.',
            subtitle: 'Next we will confirm your travel information.',
          },
          warning: {
            title: 'Please review each item',
            subtitle: 'Ensure you meet the MDAC prerequisites before continuing.',
          },
        },
        continueButton: 'Continue to travel information',
      },
      selection: {
        headerTitle: 'Malaysia MDAC Assistant',
        headerSubtitle: 'Choose how you want to complete the digital arrival card',
        recommendedBadge: 'Recommended',
        smartFlow: {
          title: '⚡ Guided assistant',
          subtitle: 'Step-by-step coach with autofill suggestions',
          highlights: [
            { title: 'Completion time', value: '8-12 min' },
            { title: 'Guided steps', value: '6 steps' },
            { title: 'Success rate', value: '98%' },
          ],
          features: [
            '• Autofill suggestions pulled from your entry pack',
            '• Captcha tips and PIN tracking reminders',
            '• Checklist to verify email confirmation is received',
          ],
          cta: 'Start guided submission ->',
        },
        webFlow: {
          title: '🌐 MDAC web form',
          subtitle: 'Official site inside the app',
          features: [
            '• Full MDAC website rendered in-app',
            '• Copy & paste from your entry pack without switching apps',
            '• Manual control — you submit each page yourself',
          ],
          cta: 'Open embedded MDAC site',
        },
        notes: {
          title: 'Submission reminders',
          items: [
            'Submit within 3 days before arriving in Malaysia (Malaysia time).',
            'Have your confirmation email and MDAC PIN ready for immigration.',
            'If traveling as a family, submit once per traveler — no group form yet.',
          ],
        },
      },
      guide: {
        headerTitle: 'MDAC Guided Submission',
        banner: {
          title: 'Use your entry pack to auto-fill MDAC',
          subtitle: 'We keep track so you won\'t miss key fields or the PIN email',
        },
        stepSectionTitle: 'Follow these steps',
        steps: [
          {
            title: 'Verify traveler information',
            subtitle: 'Compare with your passport before filling the form',
            details: [
              'Confirm English name, passport number, nationality, and expiry match exactly.',
              'Choose travel document type: Passport, then select "China" as nationality.',
              'Enter a reachable phone number with country code (e.g. +86 13800138000).',
            ],
          },
          {
            title: 'Fill travel details',
            subtitle: 'Use your stored itinerary for accuracy',
            details: [
              'Input arrival airport and flight number (e.g. KUL / MH389).',
              'Select arrival date/time within the 3-day window; double-check the calendar.',
              'Provide accommodation name and address or the contact of your host.',
            ],
          },
          {
            title: 'Submit and save confirmation',
            subtitle: 'CAPTCHA + PIN email are the last steps',
            details: [
              'Solve the alphanumeric CAPTCHA exactly as shown; refresh if unreadable.',
              'After submitting, capture the MDAC PIN shown on screen.',
              'Check your email (including spam) for the confirmation message and keep it for arrival.',
            ],
          },
        ],
        quickActions: {
          title: 'Quick tools',
          items: [
            {
              icon: '📧',
              title: 'Track your PIN email',
              description: 'Log which email account you used and confirm the message arrived.',
            },
            {
              icon: '📍',
              title: 'Copy stay details',
              description: 'Tap to copy hotel address/phone straight from your entry pack.',
            },
            {
              icon: '🔁',
              title: 'Resubmit easily',
              description: 'If plans change, reuse saved info to submit a new MDAC quickly.',
            },
          ],
        },
        primaryCta: 'Open MDAC web assistant',
        ctaHint: 'We will load the official site inside the app.',
      },
      webview: {
        headerTitle: 'MDAC Web Assistant',
        notice: 'Complete the official Malaysia Digital Arrival Card (MDAC) here. All data stays on your device.',
        loading: 'Loading official MDAC site...',
        openExternal: 'Open in browser',
        openFailedTitle: 'Unable to open link',
        openFailedBody: 'Please copy the URL and open it in your browser instead.',
      },
      result: {
        digitalBadge: 'Submit within 3 days',
        digitalTitle: 'Malaysia Digital Arrival Card (MDAC)',
        digitalHighlight: 'We help you submit MDAC using your saved passport and itinerary. Keep the PIN email ready for arrival.',
        digitalButton: 'Launch MDAC assistant',
      },
    },
    singapore: {
      info: {
        headerTitle: 'Singapore Entry Information',
        title: 'Singapore Entry Guide',
        subtitle: 'Visa-free for 30 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Since February 9, 2024, Chinese passport visa-free for 30 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, family visits, business purposes',
              '• New requirement: SG Arrival Card must be submitted (submission time limit applies)',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• SG Arrival Card has time limit: Submit too early = invalid, too late = can\'t make it',
              '• Time calculation error-prone: Must calculate by Singapore time, timezone issues cause mistakes',
              '• Confirmation code easy to lose: Must show upon entry, can\'t find email is troublesome',
              '• High accuracy requirement: Any error in passport, flight, accommodation may affect entry',
              '• Immigration checks strict: Documents incomplete or answers unclear may trigger secondary inspection',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Auto-tracks itinerary, reminds you at the perfect time',
              '• Zero errors: Smart-fill SG Arrival Card, accurate information',
              '• Zero hassle: Enter once, we manage the entire process',
              '• Confirmation management: Auto-save confirmation code, quick display upon entry',
            ],
          },
        },
        continueButton: 'Got it, continue to the checklist',
      },
      requirements: {
        headerTitle: 'SG Arrival Card Checklist',
        introTitle: 'Confirm you meet these requirements',
        introSubtitle: 'Singapore only accepts arrivals with declarations completed inside the 3-day window',
        items: {
          validPassport: {
            title: 'Passport validity',
            description: 'Passport should be valid 6+ months beyond arrival',
            details: 'Singapore recommends at least 6 months validity. Renew or replace damaged passports before travel.',
          },
          submissionWindow: {
            title: 'Within 3-day submission window',
            description: 'Form opens 3 days before arrival (Singapore time, GMT+8)',
            details: 'Submitting earlier than the window will result in an error. Set a reminder to complete the SG Arrival Card once the clock reaches the window.',
          },
          travelDetails: {
            title: 'Travel & stay information',
            description: 'Flight, arrival terminal/border, lodging/contact, purpose of visit',
            details: 'Prepare your airline/ferry/bus details, stay address, and contact number in international format. Business travelers should list local sponsor info if available.',
          },
          familyGroups: {
            title: 'Group/family plan',
            description: 'Decide if you will submit individually or through family submission',
            details: 'Group submission supports up to 10 travelers. Have everyone’s passport details ready and confirm that minors are included in a guardian’s form.',
          },
          sgArrivalHistory: {
            title: 'Previous submissions',
            description: 'Remember SG Arrival Cards expire after a single entry',
            details: 'If you re-enter within a short period, submit a fresh declaration with updated travel details. Old entries cannot be reused.',
          },
        },
        status: {
          success: {
            title: 'Great! You can proceed.',
            subtitle: 'Next we will confirm your travel information.',
          },
          warning: {
            title: 'Review each checklist item',
            subtitle: 'Complete the prerequisites before moving on.',
          },
        },
        continueButton: 'Continue to travel information',
      },
      selection: {
        headerTitle: 'SG Arrival Card Assistant',
        headerSubtitle: 'Pick the workflow that suits you best',
        recommendedBadge: 'Recommended',
        smartFlow: {
          title: '⚡ Guided assistant',
          subtitle: 'Use your entry pack to breeze through the form',
          highlights: [
            { title: 'Completion time', value: '6-10 min' },
            { title: 'Group ready', value: 'Up to 10 pax' },
            { title: 'Success rate', value: '98%' },
          ],
          features: [
            '• Auto-suggests answers for passport, flight, and accommodation',
            '• Reminds you to add family members and review health declarations',
            '• Tracks confirmation emails and highlights what to show at immigration',
          ],
          cta: 'Start guided assistant ->',
        },
        webFlow: {
          title: '🌐 SG Arrival Card website',
          subtitle: 'Use the official form within the app',
          features: [
            '• Embedded official site with full features',
            '• Copy & paste from your entry pack without switching apps',
            '• Ideal if you already know the form and just need quick access',
          ],
          cta: 'Open embedded SG Arrival Card',
        },
        notes: {
          title: 'Submission reminders',
          items: [
            'One declaration per entry. Transit passengers without immigration clearance do not need to submit.',
            'Families can submit together but each traveler must be declared separately.',
            'Keep the confirmation email/SMS handy in case officers request to see it.',
          ],
        },
      },
      guide: {
        headerTitle: 'SG Arrival Card Guided Mode',
        banner: {
          title: 'Leverage stored info to auto-fill the declaration',
          subtitle: 'Step-by-step guidance with reminders for family submissions',
        },
        stepSectionTitle: 'Follow these steps',
        steps: [
          {
            title: 'Verify traveler details',
            subtitle: 'Make sure passport information matches exactly',
            details: [
              'Confirm full name (as in passport), passport number, nationality, and expiry date.',
              'Choose the correct traveler type (e.g. Foreign Visitor, Returning Resident).',
              'Provide a reachable email and mobile number, both required for status updates.',
            ],
          },
          {
            title: 'Fill arrival & stay information',
            subtitle: 'Use your itinerary for accurate answers',
            details: [
              'Enter arrival date/time and flight/ferry/bus number within the 3-day window.',
              'Select arrival checkpoint (e.g. Changi Airport Terminal 3, Tuas Checkpoint).',
              'Provide accommodation address or local contact information including postal code.',
            ],
          },
          {
            title: 'Health and declarations',
            subtitle: 'Complete health/travel history honestly',
            details: [
              'Declare recent travel history to high-risk areas when prompted.',
              'Answer health symptom questions accurately; bring supporting documents if needed.',
              'Submit and check for the confirmation email/SMS before boarding your flight.',
            ],
          },
        ],
        quickActions: {
          title: 'Quick tools',
          items: [
            {
              icon: '🕒',
              title: '72-hour reminder',
              description: 'We nudge you when the submission window opens based on your arrival date.',
            },
            {
              icon: '👪',
              title: 'Family helper',
              description: 'Duplicate saved info to add additional family members quickly.',
            },
            {
              icon: '📬',
              title: 'Confirmation tracker',
              description: 'Log which email/SMS received the approval so you can present it on arrival.',
            },
          ],
        },
        primaryCta: 'Open SG Arrival Card assistant',
        ctaHint: 'Loads the official ICA website inside the app.',
      },
      webview: {
        headerTitle: 'SG Arrival Card Web Assistant',
        notice: 'Complete the official SG Arrival Card here. BorderBuddy only keeps data locally on your device.',
        loading: 'Loading SG Arrival Card...',
        openExternal: 'Open in browser',
        openFailedTitle: 'Unable to open link',
        openFailedBody: 'Please copy the URL and open it manually in your browser.',
      },
      result: {
        digitalBadge: 'Submit within 3 days',
        digitalTitle: 'Singapore SG Arrival Card',
        digitalHighlight: 'Use your entry pack to declare before landing in Singapore. Keep the confirmation email/SMS ready at immigration.',
        digitalButton: 'Launch SG Arrival assistant',
      },
    },
    hongkong: {
      info: {
        headerTitle: 'Hong Kong Entry Information',
        title: 'Hong Kong Entry Guide',
        subtitle: 'Visa-free for 7 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Chinese passport visa-free for 7 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, business, family visits',
              '• Extensions can be applied through Hong Kong Immigration if needed',
              '• Document options: Both passport and Mainland Travel Permit for Hong Kong are valid',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• Short stay duration: Only 7 days, must leave on time or apply for extension',
              '• Immigration checks strict: May ask detailed questions about purpose, accommodation, funds',
              '• Document preparation required: Return ticket, hotel booking, funds proof all needed',
              '• Health declaration may required: Depending on current health policies',
              '• E-channels limited: First-time visitors must use manual counters, longer queues',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Auto-reminds 7-day limit, no worries about overstay',
              '• Zero errors: Pre-filled travel information, immigration questions prepared',
              '• Zero hassle: Enter once, all documents organized',
              '• Document checklist: Comprehensive preparation list, no missing items',
            ],
          },
        },
        continueButton: 'Understood, continue to checklist',
      },
      requirements: {
        headerTitle: 'Hong Kong Entry Checklist',
        introTitle: 'Entry preparation checklist',
        introSubtitle: 'Fill in what you have and complete gradually',
        items: {
          validPassport: {
            title: 'Passport validity',
            description: 'Passport should be valid for at least 1 month beyond your stay',
            details: 'Hong Kong requires your passport to be valid beyond your intended stay. Check expiry date and renew if necessary.',
          },
          returnTicket: {
            title: 'Return or onward ticket',
            description: 'Confirmed booking for departure from Hong Kong',
            details: 'Immigration may ask to see proof of your return flight or onward journey. Have your e-ticket or booking confirmation ready.',
          },
          accommodation: {
            title: 'Accommodation proof',
            description: 'Hotel booking or host contact information',
            details: 'Bring hotel reservation confirmation or contact details of your host in Hong Kong, including address and phone number.',
          },
          sufficientFunds: {
            title: 'Sufficient funds',
            description: 'Cash, credit cards, or bank statements',
            details: 'You may need to demonstrate you have enough money for your stay. Bring cash, credit cards, or recent bank statements.',
          },
          healthDeclaration: {
            title: 'Health declaration',
            description: 'Complete if required by current health regulations',
            details: 'Check if health declarations or COVID-related documents are needed. Complete any required forms before arrival.',
          },
        },
        status: {
          info: {
            title: 'Start anytime',
            subtitle: 'We support progressive completion',
          },
        },
        startButton: 'Start filling',
      },
    },
    taiwan: {
      info: {
        headerTitle: 'Taiwan Entry Information',
        title: 'Taiwan Entry Guide',
        subtitle: 'Entry permit and Online Arrival Card required',
        sections: {
          visa: {
            title: '✓ Entry Permit Policy',
            items: [
              'Mainland Chinese must obtain Entry Permit (入台证) - online application, about 5 business days',
              '• Single-entry valid 3 months, stay up to 15 days',
              '• Multiple-entry valid 1 year, up to 15 days per visit',
              '• New requirement: Online Arrival Card must be completed',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• Entry Permit expiration easy to miss: Valid for 3 months, must enter within period',
              '• Online Arrival Card complex: Personal info, flight details, accommodation all required',
              '• Email verification required: Must verify email before filling form, easy to miss',
              '• Document preparation cumbersome: Entry permit, passport, return ticket, accommodation, funds all required',
              '• Immigration interview possible: Purpose unclear or documents incomplete may trigger detailed questioning',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Auto-reminds Entry Permit validity, no worries about expiration',
              '• Zero errors: Smart-fill Online Arrival Card, accurate information',
              '• Zero hassle: Enter once, auto-generate all forms',
              '• Document checklist: Comprehensive preparation list, no missing items',
            ],
          },
        },
        continueButton: 'Understood, continue to checklist',
      },
      requirements: {
        headerTitle: 'Taiwan Online Arrival Card Checklist',
        introTitle: 'Make sure you are ready',
        introSubtitle: 'You must finish email verification before filling the form',
        items: {
          validPassport: {
            title: 'Passport validity',
            description: 'Passport valid for your intended stay',
            details: 'Taiwan recommends at least 6 months validity. Replace damaged or expiring passports prior to travel.',
          },
          emailAccess: {
            title: 'Email inbox access',
            description: 'Able to receive a one-time verification code (OTP)',
            details: 'Use an email that you can log into immediately. The OTP expires quickly; keep the inbox open while submitting.',
          },
          submissionWindow: {
            title: 'Submit before arrival',
            description: 'Complete the form as soon as flights and accommodation are confirmed',
            details: 'Taiwan allows early submission, but update the card if any information changes (flight, hotel, contact).',
          },
          travelDetails: {
            title: 'Flight & stay details',
            description: 'Prepare accurate itinerary information',
            details: 'Have your airline, flight number, seat info (optional), accommodation or host address, and contact number ready.',
          },
          otpReady: {
            title: 'OTP ready',
            description: 'Phone or email inbox handy to read the verification code',
            details: 'The system sends a numeric OTP to your email. Enter it within a few minutes to unlock the form.',
          },
        },
        status: {
          info: {
            title: 'Great! Let’s proceed.',
            subtitle: 'Next we will verify your travel details and help you fill the form.',
          },
            title: 'Check each item first',
            title: 'Start anytime',
        },
        continueButton: 'Continue to travel information',
      },
      selection: {
        headerTitle: 'Taiwan Arrival Card Assistant',
        headerSubtitle: 'Choose between guided mode or direct website access',
        recommendedBadge: 'Recommended',
        smartFlow: {
          title: '⚡ Guided assistant',
          subtitle: 'Uses your entry pack and tracks OTP progress',
          highlights: [
            { title: 'Completion time', value: '7-12 min' },
            { title: 'OTP steps', value: 'Email + code' },
            { title: 'Success rate', value: '97%' },
          ],
          features: [
            '• Autofill passport, flight, and hotel details from your entry pack',
            '• Reminds you to request and enter the verification code in time',
            '• Checklist to confirm you received the confirmation email',
          ],
          cta: 'Start guided assistant ->',
        },
        webFlow: {
          title: '🌐 Taiwan arrival website',
          subtitle: 'Open the official site inside the app',
          features: [
            '• Embedded website with OTP request button',
            '• Copy/paste from your entry pack without leaving the app',
            '• Ideal if you already know the process and just need quick access',
          ],
          cta: 'Open embedded Taiwan arrival card',
        },
        notes: {
          title: 'Submission reminders',
          items: [
            'Request the OTP only when you are ready to complete the form (it expires quickly).',
            'If you change flights or accommodation, submit an updated arrival card before boarding.',
            'Keep a screenshot or email confirmation to show immigration if requested.',
          ],
        },
      },
      guide: {
        headerTitle: 'Taiwan Arrival Card Guided Mode',
        banner: {
          title: 'Use your entry pack to pass the email verification quickly',
          subtitle: 'We walk you through requesting the OTP and filling each section',
        },
        stepSectionTitle: 'Follow these steps',
        steps: [
          {
            title: 'Request verification email',
            subtitle: 'Confirm your email inbox is ready',
            details: [
              'Enter your email and tap “Send Code” on the official site.',
              'Check your inbox (and spam) for a 6-digit OTP from the Taiwan immigration site.',
              'Paste the code within the time limit to unlock the form.',
            ],
          },
          {
            title: 'Fill traveler & arrival details',
            subtitle: 'Autofill from your entry pack for speed',
            details: [
              'Verify your passport number, nationality, and date of birth.',
              'Enter arrival flight number, date/time, and port of entry.',
              'Provide accommodation address/phone or host details in Taiwan.',
            ],
          },
          {
            title: 'Travel history & confirmation',
            subtitle: 'Answer the 14-day travel history questions accurately',
            details: [
              'Declare countries visited in the last 14 days and health status truthfully.',
              'Review the summary page carefully before submitting.',
              'Wait for the confirmation page/email and save a screenshot for arrival.',
            ],
          },
        ],
        quickActions: {
          title: 'Quick tools',
          items: [
            {
              icon: '✉️',
              title: 'OTP checker',
              description: 'Tick off once the verification email arrives so you don’t miss it.',
            },
            {
              icon: '📄',
              title: 'Auto-fill clipboard',
              description: 'Copy passport/flight info with one tap while filling the form.',
            },
            {
              icon: '🔁',
              title: 'Resubmit helper',
              description: 'If plans change, reuse saved info to create a new arrival card quickly.',
            },
          ],
        },
        primaryCta: 'Open Taiwan arrival assistant',
        ctaHint: 'Loads the official arrival card site inside the app.',
      },
      webview: {
        headerTitle: 'Taiwan Arrival Card Web Assistant',
        notice: 'Request the verification email, enter the OTP, and complete the form here. All data stays on your device.',
        loading: 'Loading Taiwan arrival card...',
        openExternal: 'Open in browser',
        openFailedTitle: 'Unable to open link',
        openFailedBody: 'Please copy the URL and open it manually in your browser.',
      },
      result: {
        digitalBadge: 'Finish before landing',
        digitalTitle: 'Taiwan Online Arrival Card',
        digitalHighlight: 'We help manage the email verification and form submission. Keep the confirmation email for immigration.',
        digitalButton: 'Launch Taiwan assistant',
      },
    },
    common: {
      appName: 'BorderBuddy',
      enterCta: 'Enter For Free',
      footerMessage: 'Try BorderBuddy for free — AI handles your border paperwork',
      ok: 'OK',
      cancel: 'Cancel',
      confirm: 'Confirm',
      back: 'Back',
      view: 'View',
      unknown: 'Unknown',
      yes: 'Yes',
      no: 'No',
      error: 'Error',
    },
    tabs: {
      home: 'Home',
      history: 'History',
      profile: 'Profile',
    },
    screenTitles: {
      scanPassport: 'Scan Document',
      selectDestination: 'Select Destination',
      result: 'Entry Pack',
      copyWriteMode: 'Copy Write Mode',
    },
    copyWriteMode: {
      title: 'Copy Write Mode',
      subtitle: 'Reference this screen to fill out paper forms',
      description: 'Screen stays awake so you can copy at your pace',
      fontSizeLabel: 'Font Size:',
      instructionsTitle: 'Instructions',
      step1: '1. Copy each field onto the paper form',
      step2: '2. Move down the form top to bottom',
      step3: '3. Hand the completed forms to the officer',
      // Japan Forms
      japanLandingCard: 'Landing Card (Black Form)',
      japanCustomsDeclaration: 'Customs Declaration (Yellow Form)',
      // Canada E311 Form
      canadaPart1: 'Part 1: Traveler Information',
      canadaPart2: 'Part 2: Address Information',
      canadaPart3: 'Part 3: Travel Details',
      canadaPart4: 'Part 4: Customs Declaration (Check YES or NO)',
      // Field Labels
      familyName: 'Family Name',
      givenName: 'Given Name',
      lastName: 'Last Name',
      firstName: 'First Name',
      middleInitial: 'Initial',
      dateOfBirth: 'Date of Birth',
      nationality: 'Nationality',
      citizenship: 'Citizenship',
      passportNumber: 'Passport Number',
      flightNumber: 'Flight Number',
      purposeOfVisit: 'Purpose of Visit',
      addressInJapan: 'Address in Japan',
      name: 'Name',
      prohibitedItems: 'Prohibited Items?',
      cashOverLimit: 'Cash > ¥10,000?',
      commercialGoods: 'Commercial Goods?',
      totalValueOfGoods: 'Total Value of Goods',
      homeAddress: 'Home Address',
      postalCode: 'Postal/ZIP Code',
      airlineFlightNumber: 'Airline/Flight Number',
      arrivalDate: 'Arrival Date',
      arrivingFrom: 'Arriving From',
      purposeOfTrip: 'Purpose of Trip',
      currencyOverLimit: 'Currency/monetary instruments ≥ CAN$10,000?',
      commercialGoodsForResale: 'Commercial goods, samples, or goods for resale?',
      foodPlantsAnimals: 'Food, plants, animals, or related products?',
      visitedFarm: 'Visited a farm or been in contact with farm animals?',
      firearms: 'Firearms or weapons?',
      exceedsDutyFree: 'Goods exceed duty-free allowance?',
      // Instructions
      instructionFamilyName: 'Fill in surname from passport',
      instructionGivenName: 'Fill in given name from passport',
      instructionLastName: 'Fill in surname from passport (CAPITAL LETTERS)',
      instructionFirstName: 'Fill in given name from passport (CAPITAL LETTERS)',
      instructionMiddleInitial: 'Leave blank if no middle name',
      instructionDateOfBirth: 'Format: YYYYMMDD',
      instructionDateOfBirthDash: 'Format: YYYY-MM-DD',
      instructionNationality: 'Fill in nationality',
      instructionCitizenship: 'Fill in nationality (CAPITAL LETTERS)',
      instructionPassportNumber: 'Fill in passport number',
      instructionFlightNumber: 'e.g., CA981, CZ309',
      instructionFlightNumberCanada: 'e.g., AC088, CZ329',
      instructionPurposeOfVisit: 'Fill in TOURISM',
      instructionAddressInJapan: 'Fill in hotel name and address',
      instructionName: 'Fill in Chinese name',
      instructionProhibitedItems: 'If no prohibited items, fill NO',
      instructionTruthfulAnswer: 'Answer truthfully',
      instructionTotalValue: 'Fill in ¥0 unless you need to declare goods over ¥200,000',
      instructionCanadaAddress: 'Fill in address in Canada (hotel address)',
      instructionPostalCode: 'Hotel postal code (if known)',
      instructionDateFormat: 'Format: YYYY-MM-DD',
      instructionArrivingFrom: 'If connecting through USA, fill U.S.A.',
      instructionPurposeOptions: 'Options: Study / Personal / Business',
      instructionFoodItems: 'Including: fruits, meat, seeds, wood products, etc.',
      instructionGiftsLimit: 'Gifts over CAN$60 must be declared',
      // Tips
      tipsTitle: 'Important Tips',
      tipJapan1: 'Please use black or blue pen to fill out the form',
      tipJapan2: 'Handwriting should be clear and neat, avoid corrections',
      tipJapan3: 'Customs declaration section must be filled out truthfully',
      tipJapan4: 'After completing, hand to immigration officer for inspection',
      tipJapan5: 'Keep landing card stub until departure',
      tipCanada1: 'Please use CAPITAL LETTERS to fill in name and nationality',
      tipCanada2: 'Date format: YYYY-MM-DD (e.g., 2025-01-15)',
      tipCanada3: 'Customs declaration section must be filled out truthfully',
      tipCanada4: 'After completing, sign at the bottom of the form',
      tipCanada5: 'Children under 16 can be signed by parents',
      // Sample Card
      sampleTitleJapan: 'Landing Card and Declaration Form Sample',
      sampleTitleCanada: 'E311 Form Sample',
      sampleImageTitleJapan: 'Landing Card & Customs Declaration',
      sampleImageTitleCanada: 'E311 Declaration Card',
      sampleSubtitle: '(Paper form image example)',
      sampleDescription: 'Field order on form matches this page',
      // Bottom Tip
      bottomTipTitle: 'After copying, remember to check once',
      bottomTipDescription: 'Ensure name, passport number, flight number and other important information are correct',
      // Values and Placeholders
      valueLeaveBlank: '(Leave blank)',
      defaultChineseName: 'Zhang Wei',
    },
    login: {
      tagline: 'Cross-border entry • Seamless passage',
      benefits: {
        free: 'Completely free',
        noRegistration: 'No registration',
        instant: 'Instant use',
      },
      ctaTitle: 'Cross-border entry has never been so simple',
      ctaSubtitle: 'One-click form filling, enjoy seamless customs experience',
      buttonText: 'Get Started • Free',
      buttonSubtext: 'No signup, instant access',
      popularityText: '{{percent}}% smooth entry',
      hotlistLabel: 'Trending destinations',
      hotlistDescription: 'Popular picks this week',
    },
    home: {
      header: {
        title: 'BorderBuddy',
      },
      greeting: 'Hi, {{name}} 👋',
      welcomeText: 'Choose a destination to generate your entry pack',
      sections: {
        pending: '🛬 Upcoming trips',
        whereToGo: '🧭 Where do you want to go?',
      },
      passport: {
        type: 'Chinese Passport',
      },
      destinationNames: {
        jp: 'Japan',
        th: 'Thailand',
        hk: 'Hong Kong',
        tw: 'Taiwan',
        kr: 'South Korea',
        sg: 'Singapore',
        my: 'Malaysia',
        us: 'United States',
      },
      destinations: {
        japan: { flightTime: '3 hours flight' },
        thailand: { flightTime: '3 hours flight' },
        hongKong: { flightTime: '1 hour flight' },
        taiwan: { flightTime: '2 hours flight' },
        korea: { flightTime: '2 hours flight' },
        singapore: { flightTime: '5 hours flight' },
        malaysia: { flightTime: '4 hours flight' },
        usa: { flightTime: '13 hours flight' },
      },
      pendingTrips: {
        departSuffix: 'Departure',
        cards: {
          jp: { title: 'Japan · Tokyo' },
          th: { title: 'Thailand · Bangkok' },
          us: { title: 'USA · New York' },
          kr: { title: 'South Korea · Seoul' },
          sg: { title: 'Singapore · Changi' },
          my: { title: 'Malaysia · Kuala Lumpur' },
          tw: { title: 'Taiwan · Taipei' },
          hk: { title: 'Hong Kong' },
        },
      },
      alerts: {
        notAvailableTitle: 'Coming soon',
        notAvailableBody: 'This destination is not available yet. Please stay tuned!',
        historyFoundTitle: 'Entry pack found',
        historyFoundBody: {
          pre: 'We found an entry pack for {{country}}:',
          flight: 'Flight',
          date: 'Date',
          hotel: 'Hotel',
          question: 'Use this entry pack?',
          regenerate: 'Generate again',
        },
      },
      history: {
        emptyTitle: 'No history yet',
        emptySubtitle: 'Your entry packs will appear here',
        cardTitle: '{{country}} Entry Pack',
      },
    },
    history: {
      headerTitle: 'History',
      filterButton: 'Filter ⌄',
      timePrefix: 'Generated',
      passportPrefix: 'Passport',
      sections: {
        today: 'Today',
        yesterday: 'Yesterday',
        thisWeek: 'This Week',
        thisMonth: 'This Month',
        earlier: 'Earlier',
      },
      items: {
        hk: {
          title: 'Hong Kong Entry Pack',
          time: 'Today at 2:30 PM',
          passport: 'Chinese Passport E12345678',
        },
        th: {
          title: 'Thailand Entry Pack',
          time: 'Yesterday at 10:15 AM',
          passport: 'Chinese Passport E12345678',
        },
      },
      empty: {
        title: 'No history yet',
        subtitle: 'Your generated entry packs will appear here',
      },
    },
    travelInfo: {
      header: { title: 'Travel Information', back: 'Back' },
      infoCard: { title: 'Traveling to {{destination}}', subtitle: 'Fill in your travel details' },
      sections: { flight: 'Flight Information', accommodation: 'Accommodation', trip: 'Trip Details', health: 'Health Declaration', usCustoms: 'US Customs Declaration', caCustoms: 'Canada Customs Declaration' },
      fields: {
        flightNumber: { label: 'Flight Number', placeholder: 'e.g. CA981' },
        arrivalDate: { label: 'Arrival Date', placeholder: 'YYYY-MM-DD', help: 'Must be within 72 hours' },
        hotelName: { label: 'Hotel Name', placeholder: 'Hotel name or address' },
        hotelAddress: { label: 'Hotel Address', placeholder: 'Full address' },
        contactPhone: { label: 'Contact Phone', placeholder: '+1234567890' },
        stayDuration: { label: 'Stay Duration (days)', placeholder: 'e.g. 7' },
        purpose: 'Purpose of Visit',
      },
      purposes: { tourism: 'Tourism', business: 'Business', visiting: 'Visiting Family', study: 'Study', work: 'Work' },
      yesNoQuestion: { fever: 'Have you had a fever recently?', usCash: 'Carrying over $10,000 USD?', usFood: 'Bringing food, plants, or animals?', caCurrency: 'Carrying over CAD $10,000?', caDuty: 'Bringing goods subject to duty?', caFirearms: 'Bringing firearms or weapons?', caCommercial: 'Bringing commercial goods?', caFood: 'Bringing food, plants, animals, or related products?' },
      arrivingFrom: { label: 'Arriving from', us: 'United States', other: 'Other Country' },
      hints: { caDuty: 'Including alcohol, tobacco, gifts exceeding exemption', caFood: 'Including meat, dairy, fruits, vegetables, seeds' },
      scanButtons: { ticket: 'Scan Ticket', hotel: 'Scan Booking' },
      generateButton: 'Generate Entry Pack',
      tips: { title: '💡 Tips', body: '• Have your flight ticket ready\n• Hotel booking confirmation\n• Be honest with customs declarations\n• Keep contact information handy' },
      alerts: {
        permissionPhotoTitle: 'Photo Permission Required',
        permissionPhotoBody: 'We need camera/photo access to scan documents',
        permissionDeniedAction: 'OK',
        ocrSuccessFlight: 'Flight info extracted!',
        ocrSuccessHotel: 'Hotel info extracted!',
        loginRequiredTitle: 'Login Required',
        loginRequiredBody: 'OCR feature requires login',
        loginButton: 'Login',
        manualEntryButton: 'Enter Manually',
        ocrFailTitle: 'Recognition Failed',
        ocrFailBody: 'Could not extract information',
        genericErrorTitle: 'Error',
        galleryError: 'Failed to open gallery',
        dateTooFarTitle: 'Date Too Far',
        dateTooFarBody: 'Arrival date must be within 72 hours ({{days}} days away)',
        datePastTitle: 'Invalid Date',
        datePastBody: 'Arrival date cannot be in the past',
      },
      duplicateModal: {
        title: 'Entry Pack Already Exists',
        message: 'We found an existing entry pack with the same flight information:',
        labels: { destination: 'Destination:', flight: 'Flight:', arrival: 'Arrival:', generated: 'Generated:' },
        arrivalSuffix: '{{date}} arrival',
        hint: 'Would you like to use the existing pack or generate a new one?',
        useExisting: 'Use Existing Pack',
        regenerate: 'Generate New Pack',
        cancel: 'Cancel',
      },
    },
    thailand: {
      entryGuide: {
        title: 'Thailand Entry Guide (DMK Airport)',
        subtitle: 'Complete 8-step process from TDAC to hotel arrival',
        steps: {
          tdac: {
            title: 'TDAC Digital Arrival Card',
            titleZh: 'TDAC数字入境卡',
            description: 'Submit within 72 hours before arrival',
            descriptionZh: '抵达前72小时内提交',
            tips: [
              'Prepare passport, flight info, Thailand address',
              'Fill in English passport information',
              'Save QR code to phone gallery'
            ],
            tipsZh: [
              '准备护照、航班信息、泰国地址',
              '填写英文护照信息',
              '保存QR码到手机相册'
            ]
          },
          atm: {
            title: 'ATM Cash Withdrawal',
            titleZh: 'ATM取泰铢现金',
            description: 'Withdraw 3,000-5,000 THB at airport ATM',
            descriptionZh: '在机场ATM机取3,000-5,000泰铢',
            banks: [
              'Bangkok Bank (曼谷银行)',
              'Krungsri (泰国大城银行)',
              'Kasikorn Bank (开泰银行)'
            ],
            steps: [
              'Find ATM in arrival hall (1st floor)',
              'Choose English interface',
              'Enter PIN, select Savings account',
              'Withdraw 3,000-5,000 THB',
              'Fee: ~220 THB per transaction'
            ],
            stepsZh: [
              '找到ATM机（到达大厅1楼）',
              '选择英语界面',
              '输入密码，选择储蓄账户',
              '取款3,000-5,000泰铢',
              '手续费：约220泰铢/次'
            ],
            safety: [
              'Watch surroundings carefully',
              'Protect your PIN when entering',
              'Don\'t accept "help" from strangers',
              'Note ATM number if card is retained'
            ],
            safetyZh: [
              '注意周边环境安全',
              '保护密码输入安全',
              '不要接受陌生人"帮助"',
              '如ATM吞卡，记下ATM编号联系银行'
            ]
          },
          taxi: {
            title: 'Official Taxi to Hotel',
            titleZh: '官方出租车到酒店',
            description: 'Use BorderBuddy driver page for hotel address',
            descriptionZh: '使用入境通司机页面显示酒店地址',
            steps: [
              'Find Public Taxi counter (Gate 6 or 8)',
              'Show BorderBuddy "Driver Page" to staff',
              'Get queue number ticket',
              'Confirm driver uses meter',
              'Cost: 320-470 THB (meter + 50 airport fee + highway)'
            ],
            stepsZh: [
              '找官方Public Taxi柜台（6号门或8号门附近）',
              '向工作人员出示入境通"给司机看的页面"',
              '拿到排队号码单',
              '确认司机打表（Meter在跳字）',
              '费用：320-470泰铢（打表+50机场费+高速费）'
            ],
            payment: [
              'Prepare small bills (100, 50, 20 THB)',
              'Pay in cash (recommended)',
              'Ask for receipt if needed'
            ],
            paymentZh: [
              '准备小额钞票（100、50、20泰铢）',
              '现金支付（推荐）',
              '需要时索要收据'
            ]
          }
        },
        importantNotes: [
          'TDAC must be submitted within 72 hours before arrival',
          'ATM withdrawal fee ~220 THB, withdraw more to save fees',
          'Only use official Public Taxi, avoid unauthorized drivers',
          'BorderBuddy driver page shows bilingual hotel address'
        ],
        importantNotesZh: [
          '抵达前72小时内必须提交TDAC',
          'ATM取款手续费约220泰铢，一次多取节省费用',
          '只使用官方Public Taxi，避免黑车',
          '入境通司机页面显示泰文+英文酒店地址'
        ],
        entryPackHintOfficial: 'Passport, TDAC QR code, and fund proof ready for immigration officer.',
        entryPackHintPreview: 'Preview entry pack format (full version available after TDAC submission)'
      },
      info: {
        headerTitle: 'Thailand Entry Information',
        title: 'Thailand Entry Guide',
        subtitle: 'Visa-free for 60 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Since September 15, 2024, Chinese passport visa-free for 60 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, family visits, medical treatment purposes',
              '• New option: TDAC Digital Arrival Card available (optional but recommended)',
            ],
          },
          onsite: {
            title: '⚠️ Entry Information',
            items: [
              '• Paper forms tedious: Traditional arrival card must be handwritten on-site, easy to make mistakes',
              '• Long queues common: Manual processing slow, especially during peak travel',
              '• Document preparation complex: Passport, return ticket, accommodation, funds proof all required',
              '• Language barrier exists: Forms in Thai/English, unclear wording causes confusion',
              '• Immigration interview possible: Purpose unclear or documents incomplete may trigger detailed questioning',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: TDAC optional submission, skip paper forms and speed up entry',
              '• Zero errors: Smart-fill digital card if you choose TDAC, accurate information',
              '• Zero hassle: Enter once, auto-generate all forms',
              '• Document checklist: Comprehensive preparation list, no missing items',
            ],
          },
        },
        continueButton: 'I understand, continue to confirm requirements',
      },
      requirements: {
        headerTitle: 'Thailand Entry Checklist',
        introTitle: '以下是入境所需准备事项',
        introSubtitle: '这些信息可以先填着，慢慢补全',
        items: {
          validPassport: {
            title: 'Valid passport',
            description: 'Passport valid for at least 6 months with blank visa pages',
            details: 'Thai immigration requires your passport to remain valid for at least 6 months beyond your intended departure date.',
          },
          onwardTicket: {
            title: 'Return or onward ticket',
            description: 'Proof you will leave Thailand within 30 days',
            details: 'Print an e-ticket itinerary so you can show it during inspection.',
          },
          accommodation: {
            title: 'Proof of accommodation',
            description: 'Provide hotel or homestay booking or a local contact address',
            details: 'Use a cancellable hotel booking or a friend\'s address, and ensure the information is accurate.',
          },
          funds: {
            title: 'Sufficient funds',
            description: 'Carry at least 10,000 THB per person or equivalent cash and account proof',
            details: 'Officers may check cash or bank balance proofs. Prepare screenshots or statements and list your cash, cards, and balances in Chinese/English/Thai for quick presentation.',
          },
          healthCheck: {
            title: 'Health declaration',
            description: 'Confirm no fever or acute symptoms and cooperate with screening if needed',
            details: 'No mandatory vaccines currently, but if you feel unwell seek medical help in advance and bring an English diagnosis letter.',
          },
        },
        status: {
          info: {
            title: 'Start anytime',
            subtitle: 'We support progressive completion',
          },
        },
        startButton: 'Start filling',
      },
      travelInfo: {
        headerTitle: 'Thailand Entry Information',
        title: 'Fill in Thailand Entry Information',
        subtitle: 'Please provide the following information to complete the entry card generation',
        privacyNotice: 'All information is saved locally on your device only',
        loading: 'Loading data...',
        submitEntry: 'Prepare Entry Pack',
        viewStatus: 'View Preparation Status',
        readyToSubmit: 'Ready to submit',
        completionProgress: '{{percent}}% complete',
        completionHint: 'Complete all information to submit the entry card.',
        sections: {
          passport: 'Passport Information',
          personal: 'Personal Information',
          travel: 'Travel Information',
          accommodation: 'Accommodation Information',
          emergency: 'Emergency Contact',
        },
        scan: {
          ticketTitle: 'Scan Ticket',
          ticketMessage: 'Please select ticket image source',
          hotelTitle: 'Scan Hotel Booking',
          hotelMessage: 'Please select hotel booking confirmation image source',
          takePhoto: 'Take Photo',
          fromLibrary: 'Choose from Library',
          permissionTitle: 'Permission Required',
          cameraPermissionMessage: 'Camera permission is required to take photos for document scanning',
          libraryPermissionMessage: 'Photo library permission is required to select images',
          successTitle: 'Scan Successful',
          ticketSuccess: 'Flight information extracted and filled into form',
          hotelSuccess: 'Hotel information extracted and filled into form',
          ocrFailTitle: 'Recognition Failed',
          ocrFailMessage: 'Unable to extract information from image, please check image clarity or enter manually',
          retryButton: 'Retry',
          manualButton: 'Enter Manually',
          errorTitle: 'Scan Failed',
          errorMessage: 'An error occurred during scanning, please try again',
          flightChoiceTitle: 'Select Flight',
          flightChoiceMessage: 'Detected flight number {flightNumber}, please select which flight information to update',
          arrivalFlight: 'Arrival Flight',
          departureFlight: 'Departure Flight',
        },
        photo: {
          choose: 'Choose Photo',
          takePhoto: 'Take Photo',
          fromLibrary: 'Choose from Library',
          cancel: 'Cancel',
          cameraPermission: 'Camera Permission Required',
          cameraPermissionMessage: 'Please allow camera access in settings',
          libraryPermission: 'Photo Library Permission Required',
          libraryPermissionMessage: 'Please allow photo library access in settings',
          cameraError: 'Camera Error',
          cameraErrorMessage: 'Camera not supported in simulator, please use a real device or choose from photo library',
          chooseFailed: 'Failed to Choose Photo',
          chooseFailedMessage: 'Please try again',
        },
        lastEdited: 'Recently edited',
        sectionTitles: {
          passport: '👤 Passport Information',
          passportSubtitle: 'Thailand customs needs to verify your identity',
          personal: '👤 Personal Information',
          personalSubtitle: 'Let Thailand know more about you',
          funds: '💰 Proof of Funds',
          fundsSubtitle: 'Show your financial capability',
          travel: '✈️ Travel Information',
          travelSubtitle: 'Your Thailand itinerary',
        },
        sectionIntros: {
          passport: '🛂 Customs officers will verify your passport information. Please ensure it matches your passport exactly. Don\'t worry, we\'ll help you format it!',
          personal: '👤 This information helps Thailand understand your background and contact you if needed.',
          funds: '💰 Show your financial capability to support your Thailand trip.',
          travel: '✈️ Tell Thailand your travel plans so they can prepare a warm welcome for you.',
        },
        fields: {
          fullName: {
            label: 'Full Name',
            help: 'Please enter in Pinyin (e.g., LI, MAO) - Do not enter Chinese characters',
          },
          passportName: {
            label: 'Name on Passport',
            help: 'Fill in English name as shown on passport, e.g.: LI, MAO (surname first, given name last)',
          },
          surname: {
            label: 'Surname',
            help: 'Enter surname as shown on passport (in English)',
          },
          middleName: {
            label: 'Middle Name',
            help: 'If any (optional)',
          },
          givenName: {
            label: 'Given Name',
            help: 'Enter given name as shown on passport (in English)',
          },
          nationality: {
            label: 'Nationality',
            help: 'Please select your nationality',
          },
          passportNo: {
            label: 'Passport Number',
            help: 'Passport number is usually 8-9 alphanumeric characters, will be automatically capitalized',
          },
          visaNumber: {
            label: 'Visa Number (if any)',
            help: 'If you have a visa, please enter visa number (letters or numbers only)',
          },
          dob: {
            label: 'Date of Birth',
            help: 'Format: YYYY-MM-DD',
          },
          expiryDate: {
            label: 'Passport Expiry Date',
            help: 'Format: YYYY-MM-DD',
          },
          sex: {
            label: 'Gender',
            options: {
              female: 'Female',
              male: 'Male',
              undefined: 'Undefined',
            },
          },
          occupation: {
            label: 'Occupation',
            help: 'Please enter your occupation (in English)',
          },
          cityOfResidence: {
            label: 'City of Residence',
            help: 'Please enter your city of residence (in English)',
          },
          residentCountry: {
            label: 'Country of Residence',
            help: 'Please select your country of residence',
          },
          phoneCode: {
            label: 'Country Code',
          },
          phoneNumber: {
            label: 'Phone Number',
            help: 'Please enter your phone number',
          },
          email: {
            label: 'Email',
            help: 'Please enter your email address',
          },
          arrivalDate: {
            label: 'Arrival Date',
            help: 'Format: YYYY-MM-DD',
          },
          flightNumber: {
            label: 'Flight Number',
            help: 'Please enter your flight number',
          },
          departureCity: {
            label: 'Departure City',
            help: 'Please enter your departure city (in English)',
          },
          purposeOfVisit: {
            label: 'Purpose of Visit',
            help: 'Please select your purpose of visit',
            options: {
              tourism: 'Tourism',
              business: 'Business',
              family: 'Family Visit',
              medical: 'Medical Treatment',
              other: 'Other',
            },
          },
          hotelName: {
            label: 'Hotel Name',
            help: 'Please enter your hotel name (in English)',
          },
          hotelAddress: {
            label: 'Hotel Address',
            help: 'Please enter your hotel address (in English)',
          },
          hotelPhone: {
            label: 'Hotel Phone',
            help: 'Please enter your hotel phone number',
          },
          emergencyName: {
            label: 'Emergency Contact Name',
            help: 'Please enter emergency contact name (in English)',
          },
          emergencyPhone: {
            label: 'Emergency Contact Phone',
            help: 'Please enter emergency contact phone number',
          },
          emergencyRelationship: {
            label: 'Relationship',
            help: 'Please enter relationship (in English)',
          },
        },
        photo: {
          choose: 'Choose Photo',
          takePhoto: 'Take Photo',
          fromLibrary: 'Choose from Library',
          cancel: 'Cancel',
          cameraPermission: 'Camera Permission Required',
          cameraPermissionMessage: 'Please allow camera access in settings',
          cameraError: 'Camera Error',
          cameraErrorMessage: 'Camera not supported in simulator, please use a real device or choose from library',
          libraryPermission: 'Photo Library Permission Required',
          libraryPermissionMessage: 'Please allow photo library access in settings',
          chooseFailed: 'Failed to Choose Photo',
          chooseFailedMessage: 'Please try again',
        },
        continueButton: 'Continue',
      },
      tdacWebView: {
        errorBoundary: {
          title: 'Something went wrong',
          message: 'An unexpected error occurred. Please try again.',
          tryAgain: 'Try Again',
          close: 'Close',
        },
        qrCodeHandler: {
          permissionTitle: 'Photo Album Permission Required',
          permissionMessage: 'Please allow access to photo album in settings',
          savingQR: 'Saving QR code...',
          savedToApp: 'QR code saved to App',
          savedToAlbum: 'QR code saved to photo album',
          tempFileCleanedSuccess: 'Temporary file cleaned up',
          tempFileCleanedError: 'Temporary file cleanup (error path)',
          tempFileCleanupFailed: 'Temporary file cleanup failed',
          saveAlbumFailed: 'Failed to save to photo album',
          entryInfoUpdated: 'Entry info updated successfully via WebView',
          entryInfoUpdateFailed: 'Failed to update entry info',
          recentSubmissionFlagSet: 'Recent submission flag set for EntryPackService',
          qrSavedSuccess: {
            title: '🎉 QR Code Saved!',
            message: 'QR code has been saved to:\n1. App (view in "My Trips")\n2. Phone Gallery\n\nShow to immigration upon entry!',
            viewQR: 'View QR Code',
            ok: 'OK',
          },
          saveFailed: {
            title: 'Save Failed',
            message: 'Unable to save QR code, please take a screenshot',
          },
        },
        helperModal: {
          title: 'Copy Helper',
          close: '✕ Close',
          instruction: 'Click ⚡ to try auto-fill, or click "Copy" to paste manually if it fails',
          sections: {
            personal: 'Personal Information',
            trip: 'Trip & Accommodation',
            accommodation: 'Accommodation',
          },
          healthDeclaration: {
            title: 'Step 4: Health Declaration',
            note: 'For health declaration section, please select Yes or No on the webpage according to your actual situation',
          },
          tips: {
            title: '💡 Remember After Completion:',
            items: '• You will receive a confirmation email after submission\n• The email contains a QR code\n• Save a screenshot of the QR code\n• Show the QR code and passport upon entry',
          },
        },
        qrCodeModal: {
          title: '🎫 TDAC Entry Card',
          close: '✕',
          hint: 'Show this QR code to immigration for quick entry',
          subHint: 'Show this QR code to immigration',
          nameLabel: 'Name:',
          passportLabel: 'Passport:',
          savedTimeLabel: 'Saved:',
          saveAgain: '📷 Save to Album Again',
        },
        dataComparisonModal: {
          title: '🔍 Data Comparison',
          subtitle: 'Entry Info vs TDAC Submission',
          close: '✕ Close',
          summary: {
            title: '📊 Summary',
            totalFields: 'Total Fields:',
            validMappings: 'Valid Mappings:',
            overallStatus: 'Overall Status:',
            valid: '✅ VALID',
            issues: '❌ ISSUES',
          },
          fieldMappings: {
            title: '🔄 Field Mappings',
            source: 'Source:',
            original: 'Original:',
            tdac: 'TDAC:',
            transform: 'Transform:',
            statusMapped: '✅',
            statusTransformed: '🔄',
            statusError: '❌',
          },
          payload: {
            title: '📋 Complete TDAC Payload',
          },
          actions: {
            refresh: '🔄 Refresh Comparison',
            export: '📋 Export Data',
            exported: '✅ Exported',
            exportedMessage: 'Comparison data copied to clipboard',
          },
        },
      },

      // TDACSelectionScreen translations
      selection: {
        heroEmoji: '🌟',
        heroTitle: 'Choose Submission Method',
        heroSubtitle: 'Complete Thailand Arrival Card Quickly',
        backButton: 'Back',
        lightning: {
          badge: 'Recommended',
          badgeIcon: '📱',
          icon: '⚡',
          title: 'Lightning Submit',
          subtitle: 'Fast Track · Smart Validation',
          benefits: {
            time: { icon: '⏱️', value: '5-8 sec', label: 'Lightning Fast' },
            success: { icon: '🎯', value: '95%+', label: 'High Success Rate' },
            speed: { icon: '🚀', value: '3x Faster', label: 'Than Traditional' }
          },
          summary: 'Save queue time, get confirmation immediately after submission.',
          cta: 'Use Lightning Submit'
        },
        stable: {
          icon: '🛡️',
          title: 'Stable Submit',
          subtitle: 'Stable Channel · Clearly Visible',
          benefits: {
            time: { icon: '⏱️', value: '24 sec', label: 'Stable Completion' },
            success: { icon: '🎯', value: '85%', label: 'Reliable Success Rate' }
          },
          summary: 'Suitable for travelers who want to see every step.',
          cta: 'Choose Stable Option'
        },
        smartTip: {
          icon: '💡',
          title: 'Smart Recommendation',
          text: 'Lightning Submit recommended; you can switch to stable option anytime if you need the full process.'
        },
        footer: {
          text: 'We will accompany you through the entire process to ensure smooth submission.'
        }
      },

      // ThailandEntryQuestionsScreen translations
      entryQuestions: {
        topBarTitle: 'Entry Questions',
        header: {
          title: 'ชุดคำถาม-คำตอบสำหรับเจ้าหน้าที่',
          subtitle: 'Immigration Questions & Answers',
          subtitleZh: 'Common Entry Questions and Answers',
          description: '📋 Pre-filled answers to common entry questions based on your travel information, ready to show immigration officers'
        },
        languageSelector: { label: 'Language:', zh: 'Chinese', en: 'English', th: 'Thai' },
        filter: { showRequired: 'Show Required Questions Only', showAll: 'Show All Questions', count: '({{count}} questions)' },
        question: { required: 'Required', answerLabel: 'Answer:', tipsLabel: '💡 Tips:', suggestedLabel: 'Other Optional Answers:' },
        footer: {
          icon: 'ℹ️',
          infoText: 'These answers are automatically generated based on your submitted entry information. If immigration officers ask other questions, please answer truthfully.',
          instructionsTitle: 'Usage Instructions:',
          instruction1: '1. Show this page to immigration officer as reference',
          instruction2: '2. Switch languages for easier communication',
          instruction3: '3. Required questions are marked with badges'
        },
        empty: { icon: '📭', text: 'No questions to display', hint: 'Please ensure your entry information is completely filled' },
        loading: 'Loading entry questions...',
        errors: { missingEntryPack: 'Missing entry pack information', loadFailed: 'Failed to load entry questions, please try again later' }
      },

      // Enhanced travelInfo translations
      travelInfoEnhanced: {
        sectionIntros: {
          passport: { icon: '🛂', text: 'Customs officers will verify your passport information. Please ensure it matches your passport exactly. Don\'t worry, we\'ll help you format it!' },
          personal: { icon: '👤', text: 'This information helps Thailand understand your background and contact you if needed.' },
          funds: { icon: '💰', text: 'Show your financial capability to support your Thailand trip.' },
          travel: { icon: '✈️', text: 'Tell Thailand your travel plans so they can prepare a warm welcome for you.' }
        },
        saveStatus: { pending: 'Waiting to save...', saving: 'Saving...', saved: 'Saved', error: 'Save failed', retry: 'Retry' },
        lastEdited: 'Last edited: {{time}}',
        progress: {
          ready: 'Ready for Thailand! 🌴',
          completion: '{{percent}}% complete',
          hints: {
            start: '🌟 First step, start by introducing yourself!',
            early: 'Great start! Thailand welcomes you 🌺',
            mid: 'Continue my Thailand preparation journey 🏖️',
            late: '🚀 Almost done, your Thailand trip is just around the corner!'
          },
          nextSteps: {
            passport: '💡 Start with passport information, tell Thailand who you are',
            personal: '👤 Fill in personal information, let Thailand know you better',
            funds: '💰 Show your proof of funds, Thailand wants to ensure you have a great time',
            travel: '✈️ Last step, share your travel plans!'
          }
        }
      },

      // Constants translations
      occupations: {
        SOFTWARE_ENGINEER: 'Software Engineer', STUDENT: 'Student', TEACHER: 'Teacher', DOCTOR: 'Doctor',
        ACCOUNTANT: 'Accountant', SALES_MANAGER: 'Sales Manager', RETIRED: 'Retired', ENGINEER: 'Engineer',
        CIVIL_SERVANT: 'Civil Servant', LAWYER: 'Lawyer', NURSE: 'Nurse', FREELANCER: 'Freelancer',
        BUSINESS_OWNER: 'Business Owner', HOMEMAKER: 'Homemaker', DESIGNER: 'Designer', OTHER: 'Other'
      },
      travelPurposes: {
        HOLIDAY: 'Holiday/Tourism', MEETING: 'Meeting', SPORTS: 'Sports', BUSINESS: 'Business',
        INCENTIVE: 'Incentive', CONVENTION: 'Convention/Conference', EDUCATION: 'Education',
        EMPLOYMENT: 'Employment', EXHIBITION: 'Exhibition', MEDICAL: 'Medical Treatment'
      },
      accommodationTypes: {
        HOTEL: 'Hotel', HOSTEL: 'Hostel', GUESTHOUSE: 'Guesthouse',
        RESORT: 'Resort', APARTMENT: 'Apartment', FRIEND: 'Friend\'s House'
      },

      // Form validation error messages
      validation: {
        // Required field errors
        required: {
          passportNo: 'Passport number is required',
          surname: 'Surname is required',
          givenName: 'Given name is required',
          nationality: 'Nationality is required',
          dob: 'Date of birth is required',
          expiryDate: 'Passport expiry date is required',
          sex: 'Gender/sex is required',
          occupation: 'Occupation is required',
          cityOfResidence: 'City of residence is required',
          residentCountry: 'Resident country is required',
          phoneNumber: 'Phone number is required',
          email: 'Email address is required',
          travelPurpose: 'Travel purpose is required',
          arrivalDate: 'Arrival date is required',
          departureDate: 'Departure date is required',
          arrivalFlightNumber: 'Arrival flight number is required',
          departureFlightNumber: 'Departure flight number is required',
          accommodationType: 'Accommodation type is required',
          province: 'Province is required',
          district: 'District is required',
          subDistrict: 'Sub-district is required',
          postalCode: 'Postal code is required',
          hotelAddress: 'Hotel/accommodation address is required',
          recentStayCountry: 'Recent stay country is required',
          boardingCountry: 'Boarding country is required',
        },

        // Format validation errors
        format: {
          passportNo: 'Passport number format is invalid (typically 8-9 alphanumeric characters)',
          email: 'Email address format is invalid (e.g., example@email.com)',
          phoneNumber: 'Phone number format is invalid (8-15 digits)',
          phoneCode: 'Phone code format is invalid (e.g., +86, +1)',
          postalCode: 'Postal code format is invalid',
          flightNumber: 'Flight number format is invalid (e.g., TG123, CZ456)',
          uppercaseRequired: 'Must be in UPPERCASE letters',
          alphanumericOnly: 'Only letters and numbers are allowed',
          numbersOnly: 'Only numbers are allowed',
        },

        // Length validation errors
        length: {
          passportNoTooShort: 'Passport number is too short (minimum {{min}} characters)',
          passportNoTooLong: 'Passport number is too long (maximum {{max}} characters)',
          phoneNumberTooShort: 'Phone number is too short (minimum {{min}} digits)',
          phoneNumberTooLong: 'Phone number is too long (maximum {{max}} digits)',
          nameTooShort: 'Name is too short (minimum {{min}} characters)',
          nameTooLong: 'Name is too long (maximum {{max}} characters)',
          textTooLong: 'Text exceeds maximum length of {{max}} characters',
        },

        // Date validation errors
        date: {
          invalid: 'Invalid date format',
          pastRequired: 'Date must be in the past',
          futureRequired: 'Date must be in the future',
          passportExpired: 'Passport has already expired',
          passportExpiringSoon: 'Passport expires within 6 months - may be rejected by immigration',
          dobTooRecent: 'Date of birth is too recent (must be at least {{minAge}} years old)',
          dobTooOld: 'Date of birth seems unrealistic (please check)',
          arrivalBeforeDeparture: 'Arrival date must be before departure date',
          departureBeforeArrival: 'Departure date must be after arrival date',
          arrivalTooFar: 'Arrival date is too far in the future ({{maxDays}} days maximum)',
          arrivalTooSoon: 'Arrival date is too soon (minimum {{minHours}} hours from now)',
          stayTooLong: 'Stay duration exceeds visa-free limit ({{maxDays}} days)',
        },

        // Specific field warnings (non-critical)
        warning: {
          nameNotUppercase: 'Name should be in UPPERCASE as shown on passport',
          nameMismatch: 'Name format may not match passport - please verify',
          passportExpiringWithin6Months: 'Passport expires in {{months}} months - some countries require 6+ months validity',
          emailUncommon: 'Email format is uncommon - please verify',
          phoneNumberShort: 'Phone number seems short - please verify',
          occupationOther: 'You selected "Other" - please enter your occupation in the custom field',
          cityNotRecognized: 'City not recognized - please verify spelling',
          missingFlightPhoto: 'Flight ticket photo not uploaded - recommended for faster processing',
          missingHotelPhoto: 'Hotel reservation photo not uploaded - recommended for verification',
          transitPassenger: 'You marked as transit passenger - accommodation details may not be required',
        },

        // Photo upload errors
        photo: {
          uploadFailed: 'Failed to upload photo - please try again',
          invalidFormat: 'Invalid photo format - please use JPG, PNG, or PDF',
          fileTooLarge: 'Photo file is too large (maximum {{maxSize}}MB)',
          permissionDenied: 'Camera/photo library permission denied - please enable in settings',
          cameraNotAvailable: 'Camera not available on this device',
          processingFailed: 'Failed to process photo - please try another photo',
        },

        // Location cascade errors
        location: {
          provinceRequired: 'Please select a province first',
          districtRequired: 'Please select a district',
          subDistrictRequired: 'Please select a sub-district',
          invalidProvince: 'Selected province is invalid',
          invalidDistrict: 'Selected district is invalid for this province',
          invalidSubDistrict: 'Selected sub-district is invalid for this district',
          loadingFailed: 'Failed to load location data - please try again',
        },

        // Network/Save errors
        save: {
          failed: 'Failed to save data - please check your connection',
          retrying: 'Retrying save... ({{attempt}}/{{max}})',
          offline: 'You are offline - data will be saved when connection is restored',
          conflict: 'Data conflict detected - please refresh and try again',
          timeout: 'Save timeout - please check your internet connection',
        },

        // TDAC submission errors
        submission: {
          missingRequiredFields: 'Please complete all required fields before submitting',
          invalidData: 'Some data is invalid - please check highlighted fields',
          networkError: 'Network error - please check your connection and try again',
          serverError: 'Server error - please try again later',
          cloudflareTimeout: 'Cloudflare verification timeout - please try again',
          submissionWindowClosed: 'Submission window has closed - please contact support',
          submissionWindowNotOpen: 'Submission window not yet open - please wait until {{openTime}}',
          duplicateSubmission: 'This entry has already been submitted',
          rateLimitExceeded: 'Too many attempts - please wait {{minutes}} minutes',
        },
      },
    },
    japan: {
      info: {
        headerTitle: 'Japan Entry Information',
        title: 'Japan Entry Guide',
        subtitle: 'Visa-free for 90 days for Chinese passport holders',
        sections: {
          visa: {
            title: '✓ Great News! Visa-Free Policy',
            items: [
              'Chinese passport holders can visit Japan visa-free for 90 days - spontaneous travel!',
              '• No visa application needed in advance',
              '• Valid for tourism, business, and visiting friends/relatives',
              '• Entry card and customs declaration must be completed upon arrival',
            ],
          },
          important: {
            title: '⚠️ Entry Requirements',
            items: [
              '• Forms must be completed in black or blue ink.',
              '• Handwriting must be clear and legible.',
              '• Answer all customs form questions truthfully.',
              '• Keep your entry card stub until departure.',
              '• Biometric scanning (fingerprint/facial) is required.',
            ],
          },
          appFeatures: {
            title: '✨ BorderBuddy Makes It Easy',
            items: [
              '• Zero anxiety: Automatic reminders for form filling and biometric steps.',
              '• Zero errors: Copy mode ensures accurate data transfer to paper forms.',
              '• Zero hassle: Detailed step-by-step guide covers the entire process.',
              '• Document checklist: Complete preparation list for immigration/customs.',
            ],
          },
        },
        continueButton: 'Got it, continue preparation',
      },
      requirements: {
        headerTitle: 'Japan Entry Checklist',
        introTitle: 'Entry Preparation Checklist',
        introSubtitle: 'Fill in what you have and complete gradually',
        items: {
          validVisa: {
            title: 'Valid Visa',
            description: 'Approved Japan tourist visa',
            details: 'Chinese citizens need to apply for a visa in advance. Confirm your visa is valid and has sufficient entries.',
          },
          validPassport: {
            title: 'Valid Passport',
            description: 'Passport valid for at least 6 months',
            details: 'Passport must be valid for at least 6 months beyond your planned departure date',
          },
          returnTicket: {
            title: 'Return Ticket',
            description: 'Confirmed return or onward journey ticket',
            details: 'Must have a clear departure plan showing you will leave Japan within 90 days',
          },
          sufficientFunds: {
            title: 'Sufficient Funds',
            description: 'Proof of funds for entire stay',
            details: 'Recommended to carry at least 100,000 yen or equivalent, or show credit cards/bank statements',
          },
          accommodation: {
            title: 'Accommodation Proof',
            description: 'Hotel booking or host contact information in Japan',
            details: 'Provide hotel reservation confirmation or detailed contact information of friends/relatives in Japan',
          },
        },
        status: {
          success: {
            title: 'Great! You can proceed.',
            subtitle: 'Next we will confirm your travel information.',
          },
          warning: {
            title: 'Check each checklist item',
            subtitle: 'Complete the prerequisites before continuing.',
          },
          info: {
            title: 'Start anytime',
            subtitle: 'We support progressive completion',
          },
        },
        startButton: 'Start Filling',
      },
      procedures: {
        headerTitle: 'Japan Entry Procedures',
        title: 'Japan Entry Guide',
        subtitle: 'Visa-free for 90 days for Chinese passport holders',
        helpSection: {
          title: '✨ BorderBuddy Makes It Easy',
          description: 'We help you prepare all required documents and guide you through each step of the Japan entry process.',
          subdescription: 'From filling out forms to biometric scanning, we\'ll be with you every step of the way.',
        },
        entrySteps: {
          title: 'Entry Process Steps',
          steps: [
            {
              title: 'Get Forms',
              description: 'Find entry card and customs declaration in arrival hall',
              details: 'Locate the "Entry Card" and "Customs Declaration" counters or automated dispensers in the arrival area.',
            },
            {
              title: 'Fill Entry Card',
              description: 'Complete the black entry card with black or blue pen',
              details: 'Carefully copy your information from your phone to the form. Use the copy mode for easy reference.',
            },
            {
              title: 'Fill Customs Declaration',
              description: 'Complete the yellow customs declaration form',
              details: 'Declare items honestly. Answer questions about prohibited items and commercial goods truthfully.',
            },
            {
              title: 'Immigration Check',
              description: 'Present passport and completed forms to immigration officer',
              details: 'Join the "Foreigner" lane. Hand your passport and entry card to the officer and answer simple questions.',
            },
            {
              title: 'Biometric Check',
              description: 'Complete fingerprint and facial recognition',
              details: 'Follow the officer\'s instructions for the biometric scanning process.',
            },
            {
              title: 'Customs Inspection',
              description: 'Collect luggage and proceed to customs inspection',
              details: 'Present your customs declaration. Use the green channel if nothing to declare, red channel for inspection if needed.',
            },
            {
              title: 'Entry Complete',
              description: 'Welcome to Japan!',
              details: 'Your entry pack is available anytime if you need to reference your information.',
            },
          ],
        },
        features: {
          title: 'App Features',
          items: [
            {
              icon: '📋',
              title: 'Form Assistant',
              description: 'Step-by-step guidance for all required forms',
            },
            {
              icon: '📱',
              title: 'Copy Mode',
              description: 'Large font display for easy form copying',
            },
            {
              icon: '🛂',
              title: 'Process Guide',
              description: 'Detailed walkthrough of each entry step',
            },
            {
              icon: '❓',
              title: 'Q&A Support',
              description: 'Common questions and helpful answers',
            },
          ],
        },
        importantNotes: {
          title: 'Important Notes',
          items: [
            '• Forms must be completed in black or blue ink',
            '• Handwriting should be clear and legible',
            '• Answer all questions truthfully on customs forms',
            '• Keep your entry card stub until departure',
            '• Biometric scanning is required for all visitors',
            '• Have your return ticket and accommodation details ready',
          ],
        },
        startButton: 'Start Preparation',
      },
      travelInfo: {
        headerTitle: 'Japan Entry Information',
        title: 'Fill in Japan Entry Information',
        subtitle: 'Please provide the following information to prepare for entry',
        privacyNote: '💾 All information is saved locally on your device only',
        loading: 'Loading...',
        sections: {
          passport: 'Passport Information',
          personal: 'Personal Information',
          funds: 'Funding Proof',
          travel: 'Travel Information',
        },
        fields: {
          passportName: 'Passport Name (English)',
          passportNamePlaceholder: 'Enter name as shown on passport',
          nationality: 'Nationality',
          nationalityPlaceholder: 'Select nationality',
          passportNumber: 'Passport Number',
          passportNumberPlaceholder: 'Enter passport number',
          passportNumberHelp: '6-12 alphanumeric characters',
          dateOfBirth: 'Date of Birth',
          dateOfBirthHelp: 'Select your date of birth',
          expiryDate: 'Passport Expiry Date',
          expiryDateHelp: 'Select passport expiration date',
          occupation: 'Occupation',
          occupationPlaceholder: 'Enter your occupation',
          cityOfResidence: 'City of Residence',
          cityOfResidencePlaceholder: 'Enter your city of residence',
          residentCountry: 'Country of Residence',
          residentCountryPlaceholder: 'Select country of residence',
          phoneCode: 'Country Code',
          phoneCodePlaceholder: '+86',
          phoneNumber: 'Phone Number',
          phoneNumberPlaceholder: 'Enter phone number',
          email: 'Email Address',
          emailPlaceholder: 'Enter email address',
          gender: 'Gender',
          genderMale: 'Male',
          genderFemale: 'Female',
          genderUndefined: 'Unspecified',
          travelPurpose: 'Purpose of Travel',
          travelPurposeTourism: 'Tourism',
          travelPurposeBusiness: 'Business',
          travelPurposeVisiting: 'Visiting Relatives',
          travelPurposeTransit: 'Transit',
          travelPurposeOther: 'Other',
          customTravelPurpose: 'Specify Purpose',
          customTravelPurposePlaceholder: 'Please specify your travel purpose',
          arrivalFlightNumber: 'Arrival Flight Number',
          arrivalFlightNumberPlaceholder: 'e.g., NH123',
          arrivalDate: 'Arrival Date',
          arrivalDateHelp: 'Select your arrival date',
          accommodationType: 'Accommodation Type',
          accommodationTypeHotel: 'Hotel',
          accommodationTypeRyokan: 'Ryokan',
          accommodationTypeFriend: "Friend's House",
          accommodationTypeAirbnb: 'Airbnb',
          accommodationTypeOther: 'Other',
          customAccommodationType: 'Specify Accommodation Type',
          customAccommodationTypePlaceholder: 'Please specify accommodation type',
          accommodationName: 'Accommodation Name',
          accommodationNamePlaceholder: 'Enter hotel/accommodation name',
          accommodationAddress: 'Accommodation Address',
          accommodationAddressPlaceholder: 'Enter full address in Japan',
          accommodationAddressHelp: 'e.g., 1-2-3 Shibuya, Shibuya-ku, Tokyo 150-0002',
          accommodationPhone: 'Accommodation Phone',
          accommodationPhonePlaceholder: 'Enter accommodation phone number',
          lengthOfStay: 'Length of Stay (days)',
          lengthOfStayPlaceholder: 'Enter number of days',
        },
        placeholders: {
          fundsSection: 'Fund information fields will be implemented in a future task',
          travelSection: 'Travel information fields will be implemented in a future task',
        },
        funds: {
          emptyMessage: 'No fund items added yet. Add at least one fund item to show proof of funds.',
          addButton: 'Add Fund Item',
        },
        continueButton: 'View Entry Guide',
        errors: {
          loadingFailed: 'Error Loading Data',
          loadingFailedMessage: 'Failed to load existing data. You can still enter new information.',
          saveFailed: 'Failed to save data. Please try again.',
          completeAllFields: 'Please complete all required fields',
          invalidPassportNumber: 'Passport number must be 6-12 letters and numbers',
          invalidDateFormat: 'Invalid date format',
          invalidDate: 'Invalid date',
          expiryDateFuture: 'Passport expiry date must be in the future',
          dobPast: 'Date of birth must be in the past',
          invalidName: 'Name should contain only letters, spaces, hyphens, apostrophes, and periods',
          nameTooShort: 'Name must be at least 2 characters',
          selectNationality: 'Please select a nationality',
          invalidEmail: 'Invalid email format',
          invalidPhone: 'Invalid phone number format',
          occupationTooShort: 'Occupation must be at least 2 characters',
          invalidFlightNumber: 'Invalid flight number format (e.g., NH123)',
          arrivalDateFuture: 'Arrival date must be in the future',
          invalidAccommodationPhone: 'Invalid accommodation phone number format',
          invalidLengthOfStay: 'Length of stay must be a positive number',
          lengthOfStayTooLong: 'Length of stay cannot exceed 180 days',
        },
      },
    },
    result: {
      title: '{{flag}} {{country}} Entry Pack Ready',
      subtitle: 'All documents are ready to present at the airport',
      entryPack: {
        title: 'Entry Pack',
        subtitle: '{{subtitle}}',
        share: 'Share',
        fields: {
          traveler: 'Name',
          passportNo: 'Passport',
          flightNo: 'Flight',
          departureDate: 'Departure',
          arrivalDate: 'Arrival',
          accommodation: 'Hotel',
        },
        notFilled: 'Not filled',
        toBeConfirmed: 'To be confirmed',
        actions: {
          startGuide: 'Start Arrival Guide',
          editInfo: 'Edit Information',
        },
        lastUpdated: 'Last updated: {{time}}',
        subtitleParts: {
          departure: 'Departure {{date}}',
          arrival: 'Arrival {{date}}',
          flight: 'Flight {{flight}}',
          missing: 'Please complete travel details',
        },
      },
      historyBanner: {
        badge: 'Pending Trip',
        status: 'Auto-saved',
        description: 'Information saved in entry pack. Can be edited or shared anytime.',
        primaryCta: {
          title: 'Start Entry Guide',
          subtitle: 'Step-by-step · Large font available',
        },
        secondaryCta: {
          shareFamily: 'Share',
          editInfo: 'Edit',
        },
        footer: {
          title: '🛃 Final step: Present to customs',
          note: 'Copy mode is just one step in the process. Follow the guide after landing.',
        },
      },
      digitalInfo: {
        title: 'Online {{systemName}} required',
        button: 'Apply now',
        autoFill: '⚡ Auto-fill',
      },
      checkSection: {
        title: 'Need to check information?',
        viewForm: {
          title: 'View complete form',
          subtitle: '{{count}} items filled',
        },
        qaGuide: {
          title: 'Customs Q&A guide',
          subtitle: '{{count}} common questions',
        },
      },
      footer: 'Done! Return home',
      infoBox: 'Automatically saved to "History", view anytime',
      errors: {
        pdfFailed: 'Failed to generate PDF',
        downloadFailed: 'Download failed',
        shareFailed: 'Share failed',
        shareUnavailable: 'Sharing is not supported on this device',
        printFailed: 'Print failed',
      },
    },
    profile: {
      header: 'Profile',
      user: {
        phone: 'Phone: {{phone}}',
      },
      common: {
        notFilled: 'Not filled',
      },
      personal: {
        title: 'Personal Information',
        subtitle: 'Update border details',
        collapsedHint: 'Tap to expand personal information',
        fields: {
          dateOfBirth: {
            title: 'Date of Birth',
            subtitle: 'Date of Birth',
            placeholder: 'YYYY-MM-DD',
          },
          gender: {
            title: 'Gender',
            subtitle: 'Gender',
            placeholder: 'MALE / FEMALE',
          },
          occupation: {
            title: 'Occupation',
            subtitle: 'Occupation',
            placeholder: 'Occupation',
          },
          provinceCity: {
            title: 'City / Province',
            subtitle: 'Province / City of Residence',
            placeholder: 'Province / City',
          },
          countryRegion: {
            title: 'Country / Region',
            subtitle: 'Country / Region',
            placeholder: 'Country / Region',
          },
          phone: {
            title: 'Phone Number',
            subtitle: 'Phone',
            placeholder: '+86 1234567890',
          },
          email: {
            title: 'Email Address',
            subtitle: 'Email',
            placeholder: 'your@email.com',
          },
        },
      },
      funding: {
        title: 'Funding Proof Checklist',
        subtitle: 'Show quickly at immigration',
        collapsedHint: 'Tap to expand funding checklist',
        addButton: 'Add Fund Item',
        selectType: 'Select Fund Item Type',
        selectTypeMessage: 'Choose the type of fund item to add',
        empty: 'No fund items yet. Tap below to add your first item.',
        footerNote: 'Information syncs to your entry pack for immigration checks.',
        actions: {
          scanProof: 'Scan / Upload Funding Proof',
        },
        fields: {
          cashAmount: {
            title: 'Cash on hand',
            placeholder: 'e.g. 10,000 THB cash + 500 USD',
            sample: '10,000 THB equivalent cash (about ¥2,000)',
          },
          bankCards: {
            title: 'Bank cards & balances',
            placeholder: 'e.g.\nCMB Visa (****1234) · Balance 20,000 CNY',
            sample:
              'CMB Visa (****1234) · Balance 20,000 CNY\nICBC Debit (****8899) · Balance 15,000 CNY',
          },
          supportingDocs: {
            title: 'Supporting documents',
            placeholder: 'e.g. bank balance screenshots, transaction PDFs, statements',
            sample: 'Bank app screenshots and recent transaction PDFs saved',
          },
        },
      },
      fundItem: {
        create: {
          title: 'Add Fund Item',
          success: 'Fund item added successfully',
        },
        detail: {
          title: 'Fund Item Details',
          editTitle: 'Edit Fund Item',
          edit: 'Edit',
          delete: 'Delete',
          save: 'Save Changes',
          cancel: 'Cancel',
          manageAll: 'Manage All Funds',
          addPhoto: 'Add Photo',
          replacePhoto: 'Replace Photo',
          viewPhoto: 'Tap to view full size',
          noPhoto: 'No photo attached',
          photo: 'Photo',
          photoOptions: 'Choose an option',
          takePhoto: 'Take Photo',
          chooseFromLibrary: 'Choose from Library',
          photoHint: 'Pinch to zoom, drag to pan',
        },
        fields: {
          amount: 'Amount',
          currency: 'Currency',
          description: 'Description',
          descriptionPlaceholder: 'Add a description (optional)',
          type: 'Type',
          selectCurrency: 'Select Currency',
        },
        types: {
          CASH: 'Cash',
          BANK_CARD: 'Bank Card',
          DOCUMENT: 'Supporting Document',
        },
        deleteConfirm: {
          title: 'Delete Fund Item',
          message: 'Are you sure you want to delete this fund item?',
          confirm: 'Delete',
          cancel: 'Cancel',
        },
        validation: {
          amountRequired: 'Amount is required',
          amountInvalid: 'Amount must be a valid number',
          amountPositive: 'Amount must be greater than 0',
          currencyRequired: 'Currency is required',
          currencyFormat: 'Currency must be a 3-letter code',
        },
        errors: {
          loadFailed: 'Failed to load fund item details',
          updateFailed: 'Failed to save changes. Please try again.',
          deleteFailed: 'Failed to delete fund item. Please try again.',
          photoFailed: 'Failed to update photo. Please try again.',
          permissionTitle: 'Permission Required',
          permissionMessage: 'Please grant permission to access your photo library.',
          cameraPermissionMessage: 'Please grant permission to access your camera.',
        },
        success: {
          photoUpdated: 'Success',
          photoUpdatedMessage: 'Photo has been updated successfully.',
        },
        accessibility: {
          amountHint: 'Enter the amount of money for this fund item',
          currencyHint: 'Opens currency picker to select a currency',
          descriptionHint: 'Enter an optional description for this fund item',
          photoPreview: 'Fund item photo preview',
          photoPreviewHint: 'Double tap to view full size photo',
          addPhotoHint: 'Opens options to take a photo or choose from library',
          replacePhotoHint: 'Opens options to take a new photo or choose from library',
          saveHint: 'Saves your changes and returns to view mode',
          cancelHint: 'Discards your changes and returns to view mode',
          editHint: 'Opens edit mode to modify fund item details',
          deleteHint: 'Deletes this fund item after confirmation',
          manageAllHint: 'Navigates to the full fund management screen',
          closeModalHint: 'Closes the fund item detail modal',
          backHint: 'Returns to the previous screen',
          closeCurrencyPickerHint: 'Closes the currency picker',
          selectCurrencyHint: 'Selects this currency',
        },
      },
      passport: {
        title: 'My Passport',
        subtitle: '{{passportNo}} · Valid until {{expiry}}',
        collapsedHint: 'Tap to expand passport details',
        updateButton: 'Update passport info',
        fields: {
          passportNo: 'Passport Number',
          nationality: 'Nationality',
          expiry: 'Expiry Date',
          issueDate: 'Issue Date',
          issuePlace: 'Issue Place',
        },
      },
      vip: {
        title: 'Upgrade to Premium',
        subtitle: 'Unlimited generations, priority processing',
        upgradeButton: 'Upgrade now',
      },
      sections: {
        myServices: 'My Services',
        settings: 'Settings & Help',
      },
      menu: {
        documents: { title: 'My Documents', badge: '({{count}})' },
        history: { title: 'Generation History', badge: '({{count}})' },
        backup: {
          title: 'Cloud Backup',
          subtitle: 'Recent: {{time}}',
          defaultTime: 'Today',
        },
        language: {
          title: 'Language',
          subtitle: 'Current: {{language}}',
        },
        settings: { title: 'Settings' },
        help: { title: 'Help Center' },
        about: { title: 'About Us' },
        notifications: { title: 'Notification Settings' },
        notificationLogs: { title: 'Notification Logs', subtitle: 'View notification history and analytics' },
      },
      editModal: {
        save: 'Save',
      },
      logout: 'Log out',
      version: 'Version {{version}}',
    },
    generating: {
      title: 'Processing',
      message: 'AI is generating your entry pack',
      estimate: 'Estimated {{seconds}} seconds remaining...',
      stepsTitle: 'What we\'re doing:',
      steps: {
        verifyDocument: 'Verifying document info',
        checkExpiry: 'Checking expiry',
        generateForm: 'Generating {{country}} entry form',
        generateQA: 'Generating customs Q&A card',
        translate: 'Translating to local language',
      },
      errors: {
        title: 'Generation failed',
        message: 'Please try again later',
        retry: 'Retry',
        goBack: 'Go back',
      },
    },
    immigrationGuide: {
      back: 'Back',
      needHelp: 'Need Help',
      previousStep: 'Previous',
      completeEntry: 'Complete Entry, Return to Pack',
      openEntryPack: 'Open Entry Pack',
      previewEntryPack: 'Preview Entry Pack',
      modalClose: 'Close',
      entryCardSampleTitle: 'Entry Card Sample',
      customsDeclarationSampleTitle: 'Customs Declaration Sample',
      clickToViewLarge: 'Click to view large image',
      entryCardModalTitle: 'Japan Entry Card Sample',
      entryCardModalHint: 'Screenshot or zoom to view each field\'s example',
      biometricModalTitle: 'Japan Biometric Guide',
      biometricModalHint: 'Place your finger lightly on the scanner to complete collection',
      customsModalTitle: 'Japan Customs Declaration Sample',
      customsModalHint: 'Screenshot or zoom to view how to answer each question',
      helpMenu: {
        title: 'Need Help?',
        message: 'Please select the type of help you need:',
        findStaff: 'Find Staff',
        findStaffMessage: 'Please look for uniformed staff members',
        languageHelp: 'Language Help',
        languageHelpMessage: 'Staff members speak English and Japanese',
        medicalHelp: 'Medical Help',
        medicalHelpMessage: 'Please call airport medical emergency',
        cancel: 'Cancel',
        notice: 'Notice',
        emergency: 'Emergency',
      },
      japanSteps: {
        step1: {
          title: '📋 Step 1: Get Forms',
          description: 'Find entry card and customs declaration in arrival hall',
          instruction: 'Find counters marked \'Entry Card\' and \'Customs Declaration\' or automated dispensers',
          action: 'Next: Fill Entry Card',
        },
        step2: {
          title: '✍️ Step 2: Fill Entry Card',
          description: 'Fill out black entry card with black or blue pen',
          instruction: 'Carefully copy information from your phone to the form',
          action: 'Next: Customs Declaration',
          formPreviewTitle: '📋 Entry Card Sample',
          formPlaceholderText: 'Black Entry Card',
          formPlaceholderHint: 'Includes personal information, passport number,\\nflight info, accommodation address, etc.',
          viewFormButton: 'Fill Out Entry Form',
        },
        step3: {
          title: '📝 Step 3: Fill Customs Declaration',
          description: 'Fill out yellow customs declaration form',
          instruction: 'Declare items honestly, answer questions about prohibited items',
          action: 'Next: Immigration Check',
          formPreviewTitle: '📋 Customs Declaration Sample',
          formPlaceholderText: 'Yellow Customs Declaration',
          formPlaceholderHint: 'Includes item declarations,\\nprohibited items questions',
          imageHint: 'Tap to view full-size image before filling',
          viewFormButton: 'Fill Out Declaration',
        },
        step4: {
          title: '🏢 Step 4: Go to Immigration',
          description: 'Take your passport and completed forms to immigration counter',
          instruction: 'Find the "Foreigner" lane and queue up. When it\'s your turn, hand your passport and entry card to the officer. Smile and answer simple questions (purpose of visit, duration of stay, etc.)',
          action: 'Next: Biometric Check',
        },
        step5: {
          title: '👤 Step 5: Biometric Check',
          description: 'Fingerprint and facial recognition',
          instruction: 'Follow officer\'s instructions to complete biometric scan',
          action: 'Next: Customs Inspection',
          biometricNotice: '👆 Biometric Example',
          biometricCaption: 'Japan immigration fingerprint scanner',
          viewBiometricButton: 'View Biometric Guide',
        },
        step6: {
          title: '🛃 Step 6: Customs Inspection',
          description: 'After collecting luggage, proceed to customs inspection area',
          instruction: 'Hand your customs declaration form to the officer. If you checked "Yes" on any question or are asked by officer, use the red channel for inspection. If all answers are "No" and you have nothing to declare, use the green channel for quick exit',
          action: 'Complete Customs Check',
        },
        step7: {
          title: '✅ Step 7: Entry Complete',
          description: 'Entry pack for use when needed',
          instruction: 'If immigration officer asks questions or language difficulty, open entry pack to assist',
          action: 'Open Entry Pack',
        },
      },
    },
  },
  zh: {
    languages: {
      en: 'English',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
      zh: '中文',
    },
    common: {
      appName: '入境通 BorderBuddy',
      enterCta: '免费进入',
      footerMessage: '现在免费体验 BorderBuddy · AI 帮你搞定出入境',
      ok: '好的',
      cancel: '取消',
      confirm: '确认',
      back: '返回',
      view: '查看',
      unknown: '未知',
      yes: '是',
      no: '否',
      error: '错误',
    },
    tabs: {
      home: '首页',
      history: '历史',
      profile: '我的',
    },
    screenTitles: {
      scanPassport: '扫描证件',
      selectDestination: '选择目的地',
      result: '入境包',
      copyWriteMode: '抄写模式',
    },
    copyWriteMode: {
      title: '抄写模式',
      subtitle: '对照此屏幕填写纸质表格',
      description: '屏幕会保持常亮，方便您慢慢抄写',
      fontSizeLabel: '字体大小：',
      instructionsTitle: '使用说明',
      step1: '1. 按照屏幕内容抄写到纸质表格',
      step2: '2. 按照表格顺序从上往下填写',
      step3: '3. 填写完成后交给入境官员',
      // 日本表格
      japanLandingCard: '入境卡（黑色表格）',
      japanCustomsDeclaration: '海关申报单（黄色表格）',
      // 加拿大 E311 表格
      canadaPart1: '第一部分：旅客信息',
      canadaPart2: '第二部分：地址信息',
      canadaPart3: '第三部分：旅行详情',
      canadaPart4: '第四部分：海关申报（打勾 ✓ 或 ✗）',
      // 字段标签
      familyName: '姓',
      givenName: '名',
      lastName: '姓',
      firstName: '名',
      middleInitial: '中间名首字母',
      dateOfBirth: '出生日期',
      nationality: '国籍',
      citizenship: '国籍',
      passportNumber: '护照号码',
      flightNumber: '航班号',
      purposeOfVisit: '入境目的',
      addressInJapan: '住宿地址',
      name: '姓名',
      prohibitedItems: '是否有违禁品？',
      cashOverLimit: '携带现金超过10,000日元？',
      commercialGoods: '是否有商业物品？',
      totalValueOfGoods: '携带物品总价值',
      homeAddress: '家庭住址',
      postalCode: '邮编',
      airlineFlightNumber: '航班号',
      arrivalDate: '到达日期',
      arrivingFrom: '来自哪个国家',
      purposeOfTrip: '入境目的',
      currencyOverLimit: '携带现金超过$10,000加元？',
      commercialGoodsForResale: '携带商业物品、样品或用于转售的商品？',
      foodPlantsAnimals: '携带食品、植物、动物或相关产品？',
      visitedFarm: '近期访问过农场或接触过农场动物？',
      firearms: '携带枪支或武器？',
      exceedsDutyFree: '携带物品超过免税额度？',
      // 说明文字
      instructionFamilyName: '填写护照上的姓氏',
      instructionGivenName: '填写护照上的名字',
      instructionLastName: '填写护照上的姓（大写字母）',
      instructionFirstName: '填写护照上的名（大写字母）',
      instructionMiddleInitial: '如果没有中间名，留空',
      instructionDateOfBirth: '格式：年月日（YYYYMMDD）',
      instructionDateOfBirthDash: '格式：年-月-日（YYYY-MM-DD）',
      instructionNationality: '填写国籍',
      instructionCitizenship: '填写国籍（大写字母）',
      instructionPassportNumber: '填写护照号码',
      instructionFlightNumber: '例如：CA981, CZ309',
      instructionFlightNumberCanada: '例如：AC088, CZ329',
      instructionPurposeOfVisit: '填写 TOURISM',
      instructionAddressInJapan: '填写酒店名称和地址',
      instructionName: '填写中文姓名',
      instructionProhibitedItems: '如果没有违禁品，填 NO',
      instructionTruthfulAnswer: '如实回答',
      instructionTotalValue: '一般填写 ¥0（无需要申报的物品）',
      instructionCanadaAddress: '填写在加拿大的住址（酒店地址）',
      instructionPostalCode: '酒店的邮编（如果知道的话）',
      instructionDateFormat: '格式：年-月-日',
      instructionArrivingFrom: '如果从美国转机，填 U.S.A.',
      instructionPurposeOptions: '选项：Study / Personal / Business',
      instructionFoodItems: '包括：水果、肉类、种子、木制品等',
      instructionGiftsLimit: '礼品超过$60加元需申报',
      // 提示
      tipsTitle: '重要提示',
      tipJapan1: '请用黑色或蓝色笔填写表格',
      tipJapan2: '字迹要清晰工整，避免涂改',
      tipJapan3: '海关申报部分一定要如实填写',
      tipJapan4: '填写完成后，交给入境官员检查',
      tipJapan5: '保留入境卡副联直到离境',
      tipCanada1: '请用大写英文字母填写姓名和国籍',
      tipCanada2: '日期格式：年-月-日（例如：2025-01-15）',
      tipCanada3: '海关申报部分一定要如实填写',
      tipCanada4: '填写完成后，在表格底部签名',
      tipCanada5: '16岁以下的儿童可由父母代签',
      // 样本卡片
      sampleTitleJapan: '入境卡和申报单样式',
      sampleTitleCanada: 'E311 表格样式',
      sampleImageTitleJapan: '入境卡和海关申报单',
      sampleImageTitleCanada: 'E311 海关申报单',
      sampleSubtitle: '（纸质表格图片示例）',
      sampleDescription: '表格上的字段顺序与本页面一致',
      // 底部提示
      bottomTipTitle: '抄写完成后，记得检查一遍',
      bottomTipDescription: '确保姓名、护照号、航班号等重要信息正确',
      // 值和占位符
      valueLeaveBlank: '（留空）',
      defaultChineseName: '张伟',
    },
    login: {
      tagline: '跨境入境 • 畅通无阻',
      benefits: {
        free: '完全免费',
        noRegistration: '无需注册',
        instant: '即时使用',
      },
      ctaTitle: '跨境入境，从未如此简单',
      ctaSubtitle: '一键填写入境表格，畅享无缝通关体验',
      buttonText: '开始使用 · 免费',
      buttonSubtext: '无需注册，即刻体验',
      popularityText: '🔥 {{percent}}% 顺畅入境',
      hotlistLabel: '热门目的地',
      hotlistDescription: '本周最受关注的旅行地',
    },
    home: {
      header: {
        title: '入境通',
      },
      greeting: '你好，{{name}} 👋',
      welcomeText: '选择目的地，生成您的通关包',
      sections: {
        pending: '🛬 即将出行',
        whereToGo: '🧭 想去哪里？',
      },
      passport: {
        type: '中国护照',
      },
      destinationNames: {
        jp: '日本',
        th: '泰国',
        hk: '香港',
        tw: '台湾',
        kr: '韩国',
        sg: '新加坡',
        my: '马来西亚',
        us: '美国',
      },
      destinations: {
        japan: { flightTime: '3小时飞行' },
        thailand: { flightTime: '3小时飞行' },
        hongKong: { flightTime: '1小时飞行' },
        taiwan: { flightTime: '2小时飞行' },
        korea: { flightTime: '2小时飞行' },
        singapore: { flightTime: '5小时飞行' },
        malaysia: { flightTime: '4小时飞行' },
        usa: { flightTime: '13小时飞行' },
      },
      pendingTrips: {
        departSuffix: '出发',
        cards: {
          jp: { title: '日本 · 东京' },
          th: { title: '泰国 · 曼谷' },
          us: { title: '美国 · 纽约' },
          kr: { title: '韩国 · 首尔' },
          sg: { title: '新加坡 · 樟宜' },
          my: { title: '马来西亚 · 吉隆坡' },
          tw: { title: '台湾 · 台北' },
          hk: { title: '香港' },
        },
      },
      alerts: {
        notAvailableTitle: '敬请期待',
        notAvailableBody: '此目的地暂未开放，敬请期待！',
        historyFoundTitle: '找到通关包',
        historyFoundBody: {
          pre: '我们找到了您前往{{country}}的通关包：',
          flight: '航班',
          date: '日期',
          hotel: '酒店',
          question: '是否使用此通关包？',
          regenerate: '重新生成',
        },
      },
      history: {
        emptyTitle: '暂无历史记录',
        emptySubtitle: '您的通关包将显示在这里',
        cardTitle: '{{country}}通关包',
      },
    },
    history: {
      headerTitle: '历史记录',
      filterButton: '筛选 ⌄',
      timePrefix: '生成时间',
      passportPrefix: '护照',
      sections: {
        today: '今天',
        yesterday: '昨天',
        thisWeek: '本周',
        thisMonth: '本月',
        earlier: '更早',
      },
      items: {
        hk: {
          title: '香港通关包',
          time: '今天 下午2:30',
          passport: '中国护照 E12345678',
        },
        th: {
          title: '泰国通关包',
          time: '昨天 上午10:15',
          passport: '中国护照 E12345678',
        },
      },
      empty: {
        title: '暂无历史记录',
        subtitle: '您生成的通关包将显示在这里',
      },
    },
    travelInfo: {
      header: { title: '旅行信息', back: '返回' },
      infoCard: { title: '前往{{destination}}', subtitle: '填写您的旅行详情' },
      sections: { flight: '航班信息', accommodation: '住宿信息', trip: '行程详情', health: '健康申报', usCustoms: '美国海关申报', caCustoms: '加拿大海关申报' },
      fields: {
        flightNumber: { label: '航班号', placeholder: '例如: CA981' },
        arrivalDate: { label: '到达日期', placeholder: 'YYYY-MM-DD', help: '必须在72小时内' },
        hotelName: { label: '酒店名称', placeholder: '酒店名称或地址' },
        hotelAddress: { label: '酒店地址', placeholder: '完整地址' },
        contactPhone: { label: '联系电话', placeholder: '+1234567890' },
        stayDuration: { label: '停留天数', placeholder: '例如: 7' },
        purpose: '访问目的',
      },
      purposes: { tourism: '旅游', business: '商务', visiting: '探亲', study: '学习', work: '工作' },
      yesNoQuestion: { fever: '近期是否发烧？', usCash: '是否携带超过1万美元现金？', usFood: '是否携带食品、植物或动物？', caCurrency: '是否携带超过1万加元？', caDuty: '是否携带需纳税物品？', caFirearms: '是否携带枪支或武器？', caCommercial: '是否携带商业物品？', caFood: '是否携带食品、植物、动物或相关产品？' },
      arrivingFrom: { label: '来自', us: '美国', other: '其他国家' },
      hints: { caDuty: '包括酒精、烟草、超过免税额的礼品', caFood: '包括肉类、乳制品、水果、蔬菜、种子' },
      scanButtons: { ticket: '扫描机票', hotel: '扫描预订单' },
      generateButton: '生成通关包',
      tips: { title: '💡 提示', body: '• 准备好您的机票\n• 酒店预订确认\n• 诚实填写海关申报\n• 保留联系信息' },
      alerts: {
        permissionPhotoTitle: '需要照片权限',
        permissionPhotoBody: '我们需要相机/相册权限来扫描文档',
        permissionDeniedAction: '好的',
        ocrSuccessFlight: '航班信息已提取！',
        ocrSuccessHotel: '酒店信息已提取！',
        loginRequiredTitle: '需要登录',
        loginRequiredBody: 'OCR功能需要登录',
        loginButton: '登录',
        manualEntryButton: '手动输入',
        ocrFailTitle: '识别失败',
        ocrFailBody: '无法提取信息',
        genericErrorTitle: '错误',
        galleryError: '无法打开相册',
        dateTooFarTitle: '日期太远',
        dateTooFarBody: '到达日期必须在72小时内（距离{{days}}天）',
        datePastTitle: '无效日期',
        datePastBody: '到达日期不能是过去',
      },
      duplicateModal: {
        title: '通关包已存在',
        message: '我们找到了相同航班信息的通关包：',
        labels: { destination: '目的地:', flight: '航班:', arrival: '到达:', generated: '生成时间:' },
        arrivalSuffix: '{{date}}到达',
        hint: '您想使用现有通关包还是生成新的？',
        useExisting: '使用现有通关包',
        regenerate: '生成新通关包',
        cancel: '取消',
      },
    },
    singapore: {
      info: {
        headerTitle: '新加坡入境信息',
        title: '新加坡入境指南',
        subtitle: '中国护照持有者免签30天',
        sections: {
          visa: {
            title: '✓ 好消息！免签政策',
            items: [
              '从2024年2月9日起，中国护照免签30天 - 说走就走！',
              '• 无需提前申请签证',
              '• 适用于旅游、探亲、商务等私人事务',
              '• 新要求：入境前需提交SG Arrival Card（有提交时间限制）',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• SG Arrival Card有严格时间限制：提前提交会被拒绝，过晚提交来不及',
              '• 时间计算容易出错：需按新加坡时间计算，时差问题容易导致失误',
              '• 信息准确性要求高：护照、航班、住宿任何错误都可能影响入境',
              '• 家庭申报更复杂：多人信息容易遗漏或填错',
              '• 一次性使用：再次入境需重新提交，不能重复使用旧申报',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动追踪行程，在最佳时间提醒您',
              '• 零失误：智能填写，信息准确无误',
              '• 零操心：一次输入，自动管理整个流程',
              '• 家庭便利：支持家庭成员批量申报，省时省心',
            ],
          },
        },
        continueButton: '我已了解，继续确认材料',
      },
      requirements: {
        headerTitle: 'SG Arrival Card 准备清单',
        introTitle: '以下是入境所需准备事项',
        introSubtitle: '这些信息可以先填着，慢慢补全',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照建议至少还有6个月有效期',
            details: '新加坡建议护照有效期不少于6个月，若即将到期请提前换发新护照。',
          },
          submissionWindow: {
            title: '3天内申报窗口',
            description: '按照新加坡时间（GMT+8）在抵达前3天内提交',
            details: '窗口未打开前提交会被系统拒绝，请在倒计时进入后再完成申报，可设置提醒防止错过。',
          },
          travelDetails: {
            title: '行程与住宿信息',
            description: '航班/船班/巴士号、入境口岸、住宿/联系人、访问目的',
            details: '准备包含国际区号的联系电话。商务访客可填写新加坡公司或邀请人的联系方式。',
          },
          familyGroups: {
            title: '家庭/随行成员安排',
            description: '确定是单独提交还是使用家庭申报',
            details: '家庭申报最多支持10人，需要逐一输入成员信息。请准备好儿童及随行人员的护照资料。',
          },
          sgArrivalHistory: {
            title: '入境记录',
            description: 'SG Arrival Card 仅限一次入境使用',
            details: '再次入境需要重新提交最新行程。旧的申报无法重复使用。',
          },
        },
        status: {
          success: {
            title: '太好了！您可以继续',
            subtitle: '接下来我们将确认您的旅行信息。',
          },
          warning: {
            title: '请先确认所有事项',
            subtitle: '我们支持递进式的完成清单',
          },
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
        continueButton: '继续填写行程信息',
      },
      selection: {
        headerTitle: 'SG Arrival Card 智能助手',
        headerSubtitle: '选择最适合你的申报方式',
        recommendedBadge: '推荐',
        smartFlow: {
          title: '⚡ 智能引导模式',
          subtitle: '利用通关包快速填写',
          highlights: [
            { title: '预计耗时', value: '6-10分钟' },
            { title: '家庭支持', value: '最多10人' },
            { title: '成功率', value: '98%' },
          ],
          features: [
            '• 自动带出护照、航班与住宿信息',
            '• 提醒添加家庭成员并核对健康申报',
            '• 记录确认邮件/短信，入境时快速出示',
          ],
          cta: '开始智能引导 ->',
        },
        webFlow: {
          title: '🌐 SG Arrival Card 官网',
          subtitle: '在应用内直接打开官方表单',
          features: [
            '• 内嵌官方页面，功能完整',
            '• 无需切换应用即可复制通关包信息',
            '• 熟悉流程的旅客可以快速完成提交',
          ],
          cta: '打开内嵌SG Arrival Card',
        },
        notes: {
          title: '温馨提醒',
          items: [
            '每次入境都需重新申报，纯过境且不入境的旅客可免提交。',
            '家庭申报需逐一填写成员信息，确保数据准确。',
            '请保留确认邮件/短信，以备入境官员查验。',
          ],
        },
      },
      guide: {
        headerTitle: 'SG Arrival Card 引导模式',
        banner: {
          title: '利用通关包信息自动填表',
          subtitle: '逐步提醒，适合携家人共同申报',
        },
        stepSectionTitle: '操作步骤',
        steps: [
          {
            title: '核对旅客信息',
            subtitle: '确保护照资料与表单完全一致',
            details: [
              '确认姓名拼写、护照号、国籍、有效期无误。',
              '选择正确的旅客类型（例如外国访客、居民返回）。',
              '填写可用的邮箱与手机号，以便接收通知。',
            ],
          },
          {
            title: '填写抵达与住宿信息',
            subtitle: '根据行程如实填写',
            details: [
              '输入抵达日期时间以及航班/船/巴士号，需在3天窗口内。',
              '选择抵达口岸（如樟宜机场 T3、兀兰关卡等）。',
              '提供住宿地址或当地联系人的详细信息，包括邮编。',
            ],
          },
          {
            title: '健康与旅行申报',
            subtitle: '如实填写健康状况与旅行史',
            details: [
              '如实申报近期是否访问高风险地区。',
              '准确回答健康症状问题，并保留相关证明。',
              '提交后请确认已收到邮件或短信通知。',
            ],
          },
        ],
        quickActions: {
          title: '快捷工具',
          items: [
            {
              icon: '🕒',
              title: '72小时提醒',
              description: '根据抵达日期提醒您何时可以提交。',
            },
            {
              icon: '👪',
              title: '家庭助手',
              description: '快速复制信息，方便为家人提交。',
            },
            {
              icon: '📬',
              title: '确认追踪',
              description: '记录收到确认邮件/短信的账号，入境时不慌。',
            },
          ],
        },
        primaryCta: '打开SG Arrival Card助手',
        ctaHint: '将在应用内加载ICA官方网站。',
      },
      webview: {
        headerTitle: 'SG Arrival Card 网页助手',
        notice: '在此完成新加坡数字入境卡，所有数据仅保存在本机。',
        loading: '正在加载SG Arrival Card...',
        openExternal: '使用浏览器打开',
        openFailedTitle: '无法打开链接',
        openFailedBody: '请复制网址后在浏览器中打开。',
      },
    },
    japan: {
      info: {
        headerTitle: '日本入境信息',
        title: '日本入境指南',
        subtitle: '中国护照持有人需提前办理签证',
        sections: {
          visa: {
            title: '⚠️ 签证要求',
            items: [
              '中国护照持有人需提前申请日本签证，目前暂无短期免签政策。',
              '• 常见签证类型为短期停留（旅游/商务/探亲），最长可停留90天。',
              '• 需通过日本驻华使领馆或指定的签证申请中心提交材料。',
              '• 办理需准备护照、行程、财力证明等，建议至少预留1周时间。',
            ],
          },
          important: {
            title: '⚠️ 入境须知',
            items: [
              '• 表格必须用黑色或蓝色笔填写。',
              '• 字迹要清晰易读。',
              '• 对海关表格的所有问题要如实回答。',
              '• 保留入境卡存根至离境。',
              '• 需要进行生物识别扫描（指纹/面部）。',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动提醒表格填写和生物识别步骤。',
              '• 零失误：复制模式确保数据准确转移到纸质表格。',
              '• 零操心：详细的逐步指南涵盖整个流程。',
              '• 文件清单：移民/海关的完整准备清单。',
            ],
          },
        },
        continueButton: '明白了，继续准备',
      },
      requirements: {
        headerTitle: '日本入境检查清单',
        introTitle: '入境准备清单',
        introSubtitle: '填写您有的内容，逐步完善',
        items: {
          validVisa: {
            title: '有效签证',
            description: '已批准的日本旅游签证',
            details: '中国公民需提前申请签证。确认您的签证有效且有足够入境次数。',
          },
          validPassport: {
            title: '有效护照',
            description: '护照有效期至少6个月',
            details: '护照必须在计划离境日期后6个月以上有效',
          },
          returnTicket: {
            title: '返程机票',
            description: '已确认的返程或后续行程机票',
            details: '必须有明确的离境计划，显示您将在90天内离开日本',
          },
          sufficientFunds: {
            title: '充足资金',
            description: '整个停留期间的资金证明',
            details: '建议携带至少10万日元或等值，或出示信用卡/银行对账单',
          },
          accommodation: {
            title: '住宿证明',
            description: '日本的酒店预订或房东联系方式',
            details: '提供酒店预订确认或日本朋友/亲戚的详细联系信息',
          },
        },
        status: {
          success: {
            title: '太好了！您可以继续。',
            subtitle: '接下来我们将确认您的旅行信息。',
          },
          warning: {
            title: '检查每个清单项目',
            subtitle: '在继续之前完成先决条件。',
          },
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
      },
      procedures: {
        headerTitle: '日本入境流程',
        title: '日本入境指南',
        subtitle: '中国护照持有者免签90天',
        helpSection: {
          title: '📝 入境通帮您做什么',
          description: '我们帮您填好入境卡和海关申报表，您只需在机场抄写！',
          subdescription: '不用担心填错，只需抄写我们准备好的内容',
        },
        entrySteps: {
          title: '🚶‍♂️ 入境步骤',
          steps: [
            {
              title: '抵达机场',
              description: '抵达日本机场入境大厅',
              details: '准备好护照和已填写的入境卡及海关申报表',
            },
            {
              title: '入境检查',
              description: '前往入境检查柜台',
              details: '提交护照和入境卡，接受官员检查并采集指纹',
            },
            {
              title: '海关申报',
              description: '前往海关检查区域',
              details: '提交海关申报表，申报携带物品，可能需要行李检查',
            },
            {
              title: '入境完成',
              description: '获得入境印章',
              details: '护照上获得入境印章，正式进入日本',
            },
          ],
        },
        features: {
          title: '✨ 入境通能为您做什么',
          items: [
            {
              icon: '📝',
              title: '自动填写',
              description: '我们填好入境卡和申报表，您只需抄写',
            },
            {
              icon: '📋',
              title: '信息录入',
              description: '一次输入旅行信息，系统自动填写所有表格',
            },
            {
              icon: '📱',
              title: '无需网络',
              description: '离线查看表格，机场无信号也能使用',
            },
            {
              icon: '💾',
              title: '记住信息',
              description: '保存详细信息，下次访日直接使用',
            },
          ],
        },
        importantNotes: {
          title: '⚠️ 重要提醒',
          items: [
            '• 入境卡和申报表必须用黑色或蓝色笔填写',
            '• 字迹要清晰，信息要准确',
            '• 申报表上的是非题要如实回答',
            '• 检查时要礼貌配合',
            '• 入境卡存根要保留到离境',
          ],
        },
        startButton: '开始准备入境资料包',
      },
      travelInfo: {
        headerTitle: '日本入境信息',
        title: '填写日本入境信息',
        subtitle: '请提供以下信息以完成入境准备',
        privacyNote: '💾 所有信息仅保存在您的手机本地',
        loading: '加载中...',
        sections: {
          passport: '护照信息',
          personal: '个人信息',
          funds: '资金证明',
          travel: '旅行信息',
        },
        fields: {
          passportName: '护照姓名（英文）',
          passportNamePlaceholder: '请输入护照上的英文姓名',
          nationality: '国籍',
          nationalityPlaceholder: '请选择国籍',
          passportNumber: '护照号码',
          passportNumberPlaceholder: '请输入护照号码',
          passportNumberHelp: '6-12位字母和数字组合',
          dateOfBirth: '出生日期',
          dateOfBirthHelp: '请选择您的出生日期',
          expiryDate: '护照有效期',
          expiryDateHelp: '请选择护照到期日期',
          occupation: '职业',
          occupationPlaceholder: '请输入您的职业',
          cityOfResidence: '居住城市',
          cityOfResidencePlaceholder: '请输入您的居住城市',
          residentCountry: '居住国家',
          residentCountryPlaceholder: '请选择居住国家',
          phoneCode: '区号',
          phoneCodePlaceholder: '+86',
          phoneNumber: '电话号码',
          phoneNumberPlaceholder: '请输入电话号码',
          email: '电子邮箱',
          emailPlaceholder: '请输入电子邮箱',
          gender: '性别',
          genderMale: '男性',
          genderFemale: '女性',
          genderUndefined: '未指定',
          travelPurpose: '旅行目的',
          travelPurposeTourism: '观光旅游',
          travelPurposeBusiness: '商务',
          travelPurposeVisiting: '亲属探访',
          travelPurposeTransit: '过境转机',
          travelPurposeOther: '其他',
          customTravelPurpose: '请说明旅行目的',
          customTravelPurposePlaceholder: '请输入您的旅行目的',
          arrivalFlightNumber: '抵达航班号',
          arrivalFlightNumberPlaceholder: '例如：NH123',
          arrivalDate: '抵达日期',
          arrivalDateHelp: '请选择您的抵达日期',
          accommodationType: '住宿类型',
          accommodationTypeHotel: '酒店',
          accommodationTypeRyokan: '日式旅馆',
          accommodationTypeFriend: '朋友家',
          accommodationTypeAirbnb: '民宿',
          accommodationTypeOther: '其他',
          customAccommodationType: '请说明住宿类型',
          customAccommodationTypePlaceholder: '请输入住宿类型',
          accommodationName: '住宿名称',
          accommodationNamePlaceholder: '请输入酒店/住宿名称',
          accommodationAddress: '住宿地址',
          accommodationAddressPlaceholder: '请输入日本的完整地址',
          accommodationAddressHelp: '例如：东京都涩谷区涩谷1-2-3 150-0002',
          accommodationPhone: '住宿电话',
          accommodationPhonePlaceholder: '请输入住宿电话号码',
          lengthOfStay: '预计停留天数',
          lengthOfStayPlaceholder: '请输入停留天数',
        },
        placeholders: {
          fundsSection: '资金证明字段将在后续任务中实现',
          travelSection: '旅行信息字段将在后续任务中实现',
        },
        funds: {
          emptyMessage: '尚未添加资金证明。请至少添加一项资金证明。',
          addButton: '添加资金证明',
        },
        continueButton: '查看入境指南',
        errors: {
          loadingFailed: '加载数据出错',
          loadingFailedMessage: '无法加载现有数据。您仍可以输入新信息。',
          saveFailed: '保存数据失败，请重试。',
          completeAllFields: '请完成所有必填字段',
          invalidPassportNumber: '护照号码必须是6-12位字母和数字',
          invalidDateFormat: '日期格式无效',
          invalidDate: '日期无效',
          expiryDateFuture: '护照有效期必须是未来日期',
          dobPast: '出生日期必须是过去日期',
          invalidName: '姓名只能包含字母、空格、连字符、撇号和句点',
          nameTooShort: '姓名至少需要2个字符',
          selectNationality: '请选择国籍',
          invalidEmail: '电子邮箱格式无效',
          invalidPhone: '电话号码格式无效',
          occupationTooShort: '职业至少需要2个字符',
          invalidFlightNumber: '航班号格式无效（例如：NH123）',
          arrivalDateFuture: '抵达日期必须是未来日期',
          invalidAccommodationPhone: '住宿电话号码格式无效',
          invalidLengthOfStay: '停留天数必须是正整数',
          lengthOfStayTooLong: '停留天数不能超过180天',
        },
      },
      result: {
        digitalBadge: '抵达前3天提交',
        digitalTitle: '新加坡 SG Arrival Card',
        digitalHighlight: '利用通关包快速完成SG Arrival Card，请保留确认邮件或短信以备入境查验。',
        digitalButton: '启动SG Arrival助手',
      },
    },

    taiwan: {
      info: {
        headerTitle: '台湾入境信息',
        title: '台湾入境指南',
        subtitle: '中国大陆护照需提前办理入台证',
        sections: {
          visa: {
            title: '✓ 签证政策',
            items: [
              '中国大陆护照需提前申请入台证，不可免签。',
              '• 单次入境停留最多15天，多次入境每年累计最多120天',
              '• 适用于旅游、探亲、商务等目的',
              '• 新要求：入境需提交电子入境卡（需验证码验证）',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• 邮箱验证码环节容易卡顿：验证码有时效限制，邮件延迟可能导致填表中断',
              '• 信息准确性要求高：护照、航班、住宿信息任何错误都可能影响入境',
              '• 行程变动需重新提交：信息改变后必须更新，否则与实际不符可能被询问',
              '• 多个材料需准备齐全：入台证、电子入境卡、往返机票缺一不可',
              '• 超期停留后果严重：将影响今后入境申请和审批',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：行程确定后自动提醒填写，不用担心忘记',
              '• 零失误：智能填写电子入境卡，信息准确无误',
              '• 零操心：一次输入，自动管理整个流程',
              '• 验证码助手：快速获取和输入邮箱验证码，流畅完成提交',
            ],
          },
        },
        continueButton: '我已了解，继续确认材料',
      },
      requirements: {
        headerTitle: '台湾电子入境卡准备清单',
        introTitle: '请确认以下事项',
        introSubtitle: '邮箱验证码是进入表单的关键步骤',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照需在停留期间保持有效',
            details: '建议至少保留6个月有效期，避免入境时被拒。',
          },
          emailAccess: {
            title: '可用邮箱',
            description: '能够即时接收验证码邮件',
            details: '准备好能快速登录的邮箱，验证码有效时间较短，请及时输入。',
          },
          submissionWindow: {
            title: '提前提交',
            description: '行程确定后即可填写，如有变动需重新提交',
            details: '台湾允许提前填写，但信息变动时请及时更新以免影响入境。',
          },
          travelDetails: {
            title: '行程与住宿信息',
            description: '航班、住宿或接待人、联络电话',
            details: '包括航空公司、航班号、住宿地址/邮编、联系电话等。',
          },
          otpReady: {
            title: '验证码准备',
            description: '可即时查看邮件验证码',
            details: '验证码通常为6位数字，请在有效时间内输入完成验证。',
          },
        },
        status: {
          success: {
            title: '准备完成！',
            subtitle: '接下来会使用通关包信息协助填写电子入境卡。',
          },
          warning: {
            title: '请先确认所有事项',
            subtitle: '我们支持递进式的完成清单',
          },
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
        continueButton: '继续填写行程信息',
      },
      selection: {
        headerTitle: '台湾电子入境卡助手',
        headerSubtitle: '选择智能引导或直接打开官网',
        recommendedBadge: '推荐',
        smartFlow: {
          title: '⚡ 智能引导模式',
          subtitle: '结合通关包并提醒验证码步骤',
          highlights: [
            { title: '预计耗时', value: '7-12分钟' },
            { title: '验证码步骤', value: '邮箱OTP' },
            { title: '成功率', value: '97%' },
          ],
          features: [
            '• 自动带出护照、航班、住宿信息',
            '• 提醒及时查看邮箱并输入验证码',
            '• 帮助记录确认邮件，入境时可快速出示',
          ],
          cta: '开始智能引导 ->',
        },
        webFlow: {
          title: '🌐 官网快速入口',
          subtitle: '在应用内直接打开台湾移民署网站',
          features: [
            '• 完整内嵌验证码与提交流程',
            '• 支持复制通关包信息快速粘贴',
            '• 熟悉流程的旅客可迅速完成提交',
          ],
          cta: '打开内嵌台湾电子入境卡',
        },
        notes: {
          title: '温馨提醒',
          items: [
            '只有准备好验证码时再点击发送，避免超时。',
            '若行程变动，请重新提交最新资料。',
            '保存成功页面或邮件截图，以备海关查验。',
          ],
        },
      },
      guide: {
        headerTitle: '台湾电子入境卡引导模式',
        banner: {
          title: '协助完成邮箱验证与填表',
          subtitle: '逐步提醒，确保不遗漏任何字段',
        },
        stepSectionTitle: '操作步骤',
        steps: [
          {
            title: '发送并获取验证码',
            subtitle: '保持邮箱开启，及时查看',
            details: [
              '在官网输入邮箱后点击发送验证码。',
              '在邮箱（含垃圾邮件夹）查收6位数验证码。',
              '在有效时间内输入验证码解锁表单。',
            ],
          },
          {
            title: '填写旅客与抵达信息',
            subtitle: '使用通关包中的资料快速填写',
            details: [
              '核对护照号码、国籍、生日等字段。',
              '填写航班号、抵达时间、入境口岸。',
              '输入住宿地址或接待人联系方式，包含邮递区号。',
            ],
          },
          {
            title: '旅行史与确认提交',
            subtitle: '如实填写14日内旅行史',
            details: [
              '选择过去14天曾到访的国家地区。',
              '确认健康与其他声明问题。',
              '提交后保留确认页面或邮件，入境时备用。',
            ],
          },
        ],
        quickActions: {
          title: '快捷工具',
          items: [
            {
              icon: '✉️',
              title: '验证码提醒',
              description: '记录验证码是否收到，避免遗漏。',
            },
            {
              icon: '📎',
              title: '一键复制资料',
              description: '随时复制护照/航班等信息粘贴到表单。',
            },
            {
              icon: '🔁',
              title: '再次提交助手',
              description: '行程变更时快速重新生成新的入境卡。',
            },
          ],
        },
        primaryCta: '打开台湾入境助手',
        ctaHint: '将在应用内加载台湾移民署网站。',
      },
      webview: {
        headerTitle: '台湾电子入境卡网页助手',
        notice: '在此发送验证码并填写电子入境卡，数据仅存于本机。',
        loading: '正在加载台湾电子入境卡...',
        openExternal: '使用浏览器打开',
        openFailedTitle: '无法打开链接',
        openFailedBody: '请复制网址后在浏览器中打开。',
      },
      result: {
        digitalBadge: '抵达前完成',
        digitalTitle: '台湾电子入境卡',
        digitalHighlight: '我们协助完成邮箱验证码与填表步骤，请保留确认邮件以备查验。',
        digitalButton: '启动台湾助手',
      },
    },
    hongkong: {
      info: {
        headerTitle: '香港入境信息',
        title: '香港入境指南',
        subtitle: '中国护照持有人免签停留7天',
        sections: {
          visa: {
            title: '✓ 好消息！免签政策',
            items: [
              '中国护照免签入境香港7天 - 说走就走！',
              '• 无需提前申请签证或注册',
              '• 适用于旅游、商务、探亲等目的',
              '• 停留不超过7天',
              '• 证件说明：护照或港澳通行证均可使用',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• 返程机票必须出示：没有离境证明将无法通过边检',
              '• 住宿证明需真实有效：酒店预订可能被核实，虚假信息后果严重',
              '• 资金证明可能被抽查：准备不足可能被拒入境或遣返',
              '• 健康申报要求复杂：填写错误或遗漏可能导致入境延误',
              '• 多项材料需准备齐全：护照、机票、住宿、资金证明缺一不可',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动提醒准备所需材料，不用担心遗漏',
              '• 零失误：智能整理返程机票和住宿证明，信息准确无误',
              '• 零操心：一次输入，自动生成完整材料清单',
              '• 健康申报助手：简化健康申报流程，快速完成提交',
            ],
          },
        },
        continueButton: '我已了解，继续确认材料',
      },
      requirements: {
        headerTitle: '香港入境准备清单',
        introTitle: '以下是入境所需准备事项',
        introSubtitle: '这些信息可以先填着，慢慢补全',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照有效期至少超过停留期1个月',
            details: '香港要求护照在预定停留期后仍有效。请检查护照有效期，必要时提前更换。',
          },
          returnTicket: {
            title: '返程或续程机票',
            description: '已确认的离港机票预订',
            details: '入境处可能要求查看返程或续程机票证明。请准备好电子机票或预订确认单。',
          },
          accommodation: {
            title: '住宿证明',
            description: '酒店预订或联系人信息',
            details: '携带酒店预订确认单，或香港联系人的详细信息，包括地址和电话号码。',
          },
          sufficientFunds: {
            title: '充足资金',
            description: '现金、信用卡或银行流水',
            details: '可能需要证明有足够资金支付停留期间的费用。准备现金、信用卡或近期银行对账单。',
          },
          healthDeclaration: {
            title: '健康申报',
            description: '根据现行健康规定填写（如有要求）',
            details: '检查是否需要健康申报或新冠相关文件。在抵达前完成所有必需的表格。',
          },
        },
        status: {
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
      },
    },
    malaysia: {
      info: {
        headerTitle: '马来西亚入境信息',
        title: '马来西亚入境指南',
        subtitle: '中国护照持有者免签30天',
        sections: {
          visa: {
            title: '✓ 好消息！免签政策',
            items: [
              '从2023年12月1日起，中国护照免签30天 - 说走就走！',
              '• 无需提前申请签证',
              '• 适用于旅游、探亲、商务等目的',
              '• 新要求：入境需提交MDAC数字入境卡（有提交时间限制）',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• MDAC有严格时间限制：提前提交会被拒绝，过晚提交来不及',
              '• 时间计算容易出错：需按马来西亚时间计算，时差问题容易导致失误',
              '• PIN码容易丢失：入境时必须出示PIN码，邮件找不到或截图丢失会很麻烦',
              '• 验证码识别困难：字母数字验证码不清晰，输错几次可能被锁定',
              '• 信息准确性要求高：护照、航班、住宿任何错误都可能影响入境',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动追踪行程，在最佳时间提醒您',
              '• 零失误：智能填写MDAC，信息准确无误',
              '• 零操心：一次输入，自动管理整个流程',
              '• PIN码管理：自动保存PIN码和确认邮件，入境时快速出示',
            ],
          },
        },
        continueButton: '我已了解，继续确认材料',
      },
      requirements: {
        headerTitle: 'MDAC准备清单',
        introTitle: '请确认以下事项已经准备好',
        introSubtitle: '这些条件是成功提交马来西亚MDAC的前提',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照至少还有6个月有效期并保留空白签证页',
            details: '马来西亚移民局要求护照在入境日起至少剩余6个月有效期，如不足请先更新护照再出行。',
          },
          submissionWindow: {
            title: '3天内申报窗口',
            description: 'MDAC仅接受抵达前3个自然日内的提交',
            details: '以马来西亚时间（GMT+8）计算，自然日0点刷新窗口，过早提交会被系统拒绝，请在窗口开启后再申报。',
          },
          contactableEmail: {
            title: '可用邮箱',
            description: '能够及时接收确认邮件与PIN码',
            details: '使用可在海外登录的邮箱，留意来自imigresen.gov.my的邮件，如未收到请查看垃圾箱并记录PIN码。',
          },
          travelDetails: {
            title: '完整的行程信息',
            description: '准备好航班号、入境口岸、住宿地址与联系电话',
            details: '表单需要填写航空公司、航班号、抵达机场、在马地址、联系电话（含区号）与访问目的，请提前整理好。',
          },
          captchaReady: {
            title: '验证码准备',
            description: '可以手动输入提交前的字母数字验证码',
            details: 'MDAC使用字母数字验证码，如看不清可刷新，提交需在几分钟内完成，避免因超时重新填写。',
          },
        },
        status: {
          success: {
            title: '已完成准备！',
            subtitle: '接下来填写行程信息即可提交MDAC。',
          },
          warning: {
            title: '请先确认所有事项',
            subtitle: '我们支持递进式的完成清单',
          },
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
        continueButton: '继续填写行程信息',
      },
      selection: {
        headerTitle: 'MDAC智能助手',
        headerSubtitle: '选择合适的申报方式',
        recommendedBadge: '推荐',
        smartFlow: {
          title: '⚡ 智能引导',
          subtitle: '结合通关包一步步完成',
          highlights: [
            { title: '预计耗时', value: '8-12分钟' },
            { title: '分步流程', value: '6个步骤' },
            { title: '成功率', value: '98%' },
          ],
          features: [
            '• 自动带出护照与行程信息，减少重复输入',
            '• 提醒输入验证码并记录PIN码',
            '• 引导检查确认邮件是否收到',
          ],
          cta: '开始智能引导 ->',
        },
        webFlow: {
          title: '🌐 MDAC网页',
          subtitle: '在应用内直接打开官网',
          features: [
            '• 原生MDAC网页嵌入，无需切换应用',
            '• 可直接复制粘贴通关包中的信息',
            '• 手动控制每一步，由您亲自提交',
          ],
          cta: '打开内嵌MDAC网页',
        },
        notes: {
          title: '温馨提醒',
          items: [
            '请在抵达前3天内（马来西亚时间）完成申报。',
            '入境时请准备好确认邮件或MDAC PIN码。',
            '多人出行需为每位旅客分别提交MDAC。',
          ],
        },
      },
      guide: {
        headerTitle: 'MDAC引导模式',
        banner: {
          title: '利用通关包自动填写MDAC',
          subtitle: '逐项提醒，不漏填关键信息',
        },
        stepSectionTitle: '操作步骤',
        steps: [
          {
            title: '核对旅客信息',
            subtitle: '填写前先确认护照资料无误',
            details: [
              '确认英文姓名、护照号、国籍、有效期与护照一致。',
              '证件类型选择Passport，国籍选择China / 中国。',
              '填写可接听的联系电话，包含国家区号（例如+86 13800138000）。',
            ],
          },
          {
            title: '填写行程详情',
            subtitle: '使用通关包里的行程数据',
            details: [
              '输入抵达机场与航班号（例如KUL / MH389）。',
              '选择抵达日期并确保在3天窗口内，留意日历选择。',
              '提供酒店名称与地址，或当地接待人的联系方式。',
            ],
          },
          {
            title: '提交并保存PIN码',
            subtitle: '验证码与确认邮件非常重要',
            details: [
              '正确输入字母数字验证码，若看不清可先刷新。',
              '提交成功后记录页面显示的MDAC PIN码。',
              '检查邮箱（含垃圾箱）确认收到邮件，入境时随身携带。',
            ],
          },
        ],
        quickActions: {
          title: '快捷工具',
          items: [
            {
              icon: '📧',
              title: '记录PIN邮件',
              description: '标记所使用的邮箱并确认邮件是否到达。',
            },
            {
              icon: '📍',
              title: '复制住宿信息',
              description: '点击即可复制酒店地址和电话，便于填写。',
            },
            {
              icon: '🔁',
              title: '便捷重新提交',
              description: '行程变动时可复用已保存信息快速再申报。',
            },
          ],
        },
        primaryCta: '打开MDAC网页助手',
        ctaHint: '将在应用内加载MDAC官方网站。',
      },
      webview: {
        headerTitle: 'MDAC网页助手',
        notice: '在此完成马来西亚数字入境卡（MDAC）官方表单，所有数据仅保留在本机。',
        loading: '正在加载MDAC官网...',
        openExternal: '使用浏览器打开',
        openFailedTitle: '无法打开链接',
        openFailedBody: '请复制网址后在浏览器中打开。',
      },
      result: {
        digitalBadge: '抵达前3天提交',
        digitalTitle: '马来西亚数字入境卡（MDAC）',
        digitalHighlight: '我们会根据已保存的护照与行程信息协助提交MDAC，请保管好PIN码邮件。',
        digitalButton: '启动MDAC助手',
      },
    },
    thailand: {
      entryGuide: {
        title: '泰国入境指南（廊曼机场DMK）',
        subtitle: '从TDAC到酒店的完整8步骤流程',
        steps: {
          tdac: {
            title: 'TDAC数字入境卡',
            titleZh: 'TDAC数字入境卡',
            description: '抵达前72小时内提交',
            descriptionZh: '抵达前72小时内提交',
            tips: [
              '准备护照、航班信息、泰国地址',
              '填写英文护照信息',
              '保存QR码到手机相册'
            ],
            tipsZh: [
              '准备护照、航班信息、泰国地址',
              '填写英文护照信息',
              '保存QR码到手机相册'
            ]
          },
          atm: {
            title: 'ATM取泰铢现金',
            titleZh: 'ATM取泰铢现金',
            description: '在机场ATM机取3,000-5,000泰铢',
            descriptionZh: '在机场ATM机取3,000-5,000泰铢',
            banks: [
              'Bangkok Bank（曼谷银行）',
              'Krungsri（泰国大城银行）',
              'Kasikorn Bank（开泰银行）'
            ],
            steps: [
              '找到ATM机（到达大厅1楼）',
              '选择英语界面',
              '输入密码，选择储蓄账户',
              '取款3,000-5,000泰铢',
              '手续费：约220泰铢/次'
            ],
            stepsZh: [
              '找到ATM机（到达大厅1楼）',
              '选择英语界面',
              '输入密码，选择储蓄账户',
              '取款3,000-5,000泰铢',
              '手续费：约220泰铢/次'
            ],
            safety: [
              '注意周边环境安全',
              '保护密码输入安全',
              '不要接受陌生人"帮助"',
              '如ATM吞卡，记下ATM编号联系银行'
            ],
            safetyZh: [
              '注意周边环境安全',
              '保护密码输入安全',
              '不要接受陌生人"帮助"',
              '如ATM吞卡，记下ATM编号联系银行'
            ]
          },
          taxi: {
            title: '官方出租车到酒店',
            titleZh: '官方出租车到酒店',
            description: '使用入境通司机页面显示酒店地址',
            descriptionZh: '使用入境通司机页面显示酒店地址',
            steps: [
              '找官方Public Taxi柜台（6号门或8号门附近）',
              '向工作人员出示入境通"给司机看的页面"',
              '拿到排队号码单',
              '确认司机打表（Meter在跳字）',
              '费用：320-470泰铢（打表+50机场费+高速费）'
            ],
            stepsZh: [
              '找官方Public Taxi柜台（6号门或8号门附近）',
              '向工作人员出示入境通"给司机看的页面"',
              '拿到排队号码单',
              '确认司机打表（Meter在跳字）',
              '费用：320-470泰铢（打表+50机场费+高速费）'
            ],
            payment: [
              '准备小额钞票（100、50、20泰铢）',
              '现金支付（推荐）',
              '需要时索要收据'
            ],
            paymentZh: [
              '准备小额钞票（100、50、20泰铢）',
              '现金支付（推荐）',
              '需要时索要收据'
            ]
          }
        },
        importantNotes: [
          '抵达前72小时内必须提交TDAC',
          'ATM取款手续费约220泰铢，一次多取节省费用',
          '只使用官方Public Taxi，避免黑车',
          '入境通司机页面显示泰文+英文酒店地址'
        ],
        importantNotesZh: [
          '抵达前72小时内必须提交TDAC',
          'ATM取款手续费约220泰铢，一次多取节省费用',
          '只使用官方Public Taxi，避免黑车',
          '入境通司机页面显示泰文+英文酒店地址'
        ],
        entryPackHintOfficial: '护照、TDAC二维码与资金凭证一键展示给移民官。',
        entryPackHintPreview: '查看通关包格式（提交TDAC后可获得完整版）'
      },
      info: {
        headerTitle: '泰国入境信息',
        title: '泰国入境指南',
        subtitle: '中国护照持有者免签60天',
        sections: {
          visa: {
            title: '✓ 好消息！免签政策延长',
            items: [
              '自2024年3月1日起中泰互免签证，7月15日起延长至60天 - 说走就走！',
              '• 无需提前申请签证',
              '• 单次停留最长60天，可在泰国境内申请一次30天延期',
              '• 适用于旅游、探亲、短期商务等非工作目的',
            ],
          },
          onsite: {
            title: '⚠️ 入境须知',
            items: [
              '• 资金证明要求严格：移民官可能抽查现金或银行卡余额，准备不足可能被拒入境',
              '• 返程机票必须出示：没有离境证明将无法通过边检',
              '• 住宿信息需真实有效：酒店预订可能被电话核实，虚假信息后果严重',
              '• 指纹采集和问询：语言障碍可能导致沟通困难，影响入境判断',
              '• 多项材料需准备齐全：护照、机票、住宿、资金证明缺一不可',
            ],
          },
          appFeatures: {
            title: '✨ 入境通帮您轻松搞定',
            items: [
              '• 零焦虑：自动提醒准备所需材料，不用担心遗漏',
              '• 零失误：智能整理资金和住宿证明，信息准确无误',
              '• 零操心：一次输入，自动生成完整材料清单',
              '• 沟通助手：提供常见问题中英文参考，应对边检问询',
            ],
          },
        },
        continueButton: '我了解，继续确认要求',
      },
      requirements: {
        headerTitle: '泰国入境准备清单',
        introTitle: '以下是入境所需准备事项',
        introSubtitle: '这些信息可以先填着，慢慢补全',
        items: {
          validPassport: {
            title: '护照有效期',
            description: '护照有效期至少6个月',
            details: '泰国要求护照在入境时至少还有6个月有效期。请检查护照并必要时提前更换。',
          },
          onwardTicket: {
            title: '返程或续程机票',
            description: '已确认的离泰机票或续程证明',
            details: '移民官可能要求查看返程或前往第三国的机票。请准备好电子机票或预订确认单。',
          },
          accommodation: {
            title: '住宿证明',
            description: '酒店预订或泰国的详细地址',
            details: '携带酒店预订确认单，或朋友/亲戚在泰国的详细联系信息，包括地址和电话。',
          },
          funds: {
            title: '充足资金',
            description: '现金、信用卡或银行流水（至少1万泰铢/人或2万泰铢/家庭）',
            details: '移民官可能随机检查资金证明。建议准备现金、信用卡或近期银行对账单。',
          },
          healthCheck: {
            title: '健康申报',
            description: '根据现行健康规定填写（如有要求）',
            details: '检查是否需要健康申报或新冠相关文件。在抵达前完成所有必需的表格。',
          },
        },
        status: {
          info: {
            title: '随时开始填写',
            subtitle: '我们支持递进式的完成清单',
          },
        },
        startButton: '开始填写',
      },
      travelInfo: {
        headerTitle: '泰国入境信息',
        title: '填写泰国入境信息',
        subtitle: '请提供以下信息以完成入境卡生成',
        privacyNotice: '所有信息仅保存在您的手机本地',
        loading: '正在加载数据...',
        submitEntry: '准备入境包',
        viewStatus: '查看准备状态',
        readyToSubmit: '准备提交',
        completionProgress: '已完成 {{percent}}%',
        completionHint: '完成所有信息后可提交入境卡。',
        sections: {
          passport: '护照信息',
          personal: '个人信息',
          funds: '资金证明',
          travel: '行程信息',
          accommodation: '住宿信息',
          emergency: '紧急联系人',
        },
        scan: {
          ticketTitle: '扫描机票',
          ticketMessage: '请选择机票图片来源',
          hotelTitle: '扫描酒店预订',
          hotelMessage: '请选择酒店预订确认单图片来源',
          takePhoto: '拍照',
          fromLibrary: '从相册选择',
          permissionTitle: '需要权限',
          cameraPermissionMessage: '需要相机权限来拍照扫描文档',
          libraryPermissionMessage: '需要相册权限来选择图片',
          successTitle: '扫描成功',
          ticketSuccess: '机票信息已提取并填入表单',
          hotelSuccess: '酒店信息已提取并填入表单',
          ocrFailTitle: '识别失败',
          ocrFailMessage: '无法从图片中提取信息，请检查图片清晰度或手动输入',
          retryButton: '重试',
          manualButton: '手动输入',
          errorTitle: '扫描失败',
          errorMessage: '扫描过程中出现错误，请重试',
          flightChoiceTitle: '选择航班',
          flightChoiceMessage: '检测到航班号 {flightNumber}，请选择要更新的航班信息',
          arrivalFlight: '入境航班',
          departureFlight: '离境航班',
        },
        photo: {
          choose: '选择照片',
          takePhoto: '拍照',
          fromLibrary: '从相册选择',
          cancel: '取消',
          cameraPermission: '需要相机权限',
          cameraPermissionMessage: '请在设置中允许访问相机',
          libraryPermission: '需要相册权限',
          libraryPermissionMessage: '请在设置中允许访问相册',
          cameraError: '相机错误',
          cameraErrorMessage: '模拟器不支持相机功能，请使用真机测试或选择相册照片',
          chooseFailed: '选择照片失败',
          chooseFailedMessage: '请重试',
        },
        lastEdited: '最近编辑',
        sectionTitles: {
          passport: '👤 护照信息',
          passportSubtitle: '泰国海关需要核实你的身份',
          personal: '👤 个人信息',
          personalSubtitle: '让泰国更了解你',
          funds: '💰 资金证明',
          fundsSubtitle: '展示你的经济能力',
          travel: '✈️ 旅行信息',
          travelSubtitle: '你的泰国行程',
        },
        sectionIntros: {
          passport: '🛂 海关官员会核对你的护照信息，请确保与护照完全一致。别担心，我们会帮你格式化！',
          personal: '👤 这些信息帮助泰国了解你的背景，如有需要可以联系你。',
          funds: '💰 展示你的经济能力，证明可以支持泰国之旅。',
          travel: '✈️ 告诉泰国你的旅行计划，让他们为你准备好热情的欢迎。',
        },
        fields: {
          fullName: {
            label: '姓名',
            help: '请填写汉语拼音（例如：LI, MAO）- 不要输入中文字符',
          },
          passportName: {
            label: '护照上的姓名',
            help: '填写护照上显示的英文姓名，例如：LI, MAO（姓在前，名在后）',
          },
          surname: {
            label: '姓',
            help: '填写护照上显示的姓（英文）',
          },
          middleName: {
            label: '中间名',
            help: '如有（可选）',
          },
          givenName: {
            label: '名',
            help: '填写护照上显示的名（英文）',
          },
          nationality: {
            label: '国籍',
            help: '请选择您的国籍',
          },
          passportNo: {
            label: '护照号码',
            help: '护照号码通常是8-9位字母和数字的组合，输入时会自动转大写',
          },
          visaNumber: {
            label: '签证号（如有）',
            help: '如有签证，请填写签证号码（仅限字母或数字）',
          },
          dob: {
            label: '出生日期',
            help: '格式: YYYY-MM-DD',
          },
          expiryDate: {
            label: '护照有效期',
            help: '格式: YYYY-MM-DD',
          },
          sex: {
            label: '性别',
            options: {
              female: '女性',
              male: '男性',
              undefined: '未定义',
            },
          },
          occupation: {
            label: '职业',
            help: '请输入您的职业 (请使用英文)',
          },
          cityOfResidence: {
            label: '居住城市',
            help: '请输入您居住的城市 (请使用英文)',
          },
          residentCountry: {
            label: '居住国家',
            help: '请选择您居住的国家',
          },
          phoneCode: {
            label: '国家代码',
          },
          phoneNumber: {
            label: '电话号码',
            help: '请输入您的电话号码',
          },
          email: {
            label: '电子邮箱',
            help: '请输入您的电子邮箱地址',
          },
          arrivalDate: {
            label: '抵达日期',
            help: '格式: YYYY-MM-DD',
          },
          flightNumber: {
            label: '航班号',
            help: '请输入您的航班号',
          },
          departureCity: {
            label: '出发城市',
            help: '请输入您的出发城市 (请使用英文)',
          },
          purposeOfVisit: {
            label: '访问目的',
            help: '请选择您的访问目的',
            options: {
              tourism: '旅游',
              business: '商务',
              family: '探亲',
              medical: '医疗',
              other: '其他',
            },
          },
          hotelName: {
            label: '酒店名称',
            help: '请输入您的酒店名称 (请使用英文)',
          },
          hotelAddress: {
            label: '酒店地址',
            help: '请输入您的酒店地址 (请使用英文)',
          },
          hotelPhone: {
            label: '酒店电话',
            help: '请输入您的酒店电话号码',
          },
          emergencyName: {
            label: '紧急联系人姓名',
            help: '请输入紧急联系人姓名 (请使用英文)',
          },
          emergencyPhone: {
            label: '紧急联系人电话',
            help: '请输入紧急联系人电话号码',
          },
          emergencyRelationship: {
            label: '关系',
            help: '请输入关系 (请使用英文)',
          },
        },
        photo: {
          choose: '选择照片',
          takePhoto: '拍照',
          fromLibrary: '从相册选择',
          cancel: '取消',
          cameraPermission: '需要相机权限',
          cameraPermissionMessage: '请在设置中允许访问相机',
          cameraError: '相机错误',
          cameraErrorMessage: '模拟器不支持相机功能，请使用真机测试或选择相册照片',
          libraryPermission: '需要相册权限',
          libraryPermissionMessage: '请在设置中允许访问相册',
          chooseFailed: '选择照片失败',
          chooseFailedMessage: '请重试',
        },
        continueButton: '继续',
      },
      tdacWebView: {
        errorBoundary: {
          title: '出错了',
          message: '发生了意外错误，请重试。',
          tryAgain: '重试',
          close: '关闭',
        },
        qrCodeHandler: {
          permissionTitle: '需要相册权限',
          permissionMessage: '请在设置中允许访问相册',
          savingQR: '开始保存QR码...',
          savedToApp: 'QR码已保存到App',
          savedToAlbum: 'QR码已保存到相册',
          tempFileCleanedSuccess: '临时文件已清理',
          tempFileCleanedError: '临时文件已清理（错误路径）',
          tempFileCleanupFailed: '错误路径文件清理失败',
          saveAlbumFailed: '保存到相册失败',
          entryInfoUpdated: 'Entry info updated successfully via WebView',
          entryInfoUpdateFailed: '无法更新入境信息',
          recentSubmissionFlagSet: 'Recent submission flag set for EntryPackService',
          qrSavedSuccess: {
            title: '🎉 QR码已保存！',
            message: 'QR码已保存到:\n1. App内（可在"我的旅程"查看）\n2. 手机相册\n\n入境时向海关出示即可！',
            viewQR: '查看QR码',
            ok: '好的',
          },
          saveFailed: {
            title: '保存失败',
            message: '无法保存QR码，请截图保存',
          },
        },
        helperModal: {
          title: '复制助手',
          close: '✕ 关闭',
          instruction: '点击⚡尝试自动填充网页，失败则点"复制"手动粘贴',
          sections: {
            personal: 'Personal Information',
            trip: 'Trip & Accommodation',
            accommodation: 'Accommodation',
          },
          healthDeclaration: {
            title: 'Step 4: Health Declaration',
            note: '健康声明部分请根据实际情况在网页中选择 Yes 或 No',
          },
          tips: {
            title: '💡 完成后记得：',
            items: '• 提交后会收到确认邮件\n• 邮件中包含QR码\n• 截图保存QR码\n• 入境时出示QR码和护照',
          },
        },
        qrCodeModal: {
          title: '🎫 TDAC 入境卡',
          close: '✕',
          hint: '向海关出示此QR码即可快速入境',
          subHint: 'Show this QR code to immigration',
          nameLabel: '姓名 Name:',
          passportLabel: '护照号 Passport:',
          savedTimeLabel: '保存时间 Saved:',
          saveAgain: '📷 再次保存到相册',
        },
        dataComparisonModal: {
          title: '🔍 Data Comparison',
          subtitle: 'Entry Info vs TDAC Submission',
          close: '✕ Close',
          summary: {
            title: '📊 Summary',
            totalFields: 'Total Fields:',
            validMappings: 'Valid Mappings:',
            overallStatus: 'Overall Status:',
            valid: '✅ VALID',
            issues: '❌ ISSUES',
          },
          fieldMappings: {
            title: '🔄 Field Mappings',
            source: 'Source:',
            original: 'Original:',
            tdac: 'TDAC:',
            transform: 'Transform:',
            statusMapped: '✅',
            statusTransformed: '🔄',
            statusError: '❌',
          },
          payload: {
            title: '📋 Complete TDAC Payload',
          },
          actions: {
            refresh: '🔄 Refresh Comparison',
            export: '📋 Export Data',
            exported: '✅ Exported',
            exportedMessage: 'Comparison data copied to clipboard',
          },
        },
      },

      // TDACSelectionScreen 中文翻译
      selection: {
        heroEmoji: '🌟',
        heroTitle: '选择提交方式',
        heroSubtitle: '快速完成泰国入境卡',
        backButton: '返回',
        lightning: {
          badge: '推荐选择',
          badgeIcon: '📱',
          icon: '⚡',
          title: '闪电提交',
          subtitle: '快速通道 · 智能验证',
          benefits: {
            time: { icon: '⏱️', value: '5-8秒', label: '闪电完成' },
            success: { icon: '🎯', value: '95%+', label: '超高成功率' },
            speed: { icon: '🚀', value: '快3倍', label: '比传统方式' }
          },
          summary: '节省排队时间，提交后即可获得确认。',
          cta: '使用闪电提交'
        },
        stable: {
          icon: '🛡️',
          title: '稳妥提交',
          subtitle: '稳定通道 · 清晰可见',
          benefits: {
            time: { icon: '⏱️', value: '24秒', label: '稳定完成' },
            success: { icon: '🎯', value: '85%', label: '可靠成功率' }
          },
          summary: '适合想亲自查看每一步的旅客。',
          cta: '选择稳妥方案'
        },
        smartTip: {
          icon: '💡',
          title: '智能推荐',
          text: '推荐闪电提交；如需完整流程，可随时切换稳妥方案。'
        },
        footer: {
          text: '我们会陪您完成整个流程，确保顺利提交。'
        }
      },

      // ThailandEntryQuestionsScreen 中文翻译
      entryQuestions: {
        topBarTitle: '入境问题',
        header: {
          title: 'ชุดคำถาม-คำตอบสำหรับเจ้าหน้าที่',
          subtitle: 'Immigration Questions & Answers',
          subtitleZh: '入境常见问题及答案',
          description: '📋 基于您的旅行信息预填的常见入境问题答案，可向移民官员展示'
        },
        languageSelector: { label: '语言 / Language:', zh: '中文', en: 'English', th: 'ไทย' },
        filter: { showRequired: '仅显示必填问题', showAll: '显示全部问题', count: '({{count}} 个问题)' },
        question: { required: '必填', answerLabel: '答案 / Answer:', tipsLabel: '💡 提示:', suggestedLabel: '其他可选答案:' },
        footer: {
          icon: 'ℹ️',
          infoText: '这些答案基于您提交的入境信息自动生成。如移民官提出其他问题，请如实回答。',
          instructionsTitle: '使用说明：',
          instruction1: '1. 向移民官展示此页面作为参考',
          instruction2: '2. 可切换语言以便沟通',
          instruction3: '3. 必填问题已用徽章标记'
        },
        empty: { icon: '📭', text: '暂无可显示的问题', hint: '请确保您的入境信息已完整填写' },
        loading: '加载入境问题...',
        errors: { missingEntryPack: '缺少入境包信息', loadFailed: '加载入境问题失败，请稍后重试' }
      },

      // TravelInfoScreen 补充翻译
      travelInfoEnhanced: {
        sectionIntros: {
          passport: { icon: '🛂', text: '海关官员会核对你的护照信息，请确保与护照完全一致。别担心，我们会帮你格式化！' },
          personal: { icon: '👤', text: '这些信息帮助泰国了解你的背景，如有需要可以联系你。' },
          funds: { icon: '💰', text: '展示你的经济能力，证明可以支持泰国之旅。' },
          travel: { icon: '✈️', text: '告诉泰国你的旅行计划，让他们为你准备好热情的欢迎。' }
        },
        saveStatus: { pending: '等待保存...', saving: '正在保存...', saved: '已保存', error: '保存失败', retry: '重试' },
        lastEdited: '最近编辑：{{time}}',
        progress: {
          ready: '泰国准备就绪！🌴',
          completion: '完成度 {{percent}}%',
          hints: {
            start: '🌟 第一步，从介绍自己开始吧！',
            early: '好的开始！泰国欢迎你 🌺',
            mid: '继续我的泰国准备之旅 🏖️',
            late: '🚀 快要完成了，你的泰国之旅近在咫尺！'
          },
          nextSteps: {
            passport: '💡 从护照信息开始，告诉泰国你是谁',
            personal: '👤 填写个人信息，让泰国更了解你',
            funds: '💰 展示你的资金证明，泰国想确保你玩得开心',
            travel: '✈️ 最后一步，分享你的旅行计划吧！'
          }
        }
      },

      // 常量翻译
      occupations: {
        SOFTWARE_ENGINEER: '软件工程师', STUDENT: '学生', TEACHER: '教师', DOCTOR: '医生',
        ACCOUNTANT: '会计师', SALES_MANAGER: '销售经理', RETIRED: '退休人员', ENGINEER: '工程师',
        CIVIL_SERVANT: '公务员', LAWYER: '律师', NURSE: '护士', FREELANCER: '自由职业者',
        BUSINESS_OWNER: '企业主', HOMEMAKER: '家庭主妇', DESIGNER: '设计师', OTHER: '其他'
      },
      travelPurposes: {
        HOLIDAY: '度假/旅游', MEETING: '会议', SPORTS: '体育', BUSINESS: '商务',
        INCENTIVE: '奖励旅游', CONVENTION: '会展/大会', EDUCATION: '教育',
        EMPLOYMENT: '就业', EXHIBITION: '展览', MEDICAL: '医疗'
      },
      accommodationTypes: {
        HOTEL: '酒店', HOSTEL: '青年旅舍', GUESTHOUSE: '民宿',
        RESORT: '度假村', APARTMENT: '公寓', FRIEND: '朋友家'
      },

      // 表单验证错误信息
      validation: {
        // 必填字段错误
        required: {
          passportNo: '护照号码为必填项',
          surname: '姓氏为必填项',
          givenName: '名字为必填项',
          nationality: '国籍为必填项',
          dob: '出生日期为必填项',
          expiryDate: '护照有效期为必填项',
          sex: '性别为必填项',
          occupation: '职业为必填项',
          cityOfResidence: '居住城市为必填项',
          residentCountry: '常住国家为必填项',
          phoneNumber: '手机号码为必填项',
          email: '电子邮箱为必填项',
          travelPurpose: '旅行目的为必填项',
          arrivalDate: '到达日期为必填项',
          departureDate: '离境日期为必填项',
          arrivalFlightNumber: '入境航班号为必填项',
          departureFlightNumber: '离境航班号为必填项',
          accommodationType: '住宿类型为必填项',
          province: '省份为必填项',
          district: '区/县为必填项',
          subDistrict: '街道/镇为必填项',
          postalCode: '邮政编码为必填项',
          hotelAddress: '酒店/住宿地址为必填项',
          recentStayCountry: '最近停留国家为必填项',
          boardingCountry: '登机国家为必填项',
        },

        // 格式验证错误
        format: {
          passportNo: '护照号码格式无效（通常为8-9位字母数字组合）',
          email: '电子邮箱格式无效（例如：example@email.com）',
          phoneNumber: '手机号码格式无效（8-15位数字）',
          phoneCode: '电话区号格式无效（例如：+86、+1）',
          postalCode: '邮政编码格式无效',
          flightNumber: '航班号格式无效（例如：TG123、CZ456）',
          uppercaseRequired: '必须使用大写字母',
          alphanumericOnly: '只允许字母和数字',
          numbersOnly: '只允许数字',
        },

        // 长度验证错误
        length: {
          passportNoTooShort: '护照号码太短（最少{{min}}位）',
          passportNoTooLong: '护照号码太长（最多{{max}}位）',
          phoneNumberTooShort: '手机号码太短（最少{{min}}位）',
          phoneNumberTooLong: '手机号码太长（最多{{max}}位）',
          nameTooShort: '姓名太短（最少{{min}}位）',
          nameTooLong: '姓名太长（最多{{max}}位）',
          textTooLong: '文本超过最大长度{{max}}个字符',
        },

        // 日期验证错误
        date: {
          invalid: '日期格式无效',
          pastRequired: '日期必须是过去的日期',
          futureRequired: '日期必须是未来的日期',
          passportExpired: '护照已过期',
          passportExpiringSoon: '护照将在6个月内过期 - 可能被移民局拒绝',
          dobTooRecent: '出生日期太近（必须至少{{minAge}}岁）',
          dobTooOld: '出生日期似乎不合理（请检查）',
          arrivalBeforeDeparture: '到达日期必须在离境日期之前',
          departureBeforeArrival: '离境日期必须在到达日期之后',
          arrivalTooFar: '到达日期太遥远（最多{{maxDays}}天）',
          arrivalTooSoon: '到达日期太接近（最少距离{{minHours}}小时）',
          stayTooLong: '停留时长超过免签限制（{{maxDays}}天）',
        },

        // 特定字段警告（非关键）
        warning: {
          nameNotUppercase: '姓名应使用护照上显示的大写字母',
          nameMismatch: '姓名格式可能与护照不符 - 请核实',
          passportExpiringWithin6Months: '护照将在{{months}}个月后过期 - 部分国家要求6个月以上有效期',
          emailUncommon: '电子邮箱格式不常见 - 请核实',
          phoneNumberShort: '手机号码似乎太短 - 请核实',
          occupationOther: '您选择了"其他" - 请在自定义字段中输入您的职业',
          cityNotRecognized: '城市无法识别 - 请核实拼写',
          missingFlightPhoto: '未上传机票照片 - 建议上传以加快处理',
          missingHotelPhoto: '未上传酒店预订照片 - 建议上传以便核实',
          transitPassenger: '您已标记为过境旅客 - 住宿详情可能不需要填写',
        },

        // 照片上传错误
        photo: {
          uploadFailed: '照片上传失败 - 请重试',
          invalidFormat: '照片格式无效 - 请使用JPG、PNG或PDF',
          fileTooLarge: '照片文件太大（最大{{maxSize}}MB）',
          permissionDenied: '相机/相册权限被拒绝 - 请在设置中启用',
          cameraNotAvailable: '此设备无相机功能',
          processingFailed: '照片处理失败 - 请尝试其他照片',
        },

        // 地理位置级联错误
        location: {
          provinceRequired: '请先选择省份',
          districtRequired: '请选择区/县',
          subDistrictRequired: '请选择街道/镇',
          invalidProvince: '所选省份无效',
          invalidDistrict: '所选区/县对该省份无效',
          invalidSubDistrict: '所选街道/镇对该区/县无效',
          loadingFailed: '加载地理位置数据失败 - 请重试',
        },

        // 网络/保存错误
        save: {
          failed: '保存数据失败 - 请检查网络连接',
          retrying: '正在重试保存...（{{attempt}}/{{max}}）',
          offline: '您处于离线状态 - 数据将在连接恢复后保存',
          conflict: '检测到数据冲突 - 请刷新后重试',
          timeout: '保存超时 - 请检查互联网连接',
        },

        // TDAC提交错误
        submission: {
          missingRequiredFields: '请在提交前完成所有必填字段',
          invalidData: '部分数据无效 - 请检查高亮显示的字段',
          networkError: '网络错误 - 请检查连接后重试',
          serverError: '服务器错误 - 请稍后重试',
          cloudflareTimeout: 'Cloudflare验证超时 - 请重试',
          submissionWindowClosed: '提交窗口已关闭 - 请联系客服',
          submissionWindowNotOpen: '提交窗口尚未开启 - 请等待至{{openTime}}',
          duplicateSubmission: '此入境信息已提交过',
          rateLimitExceeded: '尝试次数过多 - 请等待{{minutes}}分钟',
        },
      },
    },
    result: {
      title: '{{flag}} {{country}}入境包已准备好',
      subtitle: '所有资料已整理，随时可在机场出示',
      entryPack: {
        title: '基本信息',
        subtitle: '{{subtitle}}',
        share: '分享',
        fields: {
          traveler: '姓名',
          passportNo: '护照',
          flightNo: '航班',
          departureDate: '出发',
          arrivalDate: '到达',
          accommodation: '酒店',
        },
        notFilled: '未填写',
        toBeConfirmed: '待确认',
        actions: {
          startGuide: '启动入境指南',
          editInfo: '更改资料',
        },
        lastUpdated: '最后更新：{{time}}',
        subtitleParts: {
          departure: '出发 {{date}}',
          arrival: '到达 {{date}}',
          flight: '航班 {{flight}}',
          missing: '请补齐行程信息',
        },
      },
      historyBanner: {
        badge: '待入境旅程',
        status: '已自动保存',
        description: '信息已留存在入境包中，可随时修改或分享给亲友复核。',
        primaryCta: {
          title: '开始入境指引',
          subtitle: '逐步引导 · 大字显示',
        },
        secondaryCta: {
          shareFamily: '分享',
          editInfo: '编辑',
        },
        footer: {
          title: '🛃 最后一环：向海关出示通关包',
          note: '抄写模式只是整个流程中的一步，落地后按指引逐步完成即可。',
        },
      },
      digitalInfo: {
        title: '需要在线申请 {{systemName}}',
        button: '前往申请',
        autoFill: '⚡ 自动填写',
      },
      checkSection: {
        title: '需要检查信息？',
        viewForm: {
          title: '查看完整表格',
          subtitle: '已填写 {{count}} 项信息',
        },
        qaGuide: {
          title: '海关问答参考',
          subtitle: '{{count}}个常见问题',
        },
      },
      footer: '完成！返回首页',
      infoBox: '已自动保存到「历史记录」，随时可以查看',
      errors: {
        pdfFailed: '无法生成PDF',
        downloadFailed: '下载失败',
        shareFailed: '分享失败',
        shareUnavailable: '该设备不支持分享功能',
        printFailed: '打印失败',
      },
    },
    profile: {
      header: '我的',
      user: {
        phone: '手机: {{phone}}',
      },
      common: {
        notFilled: '未填写',
      },
      personal: {
        title: '个人信息',
        subtitle: '更新通关资料',
        collapsedHint: '点击展开查看个人信息',
        fields: {
          dateOfBirth: {
            title: '出生日期',
            subtitle: 'Date of Birth',
            placeholder: 'YYYY-MM-DD',
          },
          gender: {
            title: '性别',
            subtitle: 'Gender',
            placeholder: 'MALE / FEMALE',
          },
          occupation: {
            title: '职业',
            subtitle: 'Occupation',
            placeholder: 'Occupation',
          },
          provinceCity: {
            title: '居住城市/州',
            subtitle: 'Province / City of Residence',
            placeholder: 'Province / City',
          },
          countryRegion: {
            title: '居住国/地区',
            subtitle: 'Country / Region',
            placeholder: 'Country / Region',
          },
          phone: {
            title: '电话号码',
            subtitle: 'Phone',
            placeholder: '+86 1234567890',
          },
          email: {
            title: '邮箱地址',
            subtitle: 'Email',
            placeholder: 'your@email.com',
          },
        },
      },
      funding: {
        title: '资金证明清单',
        subtitle: '入境时快速出示',
        collapsedHint: '点击展开查看资金证明清单',
        addButton: '添加资金项目',
        selectType: '选择资金项目类型',
        selectTypeMessage: '选择要添加的资金项目类型',
        empty: '暂无资金项目，点击下方按钮添加第一个项目',
        footerNote: '以上信息会同步到通关包，方便入境检查时向移民官展示。',
        actions: {
          scanProof: '扫描 / 上传资金证明',
        },
        fields: {
          cashAmount: {
            title: '随身现金',
            placeholder: '例如：10,000 泰铢现金 + 500 美元',
            sample: '10,000 泰铢等值现金（约 2,000 人民币）',
          },
          bankCards: {
            title: '银行卡及余额',
            placeholder: '例如：招商银行 Visa (****1234) · 余额 20,000 CNY',
            sample: '招商银行 Visa (****1234) · 余额 20,000 CNY\n工商银行 储蓄卡 (****8899) · 余额 15,000 CNY',
          },
          supportingDocs: {
            title: '证明文件',
            placeholder: '例如：银行卡余额截图、交易记录 PDF、银行对账单',
            sample: '银行 App 余额截图、近 3 日交易记录 PDF 已保存于相册',
          },
        },
      },
      fundItem: {
        create: {
          title: '添加资金项目',
          success: '资金项目添加成功',
        },
        detail: {
          title: '资金项目详情',
          editTitle: '编辑资金项目',
          edit: '编辑',
          delete: '删除',
          save: '保存更改',
          cancel: '取消',
          manageAll: '管理所有资金',
          addPhoto: '添加照片',
          replacePhoto: '更换照片',
          viewPhoto: '点击查看大图',
          noPhoto: '未添加照片',
          photo: '照片',
          photoOptions: '选择一个选项',
          takePhoto: '拍照',
          chooseFromLibrary: '从相册选择',
          photoHint: '双指缩放，拖动平移',
        },
        fields: {
          amount: '金额',
          currency: '货币',
          description: '描述',
          descriptionPlaceholder: '添加描述（可选）',
          type: '类型',
          selectCurrency: '选择货币',
        },
        types: {
          CASH: '现金',
          BANK_CARD: '银行卡',
          DOCUMENT: '证明文件',
        },
        deleteConfirm: {
          title: '删除资金项目',
          message: '确定要删除此资金项目吗？',
          confirm: '删除',
          cancel: '取消',
        },
        validation: {
          amountRequired: '金额为必填项',
          amountInvalid: '金额必须是有效数字',
          amountPositive: '金额必须大于0',
          currencyRequired: '货币为必填项',
          currencyFormat: '货币必须是3个字母的代码',
        },
        errors: {
          loadFailed: '加载资金项目详情失败',
          updateFailed: '保存更改失败，请重试',
          deleteFailed: '删除资金项目失败，请重试',
          photoFailed: '更新照片失败，请重试',
          permissionTitle: '需要权限',
          permissionMessage: '请授予访问相册的权限',
          cameraPermissionMessage: '请授予访问相机的权限',
        },
        success: {
          photoUpdated: '成功',
          photoUpdatedMessage: '照片已成功更新',
        },
        accessibility: {
          amountHint: '输入此资金项目的金额',
          currencyHint: '打开货币选择器以选择货币',
          descriptionHint: '输入此资金项目的可选描述',
          photoPreview: '资金项目照片预览',
          photoPreviewHint: '双击查看全尺寸照片',
          addPhotoHint: '打开选项以拍照或从相册选择',
          replacePhotoHint: '打开选项以拍摄新照片或从相册选择',
          saveHint: '保存更改并返回查看模式',
          cancelHint: '放弃更改并返回查看模式',
          editHint: '打开编辑模式以修改资金项目详情',
          deleteHint: '确认后删除此资金项目',
          manageAllHint: '导航到完整的资金管理屏幕',
          closeModalHint: '关闭资金项目详情弹窗',
          backHint: '返回上一屏幕',
          closeCurrencyPickerHint: '关闭货币选择器',
          selectCurrencyHint: '选择此货币',
        },
      },
      passport: {
        title: '我的护照',
        subtitle: '{{passportNo}} · 有效期至 {{expiry}}',
        collapsedHint: '点击展开查看护照详情',
        updateButton: '更新护照信息',
        fields: {
          passportNo: '护照号码',
          nationality: '国籍',
          expiry: '有效期至',
          issueDate: '签发日期',
          issuePlace: '签发地',
        },
      },
      vip: {
        title: '升级高级会员',
        subtitle: '无限次生成，优先处理',
        upgradeButton: '立即升级',
      },
      sections: {
        myServices: '我的服务',
        settings: '设置与帮助',
      },
      menu: {
        documents: { title: '我的证件', badge: '({{count}})' },
        history: { title: '生成历史', badge: '({{count}})' },
        backup: {
          title: '云端备份',
          subtitle: '最近: {{time}}',
          defaultTime: '今天',
        },
        language: {
          title: '语言 / Language',
          subtitle: '当前：{{language}}',
        },
        settings: { title: '设置' },
        help: { title: '帮助中心' },
        about: { title: '关于我们' },
        notifications: { title: '通知设置' },
        notificationLogs: { title: '通知日志', subtitle: '查看通知历史和分析' },
      },
      editModal: {
        save: '保存',
      },
      logout: '退出登录',
      version: '版本 {{version}}',
    },
    generating: {
      title: '处理中',
      message: 'AI正在生成您的通关包',
      estimate: '预计还需 {{seconds}} 秒...',
      stepsTitle: '正在做什么:',
      steps: {
        verifyDocument: '识别证件信息',
        checkExpiry: '验证有效期',
        generateForm: '生成{{country}}入境表格',
        generateQA: '生成海关问答卡',
        translate: '翻译为当地语言',
      },
      errors: {
        title: '生成失败',
        message: '请稍后重试',
        retry: '重试',
        goBack: '返回',
      },
    },
    immigrationGuide: {
      back: '返回',
      needHelp: '需要帮助',
      previousStep: '上一步',
      completeEntry: '结束入境，返回入境包',
      openEntryPack: '打开通关包',
      previewEntryPack: '预览通关包',
      modalClose: '关闭',
      entryCardSampleTitle: '入境卡样本',
      customsDeclarationSampleTitle: '海关申报单样本',
      clickToViewLarge: '点击查看大图',
      entryCardModalTitle: '日本入境卡样本',
      entryCardModalHint: '可截图或放大查看每一栏位的填写示例',
      biometricModalTitle: '日本生物识别示意',
      biometricModalHint: '示意需要将手指轻放在扫描器上完成采集',
      customsModalTitle: '日本海关申报单样本',
      customsModalHint: '可截图或放大查看每一项填写示例',
      helpMenu: {
        title: '需要帮助吗？',
        message: '请选择您需要的帮助类型：',
        findStaff: '找工作人员',
        findStaffMessage: '请寻找穿制服的工作人员',
        languageHelp: '语言帮助',
        languageHelpMessage: '工作人员会说英语和日语',
        medicalHelp: '医疗帮助',
        medicalHelpMessage: '请拨打机场医疗急救电话',
        cancel: '取消',
        notice: '提示',
        emergency: '紧急',
      },
      japanSteps: {
        step1: {
          title: '📋 第一步：领取表格',
          description: '在入境大厅找到入境卡和海关申报单',
          instruction: '找到标有"入境卡"和"海关申报"的柜台或自动发放机，可先查看样本了解填写内容',
          action: '下一步：填写入境卡',
        },
        step2: {
          title: '✍️ 第二步：填写入境卡',
          description: '用黑色或蓝色笔填写黑色入境卡',
          instruction: '对照手机上的信息，仔细抄写到表格上',
          action: '下一步：海关申报表',
          formPreviewTitle: '📋 入境卡样本',
          formPlaceholderText: '黑色入境卡',
          formPlaceholderHint: '包含护照信息、护照号码、\\n航班信息、住宿地址等',
          viewFormButton: '对照填写入境表',
        },
        step3: {
          title: '📝 第三步：填写海关申报单',
          description: '填写黄色海关申报单',
          instruction: '如实申报携带物品，回答是否有违禁品等问题',
          action: '下一步：入境审查',
          formPreviewTitle: '📋 海关申报单样本',
          formPlaceholderText: '黄色海关申报单',
          formPlaceholderHint: '包含携带物品申报、\\n是否携带违禁品等问题',
          imageHint: '点击查看大图，方便截图或对照填写',
          viewFormButton: '对照填写申报表',
        },
        step4: {
          title: '🏢 第四步：前往入境审查',
          description: '拿着护照和填好的表格前往入境审查柜台',
          instruction: '找到"外国人"(Foreigner)通道，排队等候。轮到你时，将护照和入境卡交给工作人员，保持微笑，简单回答问题（如访问目的、停留时间等）',
          action: '下一步：生物识别',
        },
        step5: {
          title: '👤 第五步：生物识别检查',
          description: '接受指纹和面部识别',
          instruction: '按照工作人员指示完成生物识别',
          action: '下一步：海关检查',
          biometricNotice: '👆 生物识别示意',
          biometricCaption: '示意日本入境指纹采集设备',
          viewBiometricButton: '查看生物识别示意图',
        },
        step6: {
          title: '🛃 第六步：海关检查',
          description: '领取行李后，前往海关检查区',
          instruction: '将填好的海关申报单交给工作人员。如果申报单上勾选了"是"，或被工作人员要求，需要走红色通道接受检查。如果都勾选"否"且没有违禁品，走绿色通道即可快速通过',
          action: '完成海关检查',
        },
        step7: {
          title: '✅ 第七步：完成入境',
          description: '通关包仅在需要时使用',
          instruction: '如果移民官员询问信息或遇到语言困难，可以打开通关包辅助沟通',
          action: '打开通关包',
        },
      },
    },
  },
  fr: {
    languages: {
      en: 'English',
      'zh-CN': 'Chinois Simplifié',
      'zh-TW': 'Chinois Traditionnel',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
      ja: 'Japonais',
      ko: 'Coréen',
      zh: 'Chinois',
    },
    common: {
      appName: 'BorderBuddy',
      enterCta: 'Entrée Gratuite',
      footerMessage: 'Essayez BorderBuddy gratuitement – l’IA gère vos formalités d’entrée',
      ok: 'OK',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      back: 'Retour',
      view: 'Voir',
      unknown: 'Inconnu',
      yes: 'Oui',
      no: 'Non',
    },
    tabs: {
      home: 'Accueil',
      history: 'Historique',
      profile: 'Profil',
    },
    screenTitles: {
      scanPassport: 'Scanner document',
      selectDestination: 'Choisir destination',
      result: 'Pack d\'entrée',
    },
    login: {
      tagline: 'Entrée transfrontalière • Passage fluide',
      benefits: {
        free: 'Entièrement gratuit',
        noRegistration: 'Aucune inscription',
        instant: 'Utilisation instantanée',
      },
      ctaTitle: 'L\'entrée transfrontalière n\'a jamais été aussi simple',
      ctaSubtitle: 'Remplissage de formulaires en un clic, profitez d\'une expérience douanière fluide',
      buttonText: 'Commencer • Gratuit',
      buttonSubtext: 'Pas d\'inscription, accès instantané',
      popularityText: '🔥 {{percent}}% d\'entrée fluide',
      hotlistLabel: 'Destinations en tendance',
      hotlistDescription: 'Les favoris de la semaine',
    },
    home: {
      header: { title: 'BorderBuddy' },
      greeting: 'Bonjour, {{name}} 👋',
      welcomeText: 'Choisissez une destination pour générer votre pack d\'entrée',
      sections: { pending: '🛬 Voyages à venir', whereToGo: '🧭 Où voulez-vous aller ?' },
      passport: { type: 'Passeport Chinois' },
      destinationNames: { jp: 'Japon', th: 'Thaïlande', hk: 'Hong Kong', tw: 'Taïwan', kr: 'Corée du Sud', my: 'Malaisie', us: 'États-Unis' },
      destinations: { japan: { flightTime: 'Vol de 3 heures' }, thailand: { flightTime: 'Vol de 3 heures' }, hongKong: { flightTime: 'Vol de 1 heure' }, taiwan: { flightTime: 'Vol de 2 heures' }, korea: { flightTime: 'Vol de 2 heures' }, malaysia: { flightTime: 'Vol de 4 heures' }, usa: { flightTime: 'Vol de 13 heures' } },
      pendingTrips: { departSuffix: 'Départ', cards: { jp: { title: 'Voyage au Japon' }, th: { title: 'Voyage en Thaïlande' }, us: { title: 'Voyage aux États-Unis' }, kr: { title: 'Voyage en Corée du Sud' }, my: { title: 'Voyage en Malaisie' }, tw: { title: 'Voyage à Taïwan' }, hk: { title: 'Voyage à Hong Kong' } } },
      alerts: { notAvailableTitle: 'Bientôt disponible', notAvailableBody: 'Cette destination n\'est pas encore disponible', historyFoundTitle: 'Pack d\'entrée trouvé', historyFoundBody: { pre: 'Pack d\'entrée pour {{country}} trouvé', flight: 'Vol', date: 'Date', hotel: 'Hôtel', question: 'Utiliser ce pack ?', regenerate: 'Régénérer' } },
      history: { emptyTitle: 'Pas d\'historique', emptySubtitle: 'Vos packs apparaîtront ici', cardTitle: 'Pack {{country}}' },
    },
    history: {
      headerTitle: 'Historique',
      filterButton: 'Filtrer ⌄',
      timePrefix: 'Généré',
      passportPrefix: 'Passeport',
      sections: { today: 'Aujourd\'hui', yesterday: 'Hier', thisWeek: 'Cette semaine', thisMonth: 'Ce mois', earlier: 'Plus tôt' },
      items: { hk: { title: 'Pack Hong Kong', time: 'Aujourd\'hui à 14h30', passport: 'Passeport chinois E12345678' }, th: { title: 'Pack Thaïlande', time: 'Hier à 10h15', passport: 'Passeport chinois E12345678' } },
      empty: { title: 'Aucun historique', subtitle: 'Vos packs générés apparaîtront ici' },
    },
    travelInfo: {
      header: { title: 'Informations de voyage', back: 'Retour' },
      infoCard: { title: 'Voyage vers {{destination}}', subtitle: 'Remplissez vos détails de voyage' },
      sections: { flight: 'Informations de vol', accommodation: 'Hébergement', trip: 'Détails du voyage', health: 'Déclaration de santé', usCustoms: 'Douane américaine', caCustoms: 'Douane canadienne' },
      fields: { flightNumber: { label: 'Numéro de vol', placeholder: 'ex: CA981' }, arrivalDate: { label: 'Date d\'arrivée', placeholder: 'AAAA-MM-JJ', help: 'Dans les 72 heures' }, hotelName: { label: 'Hôtel', placeholder: 'Nom de l\'hôtel' }, hotelAddress: { label: 'Adresse', placeholder: 'Adresse complète' }, contactPhone: { label: 'Téléphone', placeholder: '+1234567890' }, stayDuration: { label: 'Durée (jours)', placeholder: 'ex: 7' }, purpose: 'But du voyage' },
      purposes: { tourism: 'Tourisme', business: 'Affaires', visiting: 'Visite familiale', study: 'Études', work: 'Travail' },
      yesNoQuestion: { fever: 'Avez-vous eu de la fièvre?', usCash: 'Plus de 10 000 USD?', usFood: 'Nourriture/plantes/animaux?', caCurrency: 'Plus de 10 000 CAD?', caDuty: 'Marchandises taxables?', caFirearms: 'Armes à feu?', caCommercial: 'Marchandises commerciales?', caFood: 'Produits alimentaires?' },
      arrivingFrom: { label: 'En provenance de', us: 'États-Unis', other: 'Autre pays' },
      hints: { caDuty: 'Alcool, tabac, cadeaux', caFood: 'Viande, produits laitiers, fruits' },
      scanButtons: { ticket: 'Scanner billet', hotel: 'Scanner réservation' },
      generateButton: 'Générer le pack',
      tips: { title: '💡 Conseils', body: '• Préparez votre billet\n• Confirmation d\'hôtel\n• Soyez honnête\n• Gardez vos contacts' },
      alerts: { permissionPhotoTitle: 'Permission requise', permissionPhotoBody: 'Accès caméra/photos nécessaire', permissionDeniedAction: 'OK', ocrSuccessFlight: 'Vol extrait!', ocrSuccessHotel: 'Hôtel extrait!', loginRequiredTitle: 'Connexion requise', loginRequiredBody: 'OCR nécessite connexion', loginButton: 'Connexion', manualEntryButton: 'Saisie manuelle', ocrFailTitle: 'Échec', ocrFailBody: 'Extraction impossible', genericErrorTitle: 'Erreur', galleryError: 'Galerie inaccessible', dateTooFarTitle: 'Date trop loin', dateTooFarBody: 'Dans les 72h ({{days}} jours)', datePastTitle: 'Date invalide', datePastBody: 'Date passée invalide' },
      duplicateModal: { title: 'Pack existant', message: 'Pack trouvé avec même vol:', labels: { destination: 'Destination:', flight: 'Vol:', arrival: 'Arrivée:', generated: 'Généré:' }, arrivalSuffix: 'arrivée {{date}}', hint: 'Utiliser existant ou générer nouveau?', useExisting: 'Utiliser existant', regenerate: 'Générer nouveau', cancel: 'Annuler' },
    },
    result: {
      title: '{{flag}} {{country}} Pack prêt',
      subtitle: 'Tous les documents sont prêts',
      entryPack: { title: 'Informations de base', subtitle: '{{subtitle}}', share: 'Partager', fields: { traveler: 'Nom', passportNo: 'Passeport', flightNo: 'Vol', departureDate: 'Départ', arrivalDate: 'Arrivée', accommodation: 'Hôtel' }, notFilled: 'Non rempli', toBeConfirmed: 'À confirmer', actions: { startGuide: 'Démarrer le guide', editInfo: 'Modifier' }, lastUpdated: 'Mis à jour: {{time}}', subtitleParts: { departure: 'Départ {{date}}', arrival: 'Arrivée {{date}}', flight: 'Vol {{flight}}', missing: 'Veuillez compléter les informations de voyage' } },
      historyBanner: { badge: 'Voyage en attente', status: 'Sauvegardé', description: 'Informations sauvegardées, modifiables à tout moment.', primaryCta: { title: 'Commencer le guide', subtitle: 'Étape par étape · Grande police' }, secondaryCta: { shareFamily: 'Partager', editInfo: 'Éditer' }, footer: { title: '🛃 Dernière étape: Douane', note: 'Le mode copie n\'est qu\'une étape.' } },
      digitalInfo: { title: '{{systemName}} en ligne requis', button: 'Postuler', autoFill: '⚡ Auto-remplir' },
      checkSection: { title: 'Vérifier les infos?', viewForm: { title: 'Voir le formulaire', subtitle: '{{count}} champs' }, qaGuide: { title: 'Guide Q&R douane', subtitle: '{{count}} questions' } },
      footer: 'Terminé! Retour accueil',
      infoBox: 'Sauvegardé dans "Historique"',
      errors: { pdfFailed: 'Échec PDF', downloadFailed: 'Échec téléchargement', shareFailed: 'Échec partage', shareUnavailable: 'Partage non disponible', printFailed: 'Échec impression' },
    },
    profile: {
      header: 'Profil',
      user: { phone: 'Tél: {{phone}}' },
      common: {
        notFilled: 'Non renseigné',
      },
      personal: {
        title: 'Informations personnelles',
        subtitle: 'Mettez à jour les données pour le contrôle frontière',
        collapsedHint: 'Touchez pour afficher les informations personnelles',
        fields: {
          dateOfBirth: {
            title: 'Date de naissance',
            subtitle: 'Date de naissance',
            placeholder: 'AAAA-MM-JJ',
          },
          gender: {
            title: 'Genre',
            subtitle: 'Genre',
            placeholder: 'HOMME / FEMME',
          },
          occupation: {
            title: 'Profession',
            subtitle: 'Profession',
            placeholder: 'Profession',
          },
          provinceCity: {
            title: 'Ville / Province',
            subtitle: 'Ville ou province de résidence',
            placeholder: 'Ville / Province',
          },
          countryRegion: {
            title: 'Pays / Région',
            subtitle: 'Pays / Région',
            placeholder: 'Pays / Région',
          },
          phone: {
            title: 'Numéro de téléphone',
            subtitle: 'Téléphone',
            placeholder: '+33 612345678',
          },
          email: {
            title: 'Adresse e-mail',
            subtitle: 'Email',
            placeholder: 'votre@email.com',
          },
        },
      },
      funding: {
        title: 'Check-list justificatifs financiers',
        subtitle: 'À présenter rapidement à l’immigration',
        collapsedHint: 'Touchez pour afficher la liste des justificatifs financiers',
        tip: {
          title: 'Fonds suffisants',
          subtitle: 'Emportez au moins 10 000 THB par personne ou un justificatif équivalent',
          description:
            'Les agents peuvent vérifier vos espèces ou soldes bancaires. Préparez des captures d’écran ou relevés et listez vos espèces, cartes et soldes pour un contrôle rapide.',
        },
        footerNote: 'Ces informations sont synchronisées avec votre pack d’entrée pour les contrôles.',
        actions: {
          scanProof: 'Scanner / téléverser un justificatif financier',
        },
        fields: {
          cashAmount: {
            title: 'Espèces sur vous',
            placeholder: 'ex. 10 000 THB en espèces + 500 USD',
            sample: 'Équivalent 10 000 THB en espèces (env. ¥2 000)',
          },
          bankCards: {
            title: 'Cartes bancaires & soldes',
            placeholder: 'ex.\nCMB Visa (****1234) · Solde 20 000 CNY',
            sample:
              'CMB Visa (****1234) · Solde 20 000 CNY\nICBC Débit (****8899) · Solde 15 000 CNY',
          },
          supportingDocs: {
            title: 'Pièces justificatives',
            placeholder: 'ex. captures d’écran, relevés PDF, attestations bancaires',
            sample: 'Captures d’écran de l’appli bancaire et relevés récents sauvegardés',
          },
        },
      },
      passport: {
        title: 'Mon passeport',
        subtitle: '{{passportNo}} · Valide jusqu\'à {{expiry}}',
        collapsedHint: 'Appuyez pour développer les détails',
        updateButton: 'Mettre à jour',
        fields: {
          passportNo: 'Numéro de passeport',
          nationality: 'Nationalité',
          expiry: 'Date d\'expiration',
          issueDate: 'Date de délivrance',
          issuePlace: 'Lieu de délivrance',
        },
      },
      vip: {
        title: 'Passer Premium',
        subtitle: 'Générations illimitées, priorité',
        upgradeButton: 'Mettre à niveau',
      },
      sections: { myServices: 'Mes services', settings: 'Paramètres & Aide' },
      menu: {
        documents: { title: 'Mes documents', badge: '({{count}})' },
        history: { title: 'Historique', badge: '({{count}})' },
        backup: {
          title: 'Sauvegarde cloud',
          subtitle: 'Récent : {{time}}',
          defaultTime: 'Aujourd’hui',
        },
        language: {
          title: 'Langue',
          subtitle: 'Actuelle : {{language}}',
        },
        settings: { title: 'Paramètres' },
        help: { title: 'Centre d\'aide' },
        about: { title: 'À propos' },
        notifications: { title: 'Notifications' },
      },
      editModal: {
        save: 'Enregistrer',
      },
      logout: 'Déconnexion',
      version: 'Version {{version}}',
    },
    generating: {
      title: 'Traitement',
      message: 'L\'IA génère votre pack',
      estimate: 'Environ {{seconds}} secondes...',
      stepsTitle: 'En cours:',
      steps: { verifyDocument: 'Vérification document', checkExpiry: 'Vérification validité', generateForm: 'Génération formulaire {{country}}', generateQA: 'Génération Q&R douane', translate: 'Traduction' },
      errors: { title: 'Échec génération', message: 'Réessayer plus tard', retry: 'Réessayer', goBack: 'Retour' },
    },
  },
  de: {
    languages: {
      en: 'English',
      'zh-CN': 'Vereinfachtes Chinesisch',
      'zh-TW': 'Traditionelles Chinesisch',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
      ja: 'Japanisch',
      ko: 'Koreanisch',
      zh: 'Chinesisch',
    },
    common: {
      appName: 'BorderBuddy',
      enterCta: 'Kostenlos Starten',
      footerMessage: 'Teste BorderBuddy gratis – KI erledigt deine Einreiseformalitäten',
      ok: 'OK',
      cancel: 'Abbrechen',
      confirm: 'Bestätigen',
      back: 'Zurück',
      view: 'Ansehen',
      unknown: 'Unbekannt',
      yes: 'Ja',
      no: 'Nein',
    },
    tabs: {
      home: 'Startseite',
      history: 'Verlauf',
      profile: 'Profil',
    },
    screenTitles: {
      scanPassport: 'Dokument scannen',
      selectDestination: 'Ziel wählen',
      result: 'Einreisepaket',
    },
    login: {
      tagline: 'Grenzüberschreitende Einreise • Nahtloser Durchgang',
      benefits: {
        free: 'Völlig kostenlos',
        noRegistration: 'Keine Registrierung',
        instant: 'Sofortige Nutzung',
      },
      ctaTitle: 'Grenzüberschreitende Einreise war noch nie so einfach',
      ctaSubtitle: 'Ein-Klick-Formularausfüllung, genießen Sie nahtlose Zollerfahrung',
      buttonText: 'Loslegen • Kostenlos',
      buttonSubtext: 'Keine Anmeldung, sofortiger Zugang',
      popularityText: '🔥 {{percent}}% reibungslose Einreise',
      hotlistLabel: 'Reisetrends',
      hotlistDescription: 'Beliebte Ziele dieser Woche',
    },
    home: {
      header: { title: 'BorderBuddy' },
      greeting: 'Hallo, {{name}} 👋',
      welcomeText: 'Wählen Sie ein Reiseziel für Ihr Einreisepaket',
      sections: { pending: '🛬 Bevorstehende Reisen', whereToGo: '🧭 Wohin möchten Sie?' },
      passport: { type: 'Chinesischer Reisepass' },
      destinationNames: { jp: 'Japan', th: 'Thailand', hk: 'Hongkong', tw: 'Taiwan', kr: 'Südkorea', my: 'Malaysia', us: 'USA' },
      destinations: { japan: { flightTime: '3 Std. Flug' }, thailand: { flightTime: '3 Std. Flug' }, hongKong: { flightTime: '1 Std. Flug' }, taiwan: { flightTime: '2 Std. Flug' }, korea: { flightTime: '2 Std. Flug' }, malaysia: { flightTime: '4 Std. Flug' }, usa: { flightTime: '13 Std. Flug' } },
      pendingTrips: { departSuffix: 'Abflug', cards: { jp: { title: 'Japan-Reise' }, th: { title: 'Thailand-Reise' }, us: { title: 'USA-Reise' }, kr: { title: 'Südkorea-Reise' }, my: { title: 'Malaysia-Reise' }, tw: { title: 'Taiwan-Reise' }, hk: { title: 'Hongkong-Reise' } } },
      alerts: { notAvailableTitle: 'Demnächst', notAvailableBody: 'Noch nicht verfügbar', historyFoundTitle: 'Paket gefunden', historyFoundBody: { pre: 'Paket für {{country}} gefunden', flight: 'Flug', date: 'Datum', hotel: 'Hotel', question: 'Paket verwenden?', regenerate: 'Neu generieren' } },
      history: { emptyTitle: 'Keine Historie', emptySubtitle: 'Pakete erscheinen hier', cardTitle: '{{country}}-Paket' },
    },
    history: {
      headerTitle: 'Verlauf',
      filterButton: 'Filter ⌄',
      timePrefix: 'Erstellt',
      passportPrefix: 'Reisepass',
      sections: { today: 'Heute', yesterday: 'Gestern', thisWeek: 'Diese Woche', thisMonth: 'Diesen Monat', earlier: 'Früher' },
      items: { hk: { title: 'Hongkong-Paket', time: 'Heute um 14:30', passport: 'Chinesischer Pass E12345678' }, th: { title: 'Thailand-Paket', time: 'Gestern um 10:15', passport: 'Chinesischer Pass E12345678' } },
      empty: { title: 'Keine Historie', subtitle: 'Ihre generierten Pakete erscheinen hier' },
    },
    travelInfo: {
      header: { title: 'Reiseinformationen', back: 'Zurück' },
      infoCard: { title: 'Reise nach {{destination}}', subtitle: 'Füllen Sie Ihre Reisedetails aus' },
      sections: { flight: 'Fluginformationen', accommodation: 'Unterkunft', trip: 'Reisedetails', health: 'Gesundheitserklärung', usCustoms: 'US-Zoll', caCustoms: 'Kanadischer Zoll' },
      fields: { flightNumber: { label: 'Flugnummer', placeholder: 'z.B. CA981' }, arrivalDate: { label: 'Ankunftsdatum', placeholder: 'JJJJ-MM-TT', help: 'Innerhalb 72 Stunden' }, hotelName: { label: 'Hotel', placeholder: 'Hotelname' }, hotelAddress: { label: 'Adresse', placeholder: 'Vollständige Adresse' }, contactPhone: { label: 'Telefon', placeholder: '+1234567890' }, stayDuration: { label: 'Aufenthalt (Tage)', placeholder: 'z.B. 7' }, purpose: 'Reisezweck' },
      purposes: { tourism: 'Tourismus', business: 'Geschäft', visiting: 'Familienbesuch', study: 'Studium', work: 'Arbeit' },
      yesNoQuestion: { fever: 'Fieber gehabt?', usCash: 'Über 10.000 USD?', usFood: 'Lebensmittel/Pflanzen?', caCurrency: 'Über 10.000 CAD?', caDuty: 'Zollpflichtige Waren?', caFirearms: 'Waffen?', caCommercial: 'Handelswaren?', caFood: 'Lebensmittel?' },
      arrivingFrom: { label: 'Ankunft von', us: 'USA', other: 'Anderes Land' },
      hints: { caDuty: 'Alkohol, Tabak, Geschenke', caFood: 'Fleisch, Milchprodukte, Obst' },
      scanButtons: { ticket: 'Ticket scannen', hotel: 'Buchung scannen' },
      generateButton: 'Paket generieren',
      tips: { title: '💡 Tipps', body: '• Ticket bereit\n• Hotelbuchung\n• Ehrlich sein\n• Kontakte bereithalten' },
      alerts: { permissionPhotoTitle: 'Berechtigung erforderlich', permissionPhotoBody: 'Kamera-/Fotozugriff nötig', permissionDeniedAction: 'OK', ocrSuccessFlight: 'Flug erkannt!', ocrSuccessHotel: 'Hotel erkannt!', loginRequiredTitle: 'Login erforderlich', loginRequiredBody: 'OCR erfordert Login', loginButton: 'Login', manualEntryButton: 'Manuell eingeben', ocrFailTitle: 'Fehlgeschlagen', ocrFailBody: 'Erkennung fehlgeschlagen', genericErrorTitle: 'Fehler', galleryError: 'Galerie-Fehler', dateTooFarTitle: 'Datum zu weit', dateTooFarBody: 'Innerhalb 72h ({{days}} Tage)', datePastTitle: 'Ungültiges Datum', datePastBody: 'Datum in Vergangenheit' },
      duplicateModal: { title: 'Paket existiert', message: 'Paket mit gleichem Flug gefunden:', labels: { destination: 'Ziel:', flight: 'Flug:', arrival: 'Ankunft:', generated: 'Erstellt:' }, arrivalSuffix: 'Ankunft {{date}}', hint: 'Existierendes verwenden oder neu?', useExisting: 'Verwenden', regenerate: 'Neu generieren', cancel: 'Abbrechen' },
    },
    result: {
      title: '{{flag}} {{country}} Paket bereit',
      subtitle: 'Alle Dokumente bereit',
      entryPack: { title: 'Grundinformationen', subtitle: '{{subtitle}}', share: 'Teilen', fields: { traveler: 'Name', passportNo: 'Pass', flightNo: 'Flug', departureDate: 'Abflug', arrivalDate: 'Ankunft', accommodation: 'Hotel' }, notFilled: 'Nicht ausgefüllt', toBeConfirmed: 'Zu bestätigen', actions: { startGuide: 'Guide starten', editInfo: 'Bearbeiten' }, lastUpdated: 'Aktualisiert: {{time}}', subtitleParts: { departure: 'Abflug {{date}}', arrival: 'Ankunft {{date}}', flight: 'Flug {{flight}}', missing: 'Bitte Reisedaten vervollständigen' } },
      historyBanner: { badge: 'Anstehende Reise', status: 'Gespeichert', description: 'Informationen gespeichert, jederzeit änderbar.', primaryCta: { title: 'Guide starten', subtitle: 'Schritt-für-Schritt · Große Schrift' }, secondaryCta: { shareFamily: 'Teilen', editInfo: 'Ändern' }, footer: { title: '🛃 Letzter Schritt: Zoll', note: 'Kopiermodus ist nur ein Schritt.' } },
      digitalInfo: { title: '{{systemName}} online erforderlich', button: 'Bewerben', autoFill: '⚡ Auto-ausfüllen' },
      checkSection: { title: 'Infos prüfen?', viewForm: { title: 'Formular ansehen', subtitle: '{{count}} Felder' }, qaGuide: { title: 'Zoll-Q&A', subtitle: '{{count}} Fragen' } },
      footer: 'Fertig! Zurück',
      infoBox: 'In "Verlauf" gespeichert',
      errors: { pdfFailed: 'PDF fehlgeschlagen', downloadFailed: 'Download fehlgeschlagen', shareFailed: 'Teilen fehlgeschlagen', shareUnavailable: 'Teilen nicht verfügbar', printFailed: 'Drucken fehlgeschlagen' },
    },
    profile: {
      header: 'Profil',
      user: { phone: 'Tel: {{phone}}' },
      common: {
        notFilled: 'Nicht ausgefüllt',
      },
      personal: {
        title: 'Persönliche Angaben',
        subtitle: 'Aktualisiere deine Grenzangaben',
        collapsedHint: 'Zum Anzeigen der persönlichen Angaben tippen',
        fields: {
          dateOfBirth: {
            title: 'Geburtsdatum',
            subtitle: 'Geburtsdatum',
            placeholder: 'JJJJ-MM-TT',
          },
          gender: {
            title: 'Geschlecht',
            subtitle: 'Geschlecht',
            placeholder: 'MÄNNLICH / WEIBLICH',
          },
          occupation: {
            title: 'Beruf',
            subtitle: 'Beruf',
            placeholder: 'Beruf',
          },
          provinceCity: {
            title: 'Wohnort (Stadt/Provinz)',
            subtitle: 'Wohnsitz (Provinz / Stadt)',
            placeholder: 'Provinz / Stadt',
          },
          countryRegion: {
            title: 'Wohnsitzland',
            subtitle: 'Land / Region',
            placeholder: 'Land / Region',
          },
          phone: {
            title: 'Telefonnummer',
            subtitle: 'Telefon',
            placeholder: '+49 1712345678',
          },
          email: {
            title: 'E-Mail-Adresse',
            subtitle: 'E-Mail',
            placeholder: 'ihre@email.de',
          },
        },
      },
      funding: {
        title: 'Checkliste Finanznachweis',
        subtitle: 'Schnell bei der Einreise vorzeigen',
        collapsedHint: 'Tippen, um die Finanznachweise anzuzeigen',
        footerNote: 'Diese Angaben werden in deinem Einreisepaket gespeichert und können bei der Kontrolle gezeigt werden.',
        actions: {
          scanProof: 'Finanznachweis scannen / hochladen',
        },
        fields: {
          cashAmount: {
            title: 'Bargeld dabei',
            placeholder: 'z. B. 10.000 THB Bargeld + 500 USD',
            sample: '10.000 THB Bargeld (ca. ¥2.000)',
          },
          bankCards: {
            title: 'Bankkarten & Guthaben',
            placeholder: 'z. B.\nCMB Visa (****1234) · Guthaben 20.000 CNY',
            sample:
              'CMB Visa (****1234) · Guthaben 20.000 CNY\nICBC Debit (****8899) · Guthaben 15.000 CNY',
          },
          supportingDocs: {
            title: 'Nachweisunterlagen',
            placeholder: 'z. B. Screenshots, PDF-Kontoauszüge, Bankbestätigungen',
            sample: 'Bank-App-Screenshots und aktuelle Transaktionen gespeichert',
          },
        },
      },
      passport: { 
        title: 'Mein Pass', 
        subtitle: '{{passportNo}} · Gültig bis {{expiry}}', 
        collapsedHint: 'Tippen Sie, um Details anzuzeigen',
        updateButton: 'Aktualisieren',
        fields: {
          passportNo: 'Passnummer',
          nationality: 'Nationalität',
          expiry: 'Ablaufdatum',
          issueDate: 'Ausstellungsdatum',
          issuePlace: 'Ausstellungsort',
        },
      },
      vip: { title: 'Premium werden', subtitle: 'Unbegrenzte Generierungen, Priorität', upgradeButton: 'Upgraden' },
      sections: { myServices: 'Meine Dienste', settings: 'Einstellungen & Hilfe' },
      menu: {
        documents: { title: 'Meine Dokumente', badge: '({{count}})' },
        history: { title: 'Verlauf', badge: '({{count}})' },
        backup: {
          title: 'Cloud-Backup',
          subtitle: 'Kürzlich: {{time}}',
          defaultTime: 'Heute',
        },
        language: {
          title: 'Sprache',
          subtitle: 'Aktuell: {{language}}',
        },
        settings: { title: 'Einstellungen' },
        help: { title: 'Hilfe' },
        about: { title: 'Über' },
        notifications: { title: 'Benachrichtigungen' },
      },
      editModal: {
        save: 'Speichern',
      },
      logout: 'Abmelden',
      version: 'Version {{version}}',
    },
    generating: {
      title: 'Verarbeitung',
      message: 'KI erstellt Ihr Paket',
      estimate: 'Etwa {{seconds}} Sekunden...',
      stepsTitle: 'Aktuelle Schritte:',
      steps: { verifyDocument: 'Dokument prüfen', checkExpiry: 'Gültigkeit prüfen', generateForm: '{{country}} Formular erstellen', generateQA: 'Zoll-Q&A erstellen', translate: 'Übersetzen' },
      errors: { title: 'Fehler', message: 'Später erneut versuchen', retry: 'Wiederholen', goBack: 'Zurück' },
    },
  },
  es: {
    languages: {
      en: 'English',
      'zh-CN': 'Chino Simplificado',
      'zh-TW': 'Chino Tradicional',
      fr: 'Français',
      de: 'Deutsch',
      es: 'Español',
      ja: 'Japonés',
      ko: 'Coreano',
      zh: 'Chino',
    },
    common: {
      appName: 'BorderBuddy',
      enterCta: 'Entrar Gratis',
      footerMessage: 'Prueba BorderBuddy gratis: la IA gestiona tus trámites de entrada',
      ok: 'OK',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      back: 'Atrás',
      view: 'Ver',
      unknown: 'Desconocido',
      yes: 'Sí',
      no: 'No',
    },
    tabs: {
      home: 'Inicio',
      history: 'Historial',
      profile: 'Perfil',
    },
    screenTitles: {
      scanPassport: 'Escanear documento',
      selectDestination: 'Elegir destino',
      result: 'Paquete de entrada',
    },
    login: {
      tagline: 'Entrada transfronteriza • Paso fluido',
      benefits: {
        free: 'Completamente gratis',
        noRegistration: 'Sin registro',
        instant: 'Uso instantáneo',
      },
      ctaTitle: 'La entrada transfronteriza nunca ha sido tan simple',
      ctaSubtitle: 'Llenado de formularios con un clic, disfruta de una experiencia aduanera fluida',
      buttonText: 'Comenzar • Gratis',
      buttonSubtext: 'Sin registro, acceso instantáneo',
      popularityText: '🔥 {{percent}}% entrada fluida',
      hotlistLabel: 'Destinos en tendencia',
      hotlistDescription: 'Favoritos de esta semana',
    },
    home: {
      header: { title: 'BorderBuddy' },
      greeting: 'Hola, {{name}} 👋',
      welcomeText: 'Elige un destino para tu paquete de entrada',
      sections: { pending: '🛬 Próximos viajes', whereToGo: '🧭 ¿A dónde quieres ir?' },
      passport: { type: 'Pasaporte Chino' },
      destinationNames: { jp: 'Japón', th: 'Tailandia', hk: 'Hong Kong', tw: 'Taiwán', kr: 'Corea del Sur', my: 'Malasia', us: 'EE.UU.' },
      destinations: { japan: { flightTime: '3 horas de vuelo' }, thailand: { flightTime: '3 horas de vuelo' }, hongKong: { flightTime: '1 hora de vuelo' }, taiwan: { flightTime: '2 horas de vuelo' }, korea: { flightTime: '2 horas de vuelo' }, malaysia: { flightTime: '4 horas de vuelo' }, usa: { flightTime: '13 horas de vuelo' } },
      pendingTrips: { departSuffix: 'Salida', cards: { jp: { title: 'Viaje a Japón' }, th: { title: 'Viaje a Tailandia' }, us: { title: 'Viaje a EE.UU.' }, kr: { title: 'Viaje a Corea del Sur' }, my: { title: 'Viaje a Malasia' }, tw: { title: 'Viaje a Taiwán' }, hk: { title: 'Viaje a Hong Kong' } } },
      alerts: { notAvailableTitle: 'Próximamente', notAvailableBody: 'Destino no disponible aún', historyFoundTitle: 'Paquete encontrado', historyFoundBody: { pre: 'Paquete para {{country}} encontrado', flight: 'Vuelo', date: 'Fecha', hotel: 'Hotel', question: '¿Usar este paquete?', regenerate: 'Generar de nuevo' } },
      history: { emptyTitle: 'Sin historial', emptySubtitle: 'Tus paquetes aparecerán aquí', cardTitle: 'Paquete {{country}}' },
    },
    history: {
      headerTitle: 'Historial',
      filterButton: 'Filtrar ⌄',
      timePrefix: 'Generado',
      passportPrefix: 'Pasaporte',
      sections: { today: 'Hoy', yesterday: 'Ayer', thisWeek: 'Esta semana', thisMonth: 'Este mes', earlier: 'Anterior' },
      items: { hk: { title: 'Paquete Hong Kong', time: 'Hoy a las 14:30', passport: 'Pasaporte chino E12345678' }, th: { title: 'Paquete Tailandia', time: 'Ayer a las 10:15', passport: 'Pasaporte chino E12345678' } },
      empty: { title: 'Sin historial', subtitle: 'Tus paquetes generados aparecerán aquí' },
    },
    travelInfo: {
      header: { title: 'Información de viaje', back: 'Atrás' },
      infoCard: { title: 'Viaje a {{destination}}', subtitle: 'Complete sus detalles de viaje' },
      sections: { flight: 'Información de vuelo', accommodation: 'Alojamiento', trip: 'Detalles del viaje', health: 'Declaración de salud', usCustoms: 'Aduana de EE.UU.', caCustoms: 'Aduana de Canadá' },
      fields: { flightNumber: { label: 'Número de vuelo', placeholder: 'ej: CA981' }, arrivalDate: { label: 'Fecha de llegada', placeholder: 'AAAA-MM-DD', help: 'Dentro de 72 horas' }, hotelName: { label: 'Hotel', placeholder: 'Nombre del hotel' }, hotelAddress: { label: 'Dirección', placeholder: 'Dirección completa' }, contactPhone: { label: 'Teléfono', placeholder: '+1234567890' }, stayDuration: { label: 'Duración (días)', placeholder: 'ej: 7' }, purpose: 'Propósito del viaje' },
      purposes: { tourism: 'Turismo', business: 'Negocios', visiting: 'Visita familiar', study: 'Estudio', work: 'Trabajo' },
      yesNoQuestion: { fever: '¿Ha tenido fiebre?', usCash: '¿Más de $10,000 USD?', usFood: '¿Alimentos/plantas/animales?', caCurrency: '¿Más de $10,000 CAD?', caDuty: '¿Bienes gravables?', caFirearms: '¿Armas de fuego?', caCommercial: '¿Bienes comerciales?', caFood: '¿Productos alimenticios?' },
      arrivingFrom: { label: 'Procedencia', us: 'Estados Unidos', other: 'Otro país' },
      hints: { caDuty: 'Alcohol, tabaco, regalos', caFood: 'Carne, lácteos, frutas' },
      scanButtons: { ticket: 'Escanear boleto', hotel: 'Escanear reserva' },
      generateButton: 'Generar paquete',
      tips: { title: '💡 Consejos', body: '• Tenga su boleto listo\n• Confirmación de hotel\n• Sea honesto\n• Guarde sus contactos' },
      alerts: { permissionPhotoTitle: 'Permiso requerido', permissionPhotoBody: 'Necesitamos acceso a cámara/fotos', permissionDeniedAction: 'OK', ocrSuccessFlight: '¡Vuelo extraído!', ocrSuccessHotel: '¡Hotel extraído!', loginRequiredTitle: 'Login requerido', loginRequiredBody: 'OCR requiere login', loginButton: 'Iniciar sesión', manualEntryButton: 'Entrada manual', ocrFailTitle: 'Fallo', ocrFailBody: 'No se pudo extraer', genericErrorTitle: 'Error', galleryError: 'Error de galería', dateTooFarTitle: 'Fecha lejana', dateTooFarBody: 'Dentro de 72h ({{days}} días)', datePastTitle: 'Fecha inválida', datePastBody: 'Fecha en el pasado' },
      duplicateModal: { title: 'Paquete existe', message: 'Paquete con mismo vuelo encontrado:', labels: { destination: 'Destino:', flight: 'Vuelo:', arrival: 'Llegada:', generated: 'Generado:' }, arrivalSuffix: 'llegada {{date}}', hint: '¿Usar existente o generar nuevo?', useExisting: 'Usar existente', regenerate: 'Generar nuevo', cancel: 'Cancelar' },
    },
    result: {
      title: '{{flag}} {{country}} Paquete listo',
      subtitle: 'Todos los documentos listos',
      entryPack: { title: 'Información básica', subtitle: '{{subtitle}}', share: 'Compartir', fields: { traveler: 'Nombre', passportNo: 'Pasaporte', flightNo: 'Vuelo', departureDate: 'Salida', arrivalDate: 'Llegada', accommodation: 'Hotel' }, notFilled: 'No rellenado', toBeConfirmed: 'Por confirmar', actions: { startGuide: 'Iniciar guía', editInfo: 'Editar' }, lastUpdated: 'Actualizado: {{time}}', subtitleParts: { departure: 'Salida {{date}}', arrival: 'Llegada {{date}}', flight: 'Vuelo {{flight}}', missing: 'Completa los datos del viaje' } },
      historyBanner: { badge: 'Viaje pendiente', status: 'Guardado', description: 'Información guardada, modificable en cualquier momento.', primaryCta: { title: 'Iniciar guía', subtitle: 'Paso a paso · Letra grande' }, secondaryCta: { shareFamily: 'Compartir', editInfo: 'Editar' }, footer: { title: '🛃 Último paso: Aduana', note: 'El modo copia es solo un paso.' } },
      digitalInfo: { title: '{{systemName}} en línea requerido', button: 'Aplicar', autoFill: '⚡ Auto-rellenar' },
      checkSection: { title: '¿Verificar información?', viewForm: { title: 'Ver formulario', subtitle: '{{count}} campos' }, qaGuide: { title: 'Guía Q&A aduana', subtitle: '{{count}} preguntas' } },
      footer: '¡Listo! Volver',
      infoBox: 'Guardado en "Historial"',
      errors: { pdfFailed: 'Error PDF', downloadFailed: 'Error descarga', shareFailed: 'Error compartir', shareUnavailable: 'Compartir no disponible', printFailed: 'Error impresión' },
    },
    profile: {
      header: 'Perfil',
      user: { phone: 'Tel: {{phone}}' },
      common: {
        notFilled: 'No rellenado',
      },
      personal: {
        title: 'Información personal',
        subtitle: 'Actualiza los datos para el control fronterizo',
        collapsedHint: 'Toca para ver la información personal',
        fields: {
          dateOfBirth: {
            title: 'Fecha de nacimiento',
            subtitle: 'Fecha de nacimiento',
            placeholder: 'AAAA-MM-DD',
          },
          gender: {
            title: 'Género',
            subtitle: 'Género',
            placeholder: 'MASCULINO / FEMENINO',
          },
          occupation: {
            title: 'Profesión',
            subtitle: 'Profesión',
            placeholder: 'Profesión',
          },
          provinceCity: {
            title: 'Ciudad / provincia de residencia',
            subtitle: 'Provincia / Ciudad',
            placeholder: 'Provincia / Ciudad',
          },
          countryRegion: {
            title: 'País / región',
            subtitle: 'País / región',
            placeholder: 'País / región',
          },
          phone: {
            title: 'Número de teléfono',
            subtitle: 'Teléfono',
            placeholder: '+34 612345678',
          },
          email: {
            title: 'Dirección de correo electrónico',
            subtitle: 'Correo',
            placeholder: 'su@email.com',
          },
        },
      },
      funding: {
        title: 'Lista de comprobación de fondos',
        subtitle: 'Preséntala rápidamente en inmigración',
        collapsedHint: 'Toca para ver la lista de comprobación de fondos',
        addButton: 'Agregar artículo de fondos',
        selectType: 'Seleccionar tipo de artículo de fondos',
        selectTypeMessage: 'Elige el tipo de artículo de fondos a agregar',
        empty: 'Aún no hay artículos de fondos. Toca abajo para agregar tu primer artículo.',
        footerNote: 'Esta información se sincroniza con tu paquete de entrada para mostrarla en el control.',
        actions: {
          scanProof: 'Escanear / subir comprobante de fondos',
        },
        fields: {
          cashAmount: {
            title: 'Efectivo disponible',
            placeholder: 'ej. 10 000 THB en efectivo + 500 USD',
            sample: 'Efectivo equivalente a 10 000 THB (aprox ¥2 000)',
          },
          bankCards: {
            title: 'Tarjetas y saldos',
            placeholder: 'ej.\nCMB Visa (****1234) · Saldo 20 000 CNY',
            sample:
              'CMB Visa (****1234) · Saldo 20 000 CNY\nICBC Débito (****8899) · Saldo 15 000 CNY',
          },
          supportingDocs: {
            title: 'Documentos de respaldo',
            placeholder: 'ej. capturas de saldo, PDF de transacciones, estados bancarios',
            sample: 'Capturas de apps bancarias y movimientos recientes guardados',
          },
        },
      },
      fundItem: {
        create: {
          title: 'Agregar artículo de fondos',
          success: 'Artículo de fondos agregado exitosamente',
        },
        detail: {
          title: 'Detalles del artículo de fondos',
          editTitle: 'Editar artículo de fondos',
          edit: 'Editar',
          delete: 'Eliminar',
          save: 'Guardar cambios',
          cancel: 'Cancelar',
          manageAll: 'Administrar todos los fondos',
          addPhoto: 'Agregar foto',
          replacePhoto: 'Reemplazar foto',
          viewPhoto: 'Toca para ver en tamaño completo',
          noPhoto: 'Sin foto adjunta',
          photo: 'Foto',
          photoOptions: 'Elige una opción',
          takePhoto: 'Tomar foto',
          chooseFromLibrary: 'Elegir de la galería',
          photoHint: 'Pellizca para hacer zoom, arrastra para mover',
        },
        fields: {
          amount: 'Cantidad',
          currency: 'Moneda',
          description: 'Descripción',
          descriptionPlaceholder: 'Agregar una descripción (opcional)',
          type: 'Tipo',
          selectCurrency: 'Seleccionar moneda',
        },
        types: {
          CASH: 'Efectivo',
          BANK_CARD: 'Tarjeta bancaria',
          DOCUMENT: 'Documento de respaldo',
        },
        deleteConfirm: {
          title: 'Eliminar artículo de fondos',
          message: '¿Estás seguro de que deseas eliminar este artículo de fondos?',
          confirm: 'Eliminar',
          cancel: 'Cancelar',
        },
        validation: {
          amountRequired: 'La cantidad es obligatoria',
          amountInvalid: 'La cantidad debe ser un número válido',
          amountPositive: 'La cantidad debe ser mayor que 0',
          currencyRequired: 'La moneda es obligatoria',
          currencyFormat: 'La moneda debe ser un código de 3 letras',
        },
        errors: {
          loadFailed: 'Error al cargar los detalles del artículo de fondos',
          updateFailed: 'Error al guardar los cambios. Por favor, inténtalo de nuevo.',
          deleteFailed: 'Error al eliminar el artículo de fondos. Por favor, inténtalo de nuevo.',
          photoFailed: 'Error al actualizar la foto. Por favor, inténtalo de nuevo.',
          permissionTitle: 'Permiso requerido',
          permissionMessage: 'Por favor, concede permiso para acceder a tu galería de fotos.',
          cameraPermissionMessage: 'Por favor, concede permiso para acceder a tu cámara.',
        },
        success: {
          photoUpdated: 'Éxito',
          photoUpdatedMessage: 'La foto se ha actualizado correctamente.',
        },
        accessibility: {
          amountHint: 'Ingrese la cantidad de dinero para este artículo de fondos',
          currencyHint: 'Abre el selector de moneda para seleccionar una moneda',
          descriptionHint: 'Ingrese una descripción opcional para este artículo de fondos',
          photoPreview: 'Vista previa de la foto del artículo de fondos',
          photoPreviewHint: 'Toque dos veces para ver la foto en tamaño completo',
          addPhotoHint: 'Abre opciones para tomar una foto o elegir de la galería',
          replacePhotoHint: 'Abre opciones para tomar una nueva foto o elegir de la galería',
          saveHint: 'Guarda los cambios y vuelve al modo de visualización',
          cancelHint: 'Descarta los cambios y vuelve al modo de visualización',
          editHint: 'Abre el modo de edición para modificar los detalles del artículo de fondos',
          deleteHint: 'Elimina este artículo de fondos después de la confirmación',
          manageAllHint: 'Navega a la pantalla completa de gestión de fondos',
          closeModalHint: 'Cierra el modal de detalles del artículo de fondos',
          backHint: 'Vuelve a la pantalla anterior',
          closeCurrencyPickerHint: 'Cierra el selector de moneda',
          selectCurrencyHint: 'Selecciona esta moneda',
        },
      },
      passport: { 
        title: 'Mi pasaporte', 
        subtitle: '{{passportNo}} · Válido hasta {{expiry}}', 
        collapsedHint: 'Toque para expandir los detalles',
        updateButton: 'Actualizar',
        fields: {
          passportNo: 'Número de pasaporte',
          nationality: 'Nacionalidad',
          expiry: 'Fecha de vencimiento',
          issueDate: 'Fecha de emisión',
          issuePlace: 'Lugar de emisión',
        },
      },
      vip: { title: 'Pasar a Premium', subtitle: 'Generaciones ilimitadas y prioridad', upgradeButton: 'Actualizar' },
      sections: { myServices: 'Mis servicios', settings: 'Ajustes y Ayuda' },
      menu: {
        documents: { title: 'Mis documentos', badge: '({{count}})' },
        history: { title: 'Historial', badge: '({{count}})' },
        backup: {
          title: 'Respaldo en nube',
          subtitle: 'Reciente: {{time}}',
          defaultTime: 'Hoy',
        },
        language: {
          title: 'Idioma',
          subtitle: 'Actual: {{language}}',
        },
        settings: { title: 'Ajustes' },
        help: { title: 'Centro de ayuda' },
        about: { title: 'Acerca de' },
        notifications: { title: 'Notificaciones' },
      },
      editModal: {
        save: 'Guardar',
      },
      logout: 'Cerrar sesión',
      version: 'Versión {{version}}',
    },
    generating: {
      title: 'Procesando',
      message: 'IA generando tu paquete',
      estimate: 'Aprox {{seconds}} segundos...',
      stepsTitle: 'Pasos actuales:',
      steps: { verifyDocument: 'Verificar documento', checkExpiry: 'Verificar validez', generateForm: 'Generar formulario {{country}}', generateQA: 'Generar Q&A aduana', translate: 'Traducir' },
      errors: { title: 'Error', message: 'Reintentar más tarde', retry: 'Reintentar', goBack: 'Volver' },
    },
  },
};

// Generate Traditional Chinese variants from Simplified Chinese
const generateTraditionalChineseTranslations = () => {
  const traditionalBase = convertToTraditional(baseTranslations.zh, 'zh-TW');
  const traditionalCountries = countryTranslations['zh-TW'];
  return deepMergeTranslations(traditionalBase, traditionalCountries);
};

// Create final translations object with pre-computed Traditional Chinese
export const translations = {
  ...baseTranslations,
  'zh-CN': baseTranslations.zh,
  'zh-TW': generateTraditionalChineseTranslations(),
};

// Merge country-specific translations from JSON files
Object.keys(countryTranslations).forEach((lang) => {
  if (lang === 'zh-TW') {
    return;
  }
  const base = translations[lang] || {};
  translations[lang] = deepMergeTranslations(base, countryTranslations[lang]);
});

export const getLanguageLabel = (language) =>
  translations?.en?.languages?.[language] || language;

// Get translation with fallback mechanism
export const getTranslationWithFallback = (key, language, params = {}) => {
  const keys = key.split('.');
  let current = translations[language];
  
  // Try primary language first
  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k];
    } else {
      current = null;
      break;
    }
  }
  
  // If not found, try fallback language
  if (!current && LANGUAGE_FALLBACK[language]) {
    const fallbackLang = LANGUAGE_FALLBACK[language];
    current = translations[fallbackLang];
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        current = null;
        break;
      }
    }
  }
  
  // Final fallback to English
  if (!current) {
    current = translations.en;
    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        current = key; // Return key if not found
        break;
      }
    }
  }
  
  // Handle string interpolation
  if (typeof current === 'string' && Object.keys(params).length > 0) {
    return current.replace(/\{\{(\w+)\}\}/g, (match, param) => params[param] || match);
  }
  
  return current;
};
