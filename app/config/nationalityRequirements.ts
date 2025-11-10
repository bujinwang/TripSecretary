// @ts-nocheck

export const nationalityRequirements = {
  // Destination -> Nationality -> Requirements
  'us': {
    'CHN': {
      visaRequired: true,
      visaType: 'B1/B2',
      additionalRequirements: ['EVUS'],
      stayDuration: '180 days (determined by CBP)',
      kioskEligible: false,
      specialNotes: ['CBP interview required', 'I-94 form needed']
    },
    'CAN': {
      visaRequired: false, // ESTA for visa waiver
      visaType: 'ESTA',
      additionalRequirements: ['ESTA authorization'],
      stayDuration: '90 days',
      kioskEligible: true,
      specialNotes: ['Can use APC kiosks']
    },
    'GBR': {
      visaRequired: false,
      visaType: 'ESTA',
      stayDuration: '90 days',
      kioskEligible: true
    }
  },
  'jp': {
    'CHN': {
      visaRequired: true,
      visaType: 'Tourist visa',
      stayDuration: '15-90 days',
      kioskEligible: false,
      specialNotes: ['Financial proof required', 'Itinerary required']
    },
    'CAN': {
      visaRequired: false,
      stayDuration: '90 days',
      kioskEligible: false, // Foreign nationals can't use auto-gates
      specialNotes: ['Visa waiver program']
    }
  },
  'sg': {
    'CHN': {
      visaRequired: false,
      stayDuration: '30 days',
      kioskEligible: true,
      digitalForms: ['SG Arrival Card'],
      specialNotes: ['Submit 3 days before arrival']
    },
    'CAN': {
      visaRequired: false,
      stayDuration: '90 days',
      kioskEligible: true,
      digitalForms: ['SG Arrival Card']
    }
  }
};