import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'],
    clearMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.ts'],
      // Declarative Nest wiring and DTO metadata are validated by TypeScript
      // builds and application smoke tests; unit coverage tracks executable logic.
      exclude: ['src/**/*.spec.ts', 'src/main.ts', 'src/**/*.module.ts', 'src/**/dto/**'],
      thresholds: {
        statements: 99,
        branches: 98,
        functions: 99,
        lines: 100,
      },
    },
  },
});
