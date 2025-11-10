// @ts-nocheck

/**
 * Address validation helpers shared across TDAC-related flows.
 */

const TEST_PATTERNS = [
  'test',
  'dummy',
  'fake',
  'sample',
  'example',
  'add add',
  'adidas dad',
  'abc',
  '123',
  'xxx',
  'temp',
  'placeholder',
  'default',
  'lorem ipsum',
];

/**
 * Determine if an address appears to be placeholder or obviously invalid.
 * @param {string} address
 * @returns {boolean}
 */
export const isTestOrDummyAddress = (address) => {
  if (!address) {
    return false;
  }

  const lowerAddress = address.toLowerCase().trim();

  for (const pattern of TEST_PATTERNS) {
    if (lowerAddress.includes(pattern)) {
      return true;
    }
  }

  if (lowerAddress.length < 5) {
    return true;
  }

  const normalized = lowerAddress.replace(/[^a-z0-9]/g, '');
  if (normalized.length > 0) {
    const uniqueChars = new Set(normalized);
    if (uniqueChars.size === 1) {
      return true;
    }
  }

  return false;
};

export default {
  isTestOrDummyAddress,
};
