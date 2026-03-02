import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import {
  createStagehand,
  getEnvConfig,
  BASE_URL,
  TEST_TIMEOUT,
} from "../stagehand.config";
import { LoginResultSchema, loginWithAgent } from "../utils/auth";

describe("Authentication", () => {
  let stagehand: Stagehand;
  let envs: ReturnType<typeof getEnvConfig>;

  beforeAll(async () => {
    envs = getEnvConfig();
    stagehand = await createStagehand();
    // Don't use cached auth here - we're testing login itself
    await stagehand.context.clearCookies();
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (stagehand) {
      await stagehand.close();
    }
  });

  it(
    "should login successfully with valid credentials",
    async () => {
      // Use Stagehand agent-based login (no hard-coded selectors)
      const loginResult = await loginWithAgent(
        stagehand,
        envs.portalUsername,
        envs.portalPassword
      );

      expect(loginResult.sidebarVisible).toBe(true);
      expect(loginResult.errorVisible).toBe(false);
    },
    TEST_TIMEOUT
  );

  it.skip(
    "should show error message with invalid credentials",
    async () => {
      const page = stagehand.context.pages()[0];
      
      // Clear any previous auth
      await stagehand.context.clearCookies();

      // Attempt login with invalid credentials using Stagehand agent
      const result = await loginWithAgent(
        stagehand,
        "invalid@example.com",
        "wrongpassword123"
      );

      // For invalid credentials, we expect an error and no sidebar
      expect(result.sidebarVisible).toBe(false);
      expect(result.errorVisible).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should redirect to login when accessing protected route unauthenticated",
    async () => {
      const page = stagehand.context.pages()[0];

      // Clear cookies and localStorage to ensure unauthenticated state
      await stagehand.context.clearCookies();
      await page.evaluate(() => window.localStorage.clear());

      // Try to access a protected route
      await page.goto(`${BASE_URL}/founders`);
      
      // Wait for redirect to complete
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      await page.waitForTimeout(2000); // Extra wait for client-side routing

      // Use Stagehand to determine whether we're on the login page
      const redirectResult = await page.extract({
        instruction:
          "We just navigated to a protected route while unauthenticated. " +
          "Determine if we were redirected to the login page.",
        schema: z.object({
          onLoginPage: z.boolean().describe("Are we currently on the login page?"),
          loginFormVisible: z
            .boolean()
            .describe("Is a login form with email/password inputs visible?"),
        }),
      });

      expect(redirectResult.onLoginPage || redirectResult.loginFormVisible).toBe(
        true
      );
    },
    TEST_TIMEOUT
  );
});
