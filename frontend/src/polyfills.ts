import { Buffer } from 'buffer/';

type GlobalWithNodePolyfills = typeof globalThis & {
  Buffer?: typeof Buffer;
  global?: typeof globalThis;
};

const g = globalThis as GlobalWithNodePolyfills;

if (!g.global) {
  g.global = globalThis;
}

if (!g.Buffer) {
  g.Buffer = Buffer;
}
