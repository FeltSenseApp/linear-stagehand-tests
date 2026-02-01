import os from "os";
import * as fs from "fs";

/**
 * Container-aware resource optimizer
 * Reads cgroup limits in containerized environments (Kubernetes/Sevalla)
 * Falls back to OS values for local development
 */

// Estimated memory per vitest worker with Stagehand SDK connection
const MEMORY_PER_WORKER_MB = 250;

// Target resource utilization (80% threshold)
const RESOURCE_THRESHOLD = 0.8;

// Minimum and maximum workers
const MIN_WORKERS = 1;
const MAX_WORKERS = 3;

export interface ResourceInfo {
  containerMemoryMB: number;
  hostMemoryMB: number;
  isContainer: boolean;
  recommendedWorkers: number;
}

/**
 * Get container memory limit from cgroups
 * Returns null if not in a container
 */
function getContainerMemoryMB(): number | null {
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

  return null;
}

/**
 * Get current system resources and calculate optimal worker count
 */
export function getResourceInfo(): ResourceInfo {
  const hostMemoryMB = Math.round(os.totalmem() / 1024 / 1024);
  const containerMemory = getContainerMemoryMB();
  const isContainer = containerMemory !== null;
  
  // Use container limit if available, otherwise use host memory with a conservative cap
  const effectiveMemoryMB = containerMemory ?? Math.min(hostMemoryMB, 2048);

  // Calculate workers based on available memory (80% threshold)
  const availableMemoryMB = effectiveMemoryMB * RESOURCE_THRESHOLD;
  const workers = Math.floor(availableMemoryMB / MEMORY_PER_WORKER_MB);

  // Clamp to min/max bounds
  const recommendedWorkers = Math.max(MIN_WORKERS, Math.min(MAX_WORKERS, workers));

  return {
    containerMemoryMB: containerMemory ?? effectiveMemoryMB,
    hostMemoryMB,
    isContainer,
    recommendedWorkers,
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
  const envType = info.isContainer ? "Container" : "Host";
  console.log(`  → ${envType} memory: ${info.containerMemoryMB}MB → ${info.recommendedWorkers} worker(s)`);
}
