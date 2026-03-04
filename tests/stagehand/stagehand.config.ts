import { Stagehand } from "@browserbasehq/stagehand";
import dotenv from "dotenv";
import path from "path";

// Load environment variables - explicitly specify path for spawned processes
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export interface EnvConfig {
  portalUsername: string;
  portalPassword: string;
  openaiApiKey: string;
}

/**
 * Get environment variables required for testing
 */
export function getEnvConfig(): EnvConfig {
  const portalUsername = process.env.PORTAL_USERNAME;
  const portalPassword = process.env.PORTAL_PASSWORD;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (!portalUsername || !portalPassword) {
    throw new Error("PORTAL_USERNAME and PORTAL_PASSWORD environment variables are required");
  }

  if (!openaiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }

  return {
    portalUsername,
    portalPassword,
    openaiApiKey,
  };
}

/**
 * Check if Browserbase is configured for cloud browser automation
 */
export function useBrowserbase(): boolean {
  return !!(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID);
}

/**
 * Verbosity for Stagehand logging (see https://docs.stagehand.dev/configuration/logging):
 * - 0: Errors only
 * - 1: Info — act/extract started and completed
 * - 2: Debug — DOM snapshots, element counts, LLM inference details
 * Set STAGEHAND_VERBOSE=1 or STAGEHAND_VERBOSE=2 when running tests for tracing.
 */
function getVerbose(): 0 | 1 | 2 {
  const v = process.env.STAGEHAND_VERBOSE;
  if (v === "2") return 2;
  if (v === "1") return 1;
  return 0;
}

/**
 * Creates and initializes a Stagehand instance for testing.
 * Uses Browserbase in production, local Chrome in development.
 */
export async function createStagehand(): Promise<Stagehand> {
  const cloudMode = useBrowserbase();
  
  const stagehand = new Stagehand({
    env: cloudMode ? "BROWSERBASE" : "LOCAL",
    verbose: getVerbose(),
    // Optional: set logInferenceToFile: true to write LLM request/response dumps to ./inference_summary/ (dev only)
    ...(process.env.STAGEHAND_LOG_INFERENCE === "1" ? { logInferenceToFile: true } : {}),
    // Optional: set BROWSERBASE_CONFIG_DIR=~/.config/browserbase for session logs (llm_events.log, cdp_events.log, stagehand.log)
    ...(cloudMode ? {
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
    } : {
      localBrowserLaunchOptions: {
        headless: true,
      },
    }),
  });

  try {
    // Add timeout to prevent hanging on Browserbase connection issues
    const INIT_TIMEOUT_MS = 60000; // 60 seconds
    
    const initPromise = stagehand.init();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Stagehand init timed out after ${INIT_TIMEOUT_MS / 1000}s`)), INIT_TIMEOUT_MS);
    });
    
    await Promise.race([initPromise, timeoutPromise]);
  } catch (initError) {
    const errorMessage = initError instanceof Error ? initError.message : String(initError);
    
    // Handle timeout
    if (errorMessage.includes("timed out")) {
      throw new Error(
        "Stagehand initialization timed out. " +
        "This could be due to Browserbase service issues or network problems. " +
        "Check https://www.browserbase.com/status for service status."
      );
    }
    
    // Handle Browserbase concurrent session limit
    if (errorMessage.includes("429") || errorMessage.includes("concurrent sessions")) {
      throw new Error(
        "Browserbase concurrent session limit reached. " +
        "Either wait for existing sessions to timeout, " +
        "close them at https://www.browserbase.com/sessions, " +
        "or remove BROWSERBASE_* env vars to use local Chrome."
      );
    }
    
    throw initError;
  }

  return stagehand;
}

/**
 * Base URL for the application under test
 */
export const BASE_URL = process.env.PORTAL_URL || "http://localhost:5173";

/**
 * AI Model to use for Stagehand operations
 * gpt-4.1-mini is faster and smarter than gpt-4o-mini with 1M context window
 */
export const AI_MODEL = "openai/gpt-4.1-mini";

/**
 * Test timeout for browser automation tests (in milliseconds)
 * Reduced since we're using faster model and cached auth
 */
export const TEST_TIMEOUT = 60000; // 60 seconds per test
