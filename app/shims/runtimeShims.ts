import type { TextDecoder as NodeTextDecoder, TextEncoder as NodeTextEncoder } from 'util';

type Base64Converter = (input: string) => string;

type ShimmedGlobal = typeof global & {
  atob?: Base64Converter;
  btoa?: Base64Converter;
  TextEncoder?: NodeTextEncoder;
  TextDecoder?: NodeTextDecoder;
  CryptoKey?: unknown;
};

const globalScope = global as ShimmedGlobal;

const isDefined = <T>(value: T | undefined | null): value is T =>
  value !== undefined && value !== null;

const installAtob = () => {
  if (!isDefined(globalScope.atob)) {
    globalScope.atob = (data: string): string => Buffer.from(data, 'base64').toString('binary');
  }
};

const installBtoa = () => {
  if (!isDefined(globalScope.btoa)) {
    globalScope.btoa = (data: string): string => Buffer.from(data, 'binary').toString('base64');
  }
};

const installTextEncoder = () => {
  if (!isDefined(globalScope.TextEncoder)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TextEncoder } = require('util') as { TextEncoder: NodeTextEncoder };
    globalScope.TextEncoder = TextEncoder;
  }
};

const installTextDecoder = () => {
  if (!isDefined(globalScope.TextDecoder)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { TextDecoder } = require('util') as { TextDecoder: NodeTextDecoder };
    globalScope.TextDecoder = TextDecoder;
  }
};

const installCryptoKey = () => {
  const existing = Reflect.get(globalScope as Record<string, unknown>, 'CryptoKey');
  if (!isDefined(existing)) {
    class ShimCryptoKey {
      algorithm: Record<string, unknown> = {};
      extractable = false;
      type: 'secret' | 'private' | 'public' = 'secret';
      usages: string[] = [];
    }
    Reflect.set(globalScope as Record<string, unknown>, 'CryptoKey', ShimCryptoKey);
  }
};

export const installGlobalRuntimeShims = (): void => {
  installAtob();
  installBtoa();
  installTextEncoder();
  installTextDecoder();
  installCryptoKey();
};

installGlobalRuntimeShims();
