// @ts-nocheck

import { isTestOrDummyAddress } from '../addressValidation';

describe('addressValidation', () => {
  it('flags obvious placeholders', () => {
    expect(isTestOrDummyAddress('test address')).toBe(true);
    expect(isTestOrDummyAddress('AAAAAA')).toBe(true);
    expect(isTestOrDummyAddress('111111')).toBe(true);
  });

  it('accepts realistic addresses with numbers', () => {
    expect(isTestOrDummyAddress('Room 1111, Marriott Hotel, Bangkok')).toBe(false);
    expect(isTestOrDummyAddress('35/8 Sukhumvit Soi 11, Bangkok')).toBe(false);
  });
});
