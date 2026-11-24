// app/models/__mocks__/Passport.ts

const PassportMock = jest.fn((data: Record<string, any> = {}) => {
  const passport = {
    id: data.id ?? 'test-passport-id',
    userId: data.userId ?? 'test-user',
    passportNumber: data.passportNumber ?? 'E12345678',
    fullName: data.fullName ?? 'ZHANG, WEI',
    dateOfBirth: data.dateOfBirth ?? '1988-01-22',
    nationality: data.nationality ?? 'CHN',
    gender: data.gender ?? 'Male',
    expiryDate: data.expiryDate ?? '2030-12-31',
    issueDate: data.issueDate ?? '2020-12-31',
    issuePlace: data.issuePlace ?? 'Shanghai',
    isPrimary: data.isPrimary ?? false,
    save: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true)
  };

  return passport;
});

(PassportMock as any).load = jest.fn(async (id: string) =>
  new PassportMock({
    id,
    passportNumber: 'P98765432',
    fullName: 'TANAKA, YUKI',
    nationality: 'JPN',
    dateOfBirth: '1985-05-20',
    expiryDate: '2028-06-30'
  })
);

export default PassportMock;

