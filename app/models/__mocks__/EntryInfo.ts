// app/models/__mocks__/EntryInfo.ts

const EntryInfoMock = jest.fn((data: Record<string, any> = {}) => {
  const entryInfo = {
    id: data.id ?? 'test-entry-info-id',
    userId: data.userId ?? 'test-user',
    destinationId: data.destinationId ?? 'th',
    status: data.status ?? 'ready',
    arrivalDate: data.arrivalDate ?? '2024-12-25T10:00:00Z',
    documents: data.documents ?? null,
    displayStatus: data.displayStatus ?? null,
    getCompleteData: jest.fn().mockResolvedValue({
      passport: { id: 'passport-1', userId: data.userId ?? 'test-user' },
      personalInfo: { id: 'personal-1', userId: data.userId ?? 'test-user' },
      funds: [],
      travel: { arrivalDate: data.arrivalDate ?? '2024-12-25T10:00:00Z' }
    }),
    requiresResubmission: jest.fn(() => false),
    getSummary: jest.fn(() => ({
      id: data.id ?? 'test-entry-info-id',
      destinationId: data.destinationId ?? 'th'
    })),
    updateCompletionMetrics: jest.fn(),
    getTotalCompletionPercent: jest.fn(() => 100)
  };

  return entryInfo;
});

(EntryInfoMock as any).load = jest.fn(async (id: string) => new EntryInfoMock({ id }));

export default EntryInfoMock;

