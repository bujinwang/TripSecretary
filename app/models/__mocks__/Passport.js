// app/models/__mocks__/Passport.js
const Passport = jest.fn().mockImplementation((data) => {
  return {
    id: data.id || 'test-passport-id',
    userId: data.userId || 'test-user',
    passportNumber: data.passportNumber || 'E12345678',
    fullName: data.fullName || 'ZHANG, WEI',
    dateOfBirth: data.dateOfBirth || '1988-01-22',
    nationality: data.nationality || 'CHN',
    gender: data.gender || 'Male',
    expiryDate: data.expiryDate || '2030-12-31',
    issueDate: data.issueDate || '2020-12-31',
    issuePlace: data.issuePlace || 'Shanghai',
    save: jest.fn().mockResolvedValue(true),
    delete: jest.fn().mockResolvedValue(true),
  };
});

Passport.load = jest.fn().mockImplementation(async (id) => {
  return new Passport({ id });
});

export default Passport;