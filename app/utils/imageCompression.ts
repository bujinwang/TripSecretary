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

interface CompressionPreset {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: ImageManipulator.SaveFormat;
}

interface Dimensions {
  width: number;
  height: number;
}

interface CompressOptions {
  rotate?: boolean;
  flipVertically?: boolean;
  flipHorizontally?: boolean;
}

interface ImageInfo {
  uri: string;
  width: number;
  height: number;
}

interface BatchImageItem {
  uri: string;
  preset?: CompressionPreset;
}

export const CompressionPresets: Record<string, CompressionPreset> = {
  PASSPORT: {
    maxWidth: 1200,
    maxHeight: 1600,
    quality: 0.9,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  DOCUMENT: {
    maxWidth: 1024,
    maxHeight: 1366,
    quality: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  PROOF: {
    maxWidth: 800,
    maxHeight: 1067,
    quality: 0.8,
    format: ImageManipulator.SaveFormat.JPEG,
  },
  THUMBNAIL: {
    maxWidth: 200,
    maxHeight: 200,
    quality: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
  },
};

export const calculateDimensions = (width: number, height: number, maxWidth: number, maxHeight: number): Dimensions => {
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

export const compressImage = async (uri: string, preset: CompressionPreset = CompressionPresets.DOCUMENT, options: CompressOptions = {}): Promise<ImageManipulator.ImageResult> => {
  try {
    if (!uri) {
      throw new Error('Image URI is required');
    }

    const {
      rotate = true,
      flipVertically = false,
      flipHorizontally = false,
    } = options;

    const actions: ImageManipulator.Action[] = [];

    actions.push({
      resize: {
        width: preset.maxWidth,
        height: preset.maxHeight,
      },
    });

    if (flipVertically) {
      actions.push({ flip: ImageManipulator.FlipType.Vertical });
    }

    if (flipHorizontally) {
      actions.push({ flip: ImageManipulator.FlipType.Horizontal });
    }

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

export const compressPassportPhoto = async (uri: string): Promise<ImageManipulator.ImageResult> => compressImage(uri, CompressionPresets.PASSPORT, { rotate: true });

export const compressDocumentPhoto = async (uri: string): Promise<ImageManipulator.ImageResult> => compressImage(uri, CompressionPresets.DOCUMENT, { rotate: true });

export const compressFundProofPhoto = async (uri: string): Promise<ImageManipulator.ImageResult> => compressImage(uri, CompressionPresets.PROOF, { rotate: true });

export const generateThumbnail = async (uri: string): Promise<ImageManipulator.ImageResult> => compressImage(uri, CompressionPresets.THUMBNAIL, { rotate: true });

export const getEstimatedReduction = (preset: CompressionPreset): number => {
  const reductionMap = new Map<CompressionPreset, number>([
    [CompressionPresets.PASSPORT, 60],
    [CompressionPresets.DOCUMENT, 70],
    [CompressionPresets.PROOF, 75],
    [CompressionPresets.THUMBNAIL, 90],
  ]);

  return reductionMap.get(preset) || 70;
};

export const batchCompressImages = async (images: BatchImageItem[], onProgress?: (current: number, total: number) => void): Promise<Array<{ success: boolean; error?: string; uri?: string } & Partial<ImageManipulator.ImageResult>>> => {
  const results: Array<{ success: boolean; error?: string; uri?: string } & Partial<ImageManipulator.ImageResult>> = [];

  for (let i = 0; i < images.length; i++) {
    const { uri, preset = CompressionPresets.DOCUMENT } = images[i];

    try {
      const result = await compressImage(uri, preset);
      results.push({ success: true, ...result });
    } catch (error) {
      console.error(`[imageCompression] Failed to compress image ${i}:`, error);
      results.push({ success: false, error: (error as Error).message, uri });
    }

    if (onProgress) {
      onProgress(i + 1, images.length);
    }
  }

  return results;
};

export const compressByType = async (uri: string, type = 'document'): Promise<ImageManipulator.ImageResult> => {
  const typeMap: Record<string, (uri: string) => Promise<ImageManipulator.ImageResult>> = {
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
