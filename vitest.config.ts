import { defineConfig } from "vitest/config";

// Check if Browserbase is configured (has session limits)
const useBrowserbase = !!(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID);

export default defineConfig({
  test: {
    // Increase timeout for browser automation tests
    testTimeout: 90000, // 90 seconds per test (reduced since auth is cached)
    hookTimeout: 90000,

    // Browserbase has concurrent session limits (often just 1)
    // Run tests sequentially when using Browserbase, parallel for local Chrome
    fileParallelism: !useBrowserbase,
    
    // Limit concurrency based on browser mode
    // Browserbase: sequential (1), Local: unlimited parallel
    maxConcurrency: useBrowserbase ? 1 : Infinity,

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
