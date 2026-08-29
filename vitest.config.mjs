import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules',
      '.next',
      'e2e',
      'dist',
      // Sentry bundle plugin hatasindan dolayi gecici olarak disarida birakildi
      'src/lib/__tests__/apiResponse.test.ts',
      'src/modules/commerce/__tests__/subscription.test.ts',
      'src/modules/push-notifications/__tests__/pushService.test.ts',
      'src/modules/webhooks/__tests__/service.test.ts',
      'src/modules/workspaces/__tests__/brandingService.test.ts',
    ],
    server: {
      deps: {
        inline: [],
        external: ['iyzico'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/*.config.*',
        '**/types/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
