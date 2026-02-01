import os from "os";

/**
 * Resource-aware worker optimizer
 * Calculates optimal number of workers based on available system resources
 */

// Estimated memory per vitest worker with Stagehand SDK connection
const MEMORY_PER_WORKER_MB = 200;

// Target resource utilization (80% threshold)
const RESOURCE_THRESHOLD = 0.8;

// Minimum and maximum workers
const MIN_WORKERS = 1;
const MAX_WORKERS = 10;

export interface ResourceInfo {
  totalMemoryMB: number;
  freeMemoryMB: number;
  cpuCores: number;
  recommendedWorkers: number;
  memoryBasedWorkers: number;
  cpuBasedWorkers: number;
}

/**
 * Get current system resources and calculate optimal worker count
 */
export function getResourceInfo(): ResourceInfo {
  const totalMemoryMB = Math.round(os.totalmem() / 1024 / 1024);
  const freeMemoryMB = Math.round(os.freemem() / 1024 / 1024);
  const cpuCores = os.cpus().length;

  // Calculate workers based on available memory (80% threshold)
  const availableMemoryMB = freeMemoryMB * RESOURCE_THRESHOLD;
  const memoryBasedWorkers = Math.floor(availableMemoryMB / MEMORY_PER_WORKER_MB);

  // Calculate workers based on CPU cores (80% threshold)
  const cpuBasedWorkers = Math.floor(cpuCores * RESOURCE_THRESHOLD);

  // Use the lower of the two to avoid bottlenecks
  const calculatedWorkers = Math.min(memoryBasedWorkers, cpuBasedWorkers);

  // Clamp to min/max bounds
  const recommendedWorkers = Math.max(MIN_WORKERS, Math.min(MAX_WORKERS, calculatedWorkers));

  return {
    totalMemoryMB,
    freeMemoryMB,
    cpuCores,
    recommendedWorkers,
    memoryBasedWorkers,
    cpuBasedWorkers,
  };
}

/**
 * Get optimal worker count for current environment
 * Respects VITEST_MAX_WORKERS env var if set
 */
export function getOptimalWorkerCount(): number {
  // Allow manual override via env var
  const envWorkers = process.env.VITEST_MAX_WORKERS;
  if (envWorkers) {
    const parsed = parseInt(envWorkers, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.min(parsed, MAX_WORKERS);
    }
  }

  const resources = getResourceInfo();
  return resources.recommendedWorkers;
}

/**
 * Log resource information for debugging
 */
export function logResourceInfo(): void {
  const info = getResourceInfo();
  console.log(`
┌─────────────────────────────────────────────────────┐
│           Resource-Aware Worker Optimizer           │
├─────────────────────────────────────────────────────┤
│  Total Memory:     ${String(info.totalMemoryMB).padStart(6)} MB                      │
│  Free Memory:      ${String(info.freeMemoryMB).padStart(6)} MB                      │
│  CPU Cores:        ${String(info.cpuCores).padStart(6)}                           │
├─────────────────────────────────────────────────────┤
│  Memory-based:     ${String(info.memoryBasedWorkers).padStart(6)} workers (${MEMORY_PER_WORKER_MB}MB each)    │
│  CPU-based:        ${String(info.cpuBasedWorkers).padStart(6)} workers (80% of cores)   │
├─────────────────────────────────────────────────────┤
│  Recommended:      ${String(info.recommendedWorkers).padStart(6)} workers                    │
└─────────────────────────────────────────────────────┘
  `);
}
