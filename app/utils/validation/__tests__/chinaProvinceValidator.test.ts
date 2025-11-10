// @ts-nocheck

import { findChinaProvince, isValidChinaProvince } from '../chinaProvinceValidator';

describe('chinaProvinceValidator', () => {
  it('matches standard province names', () => {
    const match = findChinaProvince('Anhui');
    expect(match).not.toBeNull();
    expect(match.displayName).toBe('Anhui');
  });

  it('matches aliases with suffixes', () => {
    const match = findChinaProvince('Guangxi Zhuang Autonomous Region');
    expect(match).not.toBeNull();
    expect(match.displayName).toBe('Guangxi');
  });

  it('handles municipality inputs', () => {
    const match = findChinaProvince('Shanghai Municipality');
    expect(match).not.toBeNull();
    expect(match.displayName).toBe('Shanghai');
  });

  it('rejects non-province cities for China', () => {
    expect(isValidChinaProvince('Hefei')).toBe(false);
  });
});
