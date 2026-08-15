import { vi } from 'vitest';

// Compatibility bridge for the existing Jest-style mocks. Vitest intentionally
// exposes the same mock API through `vi`.
Object.defineProperty(globalThis, 'jest', {
  configurable: true,
  value: vi,
});
