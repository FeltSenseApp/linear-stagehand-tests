import { defineConfig } from "vitest/config";
import os from "os";

/**
 * Resource-Aware Worker Optimizer
 * Calculates optimal workers based on 80% of available resources
 */
const MEMORY_PER_WORKER_MB = 200; // Estimated memory per vitest worker + Stagehand
const RESOURCE_THRESHOLD = 0.8;   // Use 80% of available resources
const MIN_WORKERS = 1;
const MAX_WORKERS = 10;

function calculateOptimalWorkers(): number {
  // Allow manual override
  const envWorkers = process.env.VITEST_MAX_WORKERS;
  if (envWorkers) {
    const parsed = parseInt(envWorkers, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.min(parsed, MAX_WORKERS);
    }
  }

  const freeMemoryMB = Math.round(os.freemem() / 1024 / 1024);
  const cpuCores = os.cpus().length;

  // Calculate workers based on resources (80% threshold)
  const memoryBasedWorkers = Math.floor((freeMemoryMB * RESOURCE_THRESHOLD) / MEMORY_PER_WORKER_MB);
  const cpuBasedWorkers = Math.floor(cpuCores * RESOURCE_THRESHOLD);

  // Use the lower of the two, clamped to bounds
  const workers = Math.max(MIN_WORKERS, Math.min(MAX_WORKERS, Math.min(memoryBasedWorkers, cpuBasedWorkers)));

  console.log(`[Vitest] Resource optimization: ${freeMemoryMB}MB free, ${cpuCores} CPUs → ${workers} workers`);
  return workers;
}

const OPTIMAL_WORKERS = calculateOptimalWorkers();

export default defineConfig({
  test: {
    // Increase timeout for browser automation tests
    testTimeout: 90000, // 90 seconds per test (reduced since auth is cached)
    hookTimeout: 90000,

    // Enable file parallelism with resource-aware limits
    // Workers are calculated based on 80% of available memory/CPU
    fileParallelism: OPTIMAL_WORKERS > 1,
    
    // Limit concurrent tests based on available resources
    maxConcurrency: OPTIMAL_WORKERS,
    
    // Limit worker threads based on resources
    poolOptions: {
      threads: {
        maxThreads: OPTIMAL_WORKERS,
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
