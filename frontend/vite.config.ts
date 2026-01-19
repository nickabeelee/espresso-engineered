import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const testConditions = mode === 'test' ? ['browser', 'development'] : [];

  return {
    plugins: [sveltekit()],
    test: {
      include: ['src/**/*.{test,spec}.{js,ts}'],
      environment: 'jsdom',
      setupFiles: ['src/test/setup.ts'],
      globals: true
    },
    resolve: {
      alias: {
        '@shared': '../shared'
      },
      ...(testConditions.length > 0 ? { conditions: testConditions } : {})
    }
  };
});
