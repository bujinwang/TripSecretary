// @ts-nocheck

/**
 * Image Compression Utility
 *
 * Provides utilities for compressing images before upload to reduce:
 * - Storage size
 * - Upload time
 * - Bandwidth usage
 * - Memory consumption
 *
 * Uses expo-image-manipulator for efficient image processing
 */

import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compression presets for different image types
 */
export const CompressionPresets = {
  // High quality for passport photos (need to be readable)
  PASSPORT: {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  // Medium quality for tickets and receipts
  DOCUMENT: {
    maxWidth: 1024,
    maxHeight: 1366,
    quality: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  // Lower quality for fund proof photos
  PROOF: {
    maxWidth: 800,
    maxHeight: 1067,
    quality: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  // Thumbnail for previews
  THUMBNAIL: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  },
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 * @param {number} width - Original width
 * @param {number} height - Original height
 * @param {number} maxWidth - Maximum width
 * @param {number} maxHeight - Maximum height
 * @returns {{width: number, height: number}} New dimensions
 */
export const calculateDimensions = (width, height, maxWidth, maxHeight) => {
  const aspectRatio = width / height;

  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  let newWidth = maxWidth;
  let newHeight = maxWidth / aspectRatio;

  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = maxHeight * aspectRatio;
  }

  return {
    width: Math.round(newWidth),
    height: Math.round(newHeight),
  };
};

/**
 * Compress an image using a preset configuration
 *
 * @param {string} uri - Image URI to compress
 * @param {Object} preset - Compression preset from CompressionPresets
 * @param {Object} options - Additional options
 * @param {boolean} options.rotate - Auto-rotate based on EXIF (default: true)
 * @param {boolean} options.flipVertically - Flip image vertically
 * @param {boolean} options.flipHorizontally - Flip image horizontally
 * @returns {Promise<Object>} Compressed image result with uri, width, height
 */
export const compressImage = async (uri, preset = CompressionPresets.DOCUMENT, options = {}) => {
  try {
    if (!uri) {
      throw new Error('Image URI is required');
    }

    const {
      rotate = true,
      flipVertically = false,
      flipHorizontally = false,
    } = options;

    // Build manipulation actions
    const actions = [];

    // Add resize action
    actions.push({
      resize: {
        width: preset.maxWidth,
        height: preset.maxHeight,
      },
    });

    // Add rotation if needed
    if (rotate) {
      // expo-image-manipulator automatically reads EXIF orientation
      // No explicit rotation needed
    }

    // Add flip actions if needed
    if (flipVertically) {
      actions.push({ flip: ImageManipulator.FlipType.Vertical });
    }

    if (flipHorizontally) {
      actions.push({ flip: ImageManipulator.FlipType.Horizontal });
    }

    // Perform compression
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        compress: preset.quality,
        format: preset.format,
      }
    );

    console.log('[imageCompression] Compressed image:', {
      original: uri,
      compressed: result.uri,
      dimensions: `${result.width}x${result.height}`,
      preset: Object.keys(CompressionPresets).find(
        key => CompressionPresets[key] === preset
      ),
    });

    return result;
  } catch (error) {
    console.error('[imageCompression] Failed to compress image:', error);
    throw error;
  }
};

/**
 * Compress a passport photo
 * Uses high quality to ensure text is readable
 *
 * @param {string} uri - Image URI
 * @returns {Promise<Object>} Compressed image result
 */
export const compressPassportPhoto = async (uri) => {
  return compressImage(uri, CompressionPresets.PASSPORT, { rotate: true });
};

/**
 * Compress a document photo (ticket, receipt, etc.)
 * Uses medium quality for balance between size and readability
 *
 * @param {string} uri - Image URI
 * @returns {Promise<Object>} Compressed image result
 */
export const compressDocumentPhoto = async (uri) => {
  return compressImage(uri, CompressionPresets.DOCUMENT, { rotate: true });
};

/**
 * Compress a fund proof photo
 * Uses lower quality as exact details less critical
 *
 * @param {string} uri - Image URI
 * @returns {Promise<Object>} Compressed image result
 */
export const compressFundProofPhoto = async (uri) => {
  return compressImage(uri, CompressionPresets.PROOF, { rotate: true });
};

/**
 * Generate a thumbnail for preview
 * Uses low quality and small size for fast loading
 *
 * @param {string} uri - Image URI
 * @returns {Promise<Object>} Thumbnail result
 */
export const generateThumbnail = async (uri) => {
  return compressImage(uri, CompressionPresets.THUMBNAIL, { rotate: true });
};

/**
 * Get estimated file size reduction
 * This is approximate based on typical compression ratios
 *
 * @param {Object} preset - Compression preset
 * @returns {number} Estimated reduction percentage (0-100)
 */
export const getEstimatedReduction = (preset) => {
  const reductionMap = {
    [CompressionPresets.PASSPORT]: 60,   // ~60% smaller
    [CompressionPresets.DOCUMENT]: 70,   // ~70% smaller
    [CompressionPresets.PROOF]: 75,      // ~75% smaller
    [CompressionPresets.THUMBNAIL]: 90,  // ~90% smaller
  };

  return reductionMap[preset] || 70;
};

/**
 * Batch compress multiple images
 *
 * @param {Array<{uri: string, preset: Object}>} images - Array of images to compress
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Array<Object>>} Array of compressed results
 */
export const batchCompressImages = async (images, onProgress) => {
  const results = [];

  for (let i = 0; i < images.length; i++) {
    const { uri, preset = CompressionPresets.DOCUMENT } = images[i];

    try {
      const result = await compressImage(uri, preset);
      results.push({ success: true, ...result });
    } catch (error) {
      console.error(`[imageCompression] Failed to compress image ${i}:`, error);
      results.push({ success: false, error: error.message, uri });
    }

    if (onProgress) {
      onProgress(i + 1, images.length);
    }
  }

  return results;
};

/**
 * Helper to compress based on image type string
 *
 * @param {string} uri - Image URI
 * @param {string} type - Image type ('passport', 'document', 'proof', 'thumbnail')
 * @returns {Promise<Object>} Compressed image result
 */
export const compressByType = async (uri, type = 'document') => {
  const typeMap = {
    passport: compressPassportPhoto,
    document: compressDocumentPhoto,
    proof: compressFundProofPhoto,
    thumbnail: generateThumbnail,
  };

  const compressFunc = typeMap[type.toLowerCase()] || compressDocumentPhoto;
  return compressFunc(uri);
};

export default {
  compressImage,
  compressPassportPhoto,
  compressDocumentPhoto,
  compressFundProofPhoto,
  generateThumbnail,
  batchCompressImages,
  compressByType,
  CompressionPresets,
  calculateDimensions,
  getEstimatedReduction,
};
