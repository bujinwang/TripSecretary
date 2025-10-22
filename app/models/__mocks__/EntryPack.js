// app/models/__mocks__/EntryPack.js
const EntryPack = jest.fn().mockImplementation((data) => {
  return {
    id: data.id || 'test-pack-id',
    entryInfoId: data.entryInfoId,
    userId: data.userId,
    destinationId: data.destinationId,
    tripId: data.tripId,
    tdacSubmission: data.tdacSubmission || {
      arrCardNo: null,
      qrUri: null,
      pdfPath: null,
      submittedAt: null,
      submissionMethod: null
    },
    submissionHistory: data.submissionHistory || [],
    documents: data.documents || {
      qrCodeImage: null,
      pdfDocument: null,
      entryCardImage: null
    },
    displayStatus: data.displayStatus || {
      completionPercent: 0,
      categoryStates: {
        passport: 'missing',
        personalInfo: 'missing', 
        funds: 'missing',
        travel: 'missing'
      },
      countdownMessage: null,
      ctaState: 'disabled',
      showQR: false,
      showGuide: false
    },
    status: data.status || 'in_progress',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    archivedAt: data.archivedAt || null,
    save: jest.fn().mockResolvedValue(true),
    hasValidTDACSubmission: jest.fn(() => false),
    updateTDACSubmission: jest.fn(),
    updateDisplayStatus: jest.fn(),
    canBeEdited: jest.fn(() => true),
    requiresResubmission: jest.fn(() => false),
    isActive: jest.fn(() => true),
    isHistorical: jest.fn(() => false),
    getDisplayStatus: jest.fn(() => ({
      color: 'orange',
      message: '进行中',
      icon: '⚠️'
    })),
    validate: jest.fn(() => ({ isValid: true, errors: [] })),
    recordFailedSubmission: jest.fn(),
    getSubmissionAttemptCount: jest.fn(() => 0),
    getFailedSubmissionCount: jest.fn(() => 0),
  };
});

EntryPack.load = jest.fn().mockImplementation(async (id) => {
  return new EntryPack({ id, status: 'submitted' });
});

EntryPack.loadByUserId = jest.fn().mockImplementation(async (userId, filters = {}) => {
  return [new EntryPack({ id: 'test-pack-id', userId, status: 'in_progress' })];
});

export default EntryPack;