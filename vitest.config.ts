import { defineConfig } from "vitest/config";

// Limit parallelism to prevent memory issues on deployed servers
// Each test file creates a vitest worker + Stagehand connection
const MAX_WORKERS = parseInt(process.env.VITEST_MAX_WORKERS || "1", 10);

export default defineConfig({
  test: {
    // Increase timeout for browser automation tests
    testTimeout: 90000, // 90 seconds per test (reduced since auth is cached)
    hookTimeout: 90000,

    // IMPORTANT: Disable file parallelism to prevent memory issues
    // Each parallel worker consumes memory for vitest + Stagehand SDK
    fileParallelism: false,
    
    // Limit concurrent tests within a file
    maxConcurrency: MAX_WORKERS,
    
    // Limit worker threads to prevent memory exhaustion
    poolOptions: {
      threads: {
        maxThreads: MAX_WORKERS,
        minThreads: 1,
      },
    },

    // Include test files
    include: ["tests/**/*.test.ts"],

    // Global setup - logs in once and caches cookies
    globalSetup: ["tests/stagehand/global-setup.ts"],

    // Verbose reporter - shows test names as they run with timing
    reporters: ["verbose"],

    // Highlight tests that take longer than 10 seconds
    slowTestThreshold: 10000,

    // Show failures immediately as they happen (not just at end)
    printConsoleTrace: true,

    // Retry failed tests once (helpful for flaky browser tests)
    retry: 1,

    // Environment setup
    env: {
      NODE_ENV: "test",
    },
  },
});
