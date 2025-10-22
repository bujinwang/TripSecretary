// app/models/__mocks__/EntryInfo.js
const EntryInfo = jest.fn().mockImplementation((data) => {
  return {
    id: data.id || 'test-entry-info-id',
    userId: data.userId || 'test-user',
    destinationId: data.destinationId || 'th',
    status: data.status || 'ready',
    arrivalDate: data.arrivalDate || '2024-12-25T10:00:00Z',
    getCompleteData: jest.fn().mockResolvedValue({
      passport: { id: 'passport-1', userId: data.userId || 'test-user' },
      personalInfo: { id: 'personal-1', userId: data.userId || 'test-user' },
      funds: [],
      travel: { arrivalDate: data.arrivalDate || '2024-12-25T10:00:00Z' }
    }),
    requiresResubmission: jest.fn(() => false),
    getSummary: jest.fn(() => ({ id: data.id || 'test-entry-info-id', destinationId: data.destinationId || 'th' })),
  };
});

EntryInfo.load = jest.fn().mockImplementation(async (id) => {
  return new EntryInfo({ id });
});

export default EntryInfo;