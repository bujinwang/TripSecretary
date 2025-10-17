import JapanDataValidator from '../JapanDataValidator';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const baseTravelInfo = {
  travelPurpose: 'Tourism',
  arrivalFlightNumber: 'JL123',
  arrivalDate: '2099-12-31', // will be overridden in tests
  accommodationAddress: '1-2-3 Shinjuku, Tokyo',
  accommodationPhone: '+81312345678',
  lengthOfStay: '5',
};

const buildTravelInfo = (overrides = {}) => ({
  ...baseTravelInfo,
  ...overrides,
});

describe('JapanDataValidator.validateTravelInfo', () => {
  test('accepts arrival date equal to the current day', () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = JapanDataValidator.validateTravelInfo(
      buildTravelInfo({ arrivalDate: formatDate(today) })
    );

    expect(result.isValid).toBe(true);
    expect(result.errors).not.toContain('Arrival date must be in the future');
  });

  test('rejects arrival date set in the past', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const result = JapanDataValidator.validateTravelInfo(
      buildTravelInfo({ arrivalDate: formatDate(yesterday) })
    );

    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Arrival date must be in the future');
  });
});
