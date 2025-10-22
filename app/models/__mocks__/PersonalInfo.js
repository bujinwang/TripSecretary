// app/models/__mocks__/PersonalInfo.js
const PersonalInfo = jest.fn().mockImplementation((data) => {
  return {
    id: data.id || 'test-personal-info-id',
    userId: data.userId || 'test-user',
    phoneNumber: data.phoneNumber || '+86 13812345678',
    email: data.email || 'test@example.com',
    homeAddress: data.homeAddress || '123 Main St',
    occupation: data.occupation || 'Engineer',
    provinceCity: data.provinceCity || 'Shanghai',
    countryRegion: data.countryRegion || 'CHN',
    phoneCode: data.phoneCode || '+86',
    gender: data.gender || 'Male',
    save: jest.fn().mockResolvedValue(true),
    mergeUpdates: jest.fn().mockResolvedValue(true),
  };
});

PersonalInfo.load = jest.fn().mockImplementation(async (id) => {
  return new PersonalInfo({ id });
});

export default PersonalInfo;