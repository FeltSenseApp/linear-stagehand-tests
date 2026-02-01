import { defineConfig } from "vitest/config";
import * as fs from "fs";

/**
 * Container-Aware Worker Optimizer
 * 
 * In containerized environments (Kubernetes/Sevalla), os.totalmem() returns
 * the HOST memory, not the container's cgroup limit. We need to read from
 * /sys/fs/cgroup to get the actual container memory limit.
 */
const MEMORY_PER_WORKER_MB = 250; // Estimated memory per vitest worker + Stagehand
const RESOURCE_THRESHOLD = 0.8;   // Use 80% of available resources
const MIN_WORKERS = 1;
const MAX_WORKERS = 3;            // Cap at 3 to be safe in containers

/**
 * Get container memory limit (cgroup v2 or v1)
 * Falls back to a conservative default if not in a container
 */
function getContainerMemoryMB(): number {
  try {
    // Try cgroup v2 first (newer systems)
    const cgroupV2Path = "/sys/fs/cgroup/memory.max";
    if (fs.existsSync(cgroupV2Path)) {
      const value = fs.readFileSync(cgroupV2Path, "utf-8").trim();
      if (value !== "max") {
        return Math.round(parseInt(value, 10) / 1024 / 1024);
      }
    }

    // Try cgroup v1 (older systems)
    const cgroupV1Path = "/sys/fs/cgroup/memory/memory.limit_in_bytes";
    if (fs.existsSync(cgroupV1Path)) {
      const value = parseInt(fs.readFileSync(cgroupV1Path, "utf-8").trim(), 10);
      // Check if it's not the "unlimited" value
      if (value < 9223372036854771712) {
        return Math.round(value / 1024 / 1024);
      }
    }
  } catch {
    // Ignore errors reading cgroup
  }

  // Default: assume 1GB container (S1 pod size)
  return 1024;
}

function calculateOptimalWorkers(): number {
  // Allow manual override
  const envWorkers = process.env.VITEST_MAX_WORKERS;
  if (envWorkers) {
    const parsed = parseInt(envWorkers, 10);
    if (!isNaN(parsed) && parsed > 0) {
      console.log(`[Vitest] Using manual override: ${parsed} workers`);
      return Math.min(parsed, MAX_WORKERS);
    }
  }

  const containerMemoryMB = getContainerMemoryMB();
  
  // Calculate workers based on container memory (80% threshold)
  const availableMemoryMB = containerMemoryMB * RESOURCE_THRESHOLD;
  const workers = Math.max(MIN_WORKERS, Math.min(MAX_WORKERS, Math.floor(availableMemoryMB / MEMORY_PER_WORKER_MB)));

  console.log(`[Vitest] Container memory: ${containerMemoryMB}MB → ${workers} worker(s)`);
  return workers;
}

const OPTIMAL_WORKERS = calculateOptimalWorkers();

export default defineConfig({
  test: {
    // Increase timeout for browser automation tests
    testTimeout: 90000, // 90 seconds per test (reduced since auth is cached)
    hookTimeout: 90000,

    // Enable file parallelism only if we have resources for it
    fileParallelism: OPTIMAL_WORKERS > 1,
    
    // Limit concurrent tests based on container resources
    maxConcurrency: OPTIMAL_WORKERS,
    
    // Vitest 4: Use top-level pool options instead of nested poolOptions
    maxWorkers: OPTIMAL_WORKERS,
    minWorkers: 1,

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
