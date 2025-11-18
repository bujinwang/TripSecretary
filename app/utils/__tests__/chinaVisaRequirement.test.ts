// @ts-nocheck

import { getVisaRequirement, getCountryForDisplay, getVisaPriority } from '../countriesService';

describe('China destination visa requirement', () => {
  const t = (key: string, options: any = {}) => options.defaultValue || key;

  it('returns visa_required for Canadian passport', () => {
    const req = getVisaRequirement('cn', 'CAN');
    expect(req).toBe('visa_required');
  });

  it('country display includes requirement and priority', () => {
    const country = getCountryForDisplay('cn', t, 'en');
    expect(country).toBeTruthy();
    expect(country.visaRequirement).toBe('visa_required');
    expect(country.visaPriority).toBe(getVisaPriority('visa_required'));
  });
});