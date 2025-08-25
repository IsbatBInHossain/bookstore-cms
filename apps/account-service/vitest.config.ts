import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // For integration tests that share a single database container, it's safer to run them serially.
    fileParallelism: false,

    // Make the test APIs (`describe`, `it`, `expect`) available globally
    globals: true,

    // A long timeout is needed because starting a Docker container
    testTimeout: 60000,
    hookTimeout: 60000,

    // Location of setup file
    setupFiles: ['./src/test/setup.ts'],

    // Test file path
    include: ['src/**/*.test.ts'],
  },
});
