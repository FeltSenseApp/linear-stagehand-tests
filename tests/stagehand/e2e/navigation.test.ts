import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import {
  createStagehand,
  BASE_URL,
  TEST_TIMEOUT,
} from "../stagehand.config";
import { ensureAuthenticated } from "../utils/auth";
import { z } from "zod";

describe("Dashboard & Navigation", () => {
  let stagehand: Stagehand;

  beforeAll(async () => {
    stagehand = await createStagehand();
    await ensureAuthenticated(stagehand);
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (stagehand) {
      await stagehand.close();
    }
  });

  it(
    "should load dashboard after login",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      // Verify we're not on login page
      const url = page.url();
      expect(url).not.toContain("/login");

      // Use Stagehand to verify sidebar/navigation is visible
      const navCheck = await page.extract({
        instruction:
          "On the current page, determine if a sidebar or main navigation is visible.",
        schema: z.object({
          hasNavigation: z
            .boolean()
            .describe("Is a sidebar or main navigation visible?"),
        }),
      });

      expect(navCheck.hasNavigation).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should navigate to Founders page",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/founders`);
      await page.waitForLoadState("networkidle");

      const url = page.url();
      expect(url).toContain("/founders");

      const pageCheck = await page.extract({
        instruction: "On the founders page, is the main content (list, table, or cards) visible?",
        schema: z.object({
          contentVisible: z.boolean().describe("Is the main founders page content visible?"),
        }),
      });
      expect(pageCheck.contentVisible).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should navigate to Ideas page",
    async () => {
      const page = stagehand.context.pages()[0];
      
      // Direct navigation
      await page.goto(`${BASE_URL}/ideas`);
      await page.waitForLoadState("networkidle");

      // Verify URL
      const url = page.url();
      expect(url).toContain("/ideas");

      // Use Stagehand to confirm a main header/title is visible
      const headerCheck = await page.extract({
        instruction:
          "On the ideas page, determine if a main page title or header is visible.",
        schema: z.object({
          hasHeader: z
            .boolean()
            .describe("Is a main header or title visible on the ideas page?"),
        }),
      });

      expect(headerCheck.hasHeader).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should navigate to Admin page",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState("networkidle");

      const url = page.url();
      // Must be on admin page or redirected to login (access control)
      expect(url.includes("/admin") || url.includes("/login")).toBe(true);
      if (url.includes("/admin")) {
        const adminCheck = await page.extract({
          instruction: "On the admin page, is admin content (users list, panel, or access message) visible?",
          schema: z.object({
            adminContentVisible: z.boolean().describe("Is admin panel content visible?"),
          }),
        });
        expect(adminCheck.adminContentVisible).toBe(true);
      }
    },
    TEST_TIMEOUT
  );

  it(
    "should navigate to Traces page",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/traces`);
      await page.waitForLoadState("networkidle");

      const url = page.url();
      // Must be on traces page or redirected (e.g. to login)
      expect(url.includes("/traces") || url.includes("/login")).toBe(true);
      if (url.includes("/traces")) {
        const tracesCheck = await page.extract({
          instruction: "On the traces page, is traces content (list, overview, or access message) visible?",
          schema: z.object({
            tracesContentVisible: z.boolean().describe("Is traces page content visible?"),
          }),
        });
        expect(tracesCheck.tracesContentVisible).toBe(true);
      }
    },
    TEST_TIMEOUT
  );
});
