declare module 'expo-file-system' {
  export const documentDirectory: string | null;
  export const cacheDirectory: string | null;
  export const EncodingType: {
    readonly UTF8: 'utf8';
    readonly Base64: 'base64';
  };

  type EncodingTypeValue = (typeof EncodingType)[keyof typeof EncodingType];

  export interface FileInfo {
    exists: boolean;
    isDirectory?: boolean;
    size?: number;
    modificationTime?: number;
    md5?: string | null;
    uri?: string;
  }

  export function readAsStringAsync(uri: string, options?: { encoding?: EncodingTypeValue }): Promise<string>;
  export function writeAsStringAsync(uri: string, data: string | Uint8Array | ArrayBuffer, options?: { encoding?: EncodingTypeValue }): Promise<void>;
  export function getInfoAsync(uri: string): Promise<FileInfo>;
  export function makeDirectoryAsync(uri: string, options?: { intermediates?: boolean }): Promise<void>;
  export function readDirectoryAsync(uri: string): Promise<string[]>;
  export function deleteAsync(uri: string, options?: { idempotent?: boolean }): Promise<void>;
  export function copyAsync(options: { from: string; to: string }): Promise<void>;
  export function moveAsync(options: { from: string; to: string }): Promise<void>;
  export function downloadAsync(uri: string, fileUri: string, options?: { headers?: Record<string, string> }): Promise<{ uri: string; status?: number; headers?: Record<string, string>; md5?: string | null }>;

  export const Paths: {
    readonly document: string;
    readonly cache: string;
    readonly temporary?: string;
  };

  export class File {
    constructor(uri: string, relativePath?: string);
    readonly uri: string;
    readonly path: string;
    readonly name: string;
    size?: number | null;
    exists(): Promise<boolean>;
    create(): Promise<void>;
    delete(options?: { idempotent?: boolean }): Promise<void>;
    copy(destinationUri: string): Promise<void>;
    text(options?: { encoding?: EncodingTypeValue }): Promise<string>;
    base64(): Promise<string>;
    write(data: string | Uint8Array | ArrayBuffer, options?: { encoding?: EncodingTypeValue }): Promise<void>;
  }

  export class Directory {
    constructor(rootUri: string, relativePath?: string);
    readonly uri: string;
    readonly path: string;
    exists(): Promise<boolean>;
    create(options?: { intermediates?: boolean }): Promise<void>;
    delete(options?: { idempotent?: boolean }): Promise<void>;
    list(): Promise<File[]>;
  }
}

declare module 'expo-file-system/legacy' {
  export * from 'expo-file-system';
}

declare module 'expo-media-library' {
  export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

  export interface PermissionResponse {
    status: PermissionStatus;
    granted?: boolean;
    canAskAgain?: boolean;
    expires?: 'never' | string;
  }

  export interface Asset {
    id: string;
    uri?: string;
    filename?: string;
    mediaType?: string;
  }

  export interface Album {
    id: string;
    title?: string | null;
    assetCount?: number;
  }

  export function requestPermissionsAsync(writeOnly?: boolean): Promise<PermissionResponse>;
  export function getPermissionsAsync(writeOnly?: boolean): Promise<PermissionResponse>;
  export function createAssetAsync(localUri: string): Promise<Asset>;
  export function createAlbumAsync(name: string, asset: Asset, copyAsset?: boolean): Promise<Album | null>;
  export function getAlbumAsync(name: string): Promise<Album | null>;
  export function addAssetsToAlbumAsync(assets: Asset | Asset[], album: Album, copyAssets?: boolean): Promise<void>;

  export const MediaLibrary: {
    requestPermissionsAsync: typeof requestPermissionsAsync;
    getPermissionsAsync: typeof getPermissionsAsync;
    createAssetAsync: typeof createAssetAsync;
    createAlbumAsync: typeof createAlbumAsync;
    getAlbumAsync: typeof getAlbumAsync;
    addAssetsToAlbumAsync: typeof addAssetsToAlbumAsync;
  };

  export default MediaLibrary;
}

declare module 'expo-camera' {
  import type * as React from 'react';

  export type CameraTypeValue = 'front' | 'back';
  export const CameraType: {
    readonly front: CameraTypeValue;
    readonly back: CameraTypeValue;
  };

  export interface PermissionResponse {
    status: 'granted' | 'denied' | 'undetermined';
    granted?: boolean;
    canAskAgain?: boolean;
    expires?: 'never' | string;
  }

  export interface TakePictureOptions {
    quality?: number;
    base64?: boolean;
    skipProcessing?: boolean;
  }

  export class Camera extends React.Component<any> {
    static requestCameraPermissionsAsync(): Promise<PermissionResponse>;
    static getAvailableCameraTypesAsync(): Promise<CameraTypeValue[]>;
    takePictureAsync(options?: TakePictureOptions): Promise<{ uri: string; width?: number; height?: number; base64?: string }>;
  }
}

declare module 'expo-sharing' {
  export interface SharingShareOptions {
    dialogTitle?: string;
    mimeType?: string;
    UTI?: string;
    excludedActivityTypes?: string[];
    title?: string;
  }

  export interface SharingShareResult {
    action: 'sharedAction' | 'dismissedAction';
    activityType?: string | null;
  }

  export function isAvailableAsync(): Promise<boolean>;
  export function shareAsync(url: string, options?: SharingShareOptions): Promise<void | SharingShareResult>;
}

declare const atob: (data: string) => string;
declare const btoa: (data: string) => string;

interface TextEncoder {
  encode(input?: string): Uint8Array;
}

interface TextDecoder {
  decode(input?: ArrayBufferView | ArrayBuffer | null): string;
}

declare const TextEncoder: {
  prototype: TextEncoder;
  new (): TextEncoder;
};

declare const TextDecoder: {
  prototype: TextDecoder;
  new (label?: string, options?: { fatal?: boolean; ignoreBOM?: boolean }): TextDecoder;
};

interface CryptoKey {}
