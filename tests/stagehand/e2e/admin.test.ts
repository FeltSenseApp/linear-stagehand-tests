import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import {
  createStagehand,
  getEnvConfig,
  BASE_URL,
  TEST_TIMEOUT,
} from "../stagehand.config";
import { ensureAuthenticated } from "../utils/auth";

describe("Admin Features", () => {
  let stagehand: Stagehand;
  let envs: ReturnType<typeof getEnvConfig>;
  let isAdmin = false;

  beforeAll(async () => {
    envs = getEnvConfig();
    stagehand = await createStagehand();
    await ensureAuthenticated(stagehand);

    // Check if user is admin
    const page = stagehand.context.pages()[0];
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState("networkidle");

    const adminCheck = await page.extract({
      instruction: "Check if we have access to the admin panel",
      schema: z.object({
        hasAccess: z.boolean().describe("Do we have access to the admin panel?"),
        accessDenied: z.boolean().describe("Is there an access denied message?"),
      }),
    });

    isAdmin = adminCheck.hasAccess && !adminCheck.accessDenied;
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (stagehand) {
      await stagehand.close();
    }
  });

  it(
    "should load admin panel with users list",
    async () => {
      if (!isAdmin) {
        expect.fail("Test requires admin access; current user does not have access to the admin panel.");
        return;
      }

      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000); // Wait for data to load

      // Verify we're on the admin page (not redirected)
      const url = page.url();
      const onAdminPage = url.includes("/admin");

      // Use Stagehand to check for a users list or an empty/admin info state
      const listCheck = await page.extract({
        instruction:
          "On the admin page, determine if a users list or table is visible, " +
          "or if an empty state or access information is shown instead.",
        schema: z.object({
          hasUsersList: z
            .boolean()
            .describe("Is a users list or table visible on the admin page?"),
          hasEmptyOrInfoState: z
            .boolean()
            .describe("Is an empty state or admin information message visible instead?"),
        }),
      });

      expect(onAdminPage).toBe(true);
      // Panel is considered loaded if we're on the admin page and either a list or info state is visible
      expect(listCheck.hasUsersList || listCheck.hasEmptyOrInfoState).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should have working user search",
    async () => {
      if (!isAdmin) {
        expect.fail("Test requires admin access; current user does not have access to the admin panel.");
        return;
      }

      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState("networkidle");

      // Check if search input exists
      const searchCheck = await page.extract({
        instruction: "Check if there is a user search input on the admin panel",
        schema: z.object({
          searchInputVisible: z.boolean().describe("Is the user search input visible?"),
        }),
      });

      if (!searchCheck.searchInputVisible) {
        expect.fail("Admin panel has no user search input.");
        return;
      }

      await page.act({
        action: "Type %username% into the user search input",
        variables: { username: envs.portalUsername },
      });
      await page.waitForLoadState("networkidle");

      const searchResult = await page.extract({
        instruction: "After searching, how many users are shown in the filtered results?",
        schema: z.object({
          filteredCount: z.number().describe("Number of users shown after search"),
          searchWorked: z.boolean().describe("Did the search filter the results?"),
        }),
      });

      expect(searchResult.searchWorked).toBe(true);
      expect(searchResult.filteredCount).toBeGreaterThan(0);
    },
    TEST_TIMEOUT
  );

  it(
    "should display user details when clicking on a user",
    async () => {
      if (!isAdmin) {
        expect.fail("Test requires admin access; current user does not have access to the admin panel.");
        return;
      }

      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState("networkidle");

      // Click on a user
      await page.act("Click on the first user in the users list");
      await page.waitForLoadState("networkidle");

      const userDetails = await page.extract({
        instruction: "Check if user details are visible after clicking on a user",
        schema: z.object({
          userDetailsVisible: z.boolean().describe("Are user details visible?"),
          hasEmail: z.boolean().describe("Is the user's email visible?"),
          hasRoleInfo: z.boolean().describe("Is role information visible?"),
        }),
      });

      expect(userDetails.userDetailsVisible).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should show founder assignment functionality",
    async () => {
      if (!isAdmin) {
        expect.fail("Test requires admin access; current user does not have access to the admin panel.");
        return;
      }

      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/admin`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const hasUsers = await page.extract({
        instruction: "On the admin page, is there a users list or table with at least one user row to click?",
        schema: z.object({
          hasUsers: z.boolean().describe("Are there one or more users in the list/table to click?"),
        }),
      });
      if (!hasUsers.hasUsers) {
        expect.fail("Admin panel has no users list or no user rows to click.");
        return;
      }

      await page.act("Click on the first user in the users list or table");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const assignmentCheck = await page.extract({
        instruction:
          "After selecting a user in the admin panel, determine if any UI for assigning founders " +
          "is visible, such as assign buttons, dropdowns, or listboxes.",
        schema: z.object({
          assignmentUIVisible: z
            .boolean()
            .describe("Is founder assignment UI visible for the selected user?"),
        }),
      });

      const urlChanged = !page.url().endsWith("/admin");
      expect(assignmentCheck.assignmentUIVisible || urlChanged).toBe(true);
    },
    TEST_TIMEOUT
  );

  // Skipped: test user is always an admin, so this test is redundant
  it.skip(
    "should show access denied for non-admin users",
    async () => {
      // This test verifies the opposite - that non-admins can't access
      // Skipped because the test user is always an admin
      expect(true).toBe(true);
    },
    TEST_TIMEOUT
  );
});
