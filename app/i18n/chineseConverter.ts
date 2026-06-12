/**
 * Chinese Language Converter
 * Converts Simplified Chinese (zh-CN) to Traditional Chinese variants (zh-TW, zh-HK)
 * Uses OpenCC for accurate character and phrase conversion
 */

// OpenCC converter function type
type OpenCCConverter = (text: string) => string;

interface OpenCCModule {
  Converter: (options: { from: string; to: string }) => OpenCCConverter;
}

interface Converters {
  'zh-TW': OpenCCConverter;
  'zh-HK': OpenCCConverter;
}

// Lazy-load OpenCC to prevent initialization issues
let OpenCCModule: OpenCCModule | null = null;
const getOpenCC = (): OpenCCModule => {
  if (!OpenCCModule) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      OpenCCModule = require('opencc-js') as OpenCCModule;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to load opencc-js:', message);
      throw err;
    }
  }
  return OpenCCModule;
};

// Lazy-load converters to avoid initialization overhead
let converters: Converters | null = null;
let convertersError: unknown = null;

const initConverters = (): Converters => {
  if (convertersError) {
    throw convertersError;
  }
  if (!converters) {
    try {
      const OpenCCLib = getOpenCC();
      converters = {
        'zh-TW': OpenCCLib.Converter({ from: 'cn', to: 'tw' }),
        'zh-HK': OpenCCLib.Converter({ from: 'cn', to: 'hk' }),
      };
    } catch (err: unknown) {
      convertersError = err;
      const message = err instanceof Error ? err.message : String(err);
      console.error('Failed to initialize OpenCC converters:', message);
      throw err;
    }
  }
  return converters;
};

/**
 * Deep convert an object/array structure from Simplified to Traditional Chinese
 */
const deepConvert = <T>(obj: T, variant: string): T => {
  let converterMap: Converters;
  try {
    converterMap = initConverters();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`OpenCC not available, returning original for ${variant}:`, message);
    return obj;
  }
  
  const converter = converterMap[variant as keyof Converters];

  if (!converter) {
    console.warn(`Unknown Chinese variant: ${variant}, returning original`);
    return obj;
  }

  // Handle primitives
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Convert strings
  if (typeof obj === 'string') {
    return converter(obj) as unknown as T;
  }

  // Convert arrays
  if (Array.isArray(obj)) {
    return obj.map(item => deepConvert(item, variant)) as unknown as T;
  }

  // Convert objects
  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      // Convert both keys and values for completeness
      const convertedKey = converter(key);
      converted[convertedKey] = deepConvert(value, variant);
    }
    return converted as unknown as T;
  }

  // Return other types as-is (numbers, booleans, etc.)
  return obj;
};

/**
 * Convert a Simplified Chinese translation object to Traditional Chinese variant
 * Uses memoization to cache converted objects for performance
 */
const cache = new Map<string, unknown>();

const convertToTraditional = <T>(simplifiedObj: T, variant: string): T => {
  const cacheKey = `${variant}-${JSON.stringify(simplifiedObj).substring(0, 100)}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey) as T;
  }

  const converted = deepConvert(simplifiedObj, variant);
  cache.set(cacheKey, converted);
  
  return converted;
};

/**
 * Clear the conversion cache (useful for testing or memory management)
 */
const clearCache = (): void => {
  cache.clear();
};

export {
  convertToTraditional,
  deepConvert,
  clearCache,
};
