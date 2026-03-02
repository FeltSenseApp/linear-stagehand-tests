import { Stagehand } from "@browserbasehq/stagehand";
import * as path from "path";
import dotenv from "dotenv";
import { seedDemoProfile } from "./utils/seed-profile";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Global setup - runs once before all tests.
 * Performs a fresh login every time (no cached auth).
 */
export async function setup() {
  console.log("\n🔧 Global Setup: Initializing browser and logging in...\n");
  // Make sure the demo profile exists for the auth user
  console.log("  → Seeding Supabase demo profile...");
  await seedDemoProfile();

  const portalUrl = process.env.PORTAL_URL || "http://localhost:5173";
  const username = process.env.PORTAL_USERNAME;
  const password = process.env.PORTAL_PASSWORD;

  if (!username || !password) {
    throw new Error("PORTAL_USERNAME and PORTAL_PASSWORD are required");
  }

  // Always log in fresh
  // Use Browserbase for cloud deployments, local Chrome for development
  const useBrowserbase = !!(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID);
  
  if (useBrowserbase) {
    console.log("  → Using Browserbase for cloud browser automation");
  }

  const stagehand = new Stagehand({
    env: useBrowserbase ? "BROWSERBASE" : "LOCAL",
    verbose: 0,
    ...(useBrowserbase ? {
      apiKey: process.env.BROWSERBASE_API_KEY,
      projectId: process.env.BROWSERBASE_PROJECT_ID,
    } : {
      localBrowserLaunchOptions: {
        headless: true,
      },
    }),
  });
  
  let initialized = false;

  try {
    // Add timeout to prevent hanging on Browserbase connection issues
    const INIT_TIMEOUT_MS = 60000; // 60 seconds
    console.log("  → Initializing Stagehand...");
    
    const initPromise = stagehand.init();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Stagehand init timed out after ${INIT_TIMEOUT_MS / 1000}s`)), INIT_TIMEOUT_MS);
    });
    
    await Promise.race([initPromise, timeoutPromise]);
    initialized = true;
    console.log("  → Stagehand initialized successfully");
    
    const page = stagehand.context.pages()[0];

    // Navigate to login
    await page.goto(`${portalUrl}/login`, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    // Use act() for self-healing login
    console.log("  → Filling login form (act)...");
    await page.act({
      action: "type %username% into the email input field",
      variables: { username },
    });
    await page.act({
      action: "type %password% into the password field",
      variables: { password },
    });
    console.log("  → Submitting login form...");
    await page.act("click the login button");

    // Wait for navigation
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Extra wait for auth to settle

    // Verify login succeeded
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      console.log("  ✗ Login failed - still on login page");
      throw new Error("Global setup login failed - check credentials");
    }

    console.log(`  ✓ Logged in successfully\n`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Handle Browserbase concurrent session limit
    if (errorMessage.includes("429") || errorMessage.includes("concurrent sessions") || errorMessage.includes("rate limit")) {
      console.error("\n❌ Browserbase error!");
      console.error(`   ${errorMessage}`);
      console.error("   Options:");
      console.error("   1. Wait for existing sessions to timeout (usually 5-10 min)");
      console.error("   2. Close sessions at https://www.browserbase.com/sessions");
      console.error("   3. Remove BROWSERBASE_* env vars to use local Chrome\n");
      // Don't re-throw - let the process exit gracefully
      throw new Error("Browserbase session limit or rate limit reached");
    }
    
    throw error;
  } finally {
    // Only close if stagehand was successfully initialized
    if (initialized) {
      try {
        await stagehand.close();
      } catch (closeError) {
        console.warn("  ⚠ Error closing stagehand:", closeError);
      }
    }
  }
}

/**
 * Global teardown - runs once after all tests
 */
export async function teardown() {
  console.log("\n🧹 Global Teardown: Cleaning up...\n");
}
