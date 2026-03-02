import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import {
  createStagehand,
  BASE_URL,
  TEST_TIMEOUT,
} from "../../stagehand.config";
import { ensureAuthenticated } from "../../utils/auth";
import { z } from "zod";

describe("Founder List", () => {
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
    "should display founders list",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/founders`);
      await page.waitForLoadState("networkidle");

      // Check URL is correct
      const url = page.url();
      expect(url).toContain("/founders");

      // Use Stagehand to detect founders in a list, table, or cards
      const listCheck = await page.extract({
        instruction:
          "On the founders page, determine whether any founders are visible " +
          "in a list, table, grid, or set of cards, and roughly how many.",
        schema: z.object({
          hasFounders: z
            .boolean()
            .describe("Are any founders visible in the list/table/cards?"),
          count: z
            .number()
            .describe("Approximate number of visible founders, 0 if none."),
        }),
      });

      // Page loaded and has content
      expect(listCheck.hasFounders).toBe(true);
      expect(listCheck.count).toBeGreaterThan(0);
    },
    TEST_TIMEOUT
  );

  it(
    "should have working search or filter on founders list",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/founders`);
      await page.waitForLoadState("networkidle");

      const searchCheck = await page.extract({
        instruction:
          "On the founders page, determine if there is a search or filter input " +
          "for the founders list.",
        schema: z.object({
          hasSearch: z
            .boolean()
            .describe("Is there a search or filter input for founders?"),
        }),
      });

      if (!searchCheck.hasSearch) {
        expect.fail("Founders list has no search or filter input to test.");
        return;
      }

      await page.act('Type "test" into the founders search or filter input');
      await page.waitForTimeout(500);
      await page.waitForLoadState("networkidle");

      const afterSearch = await page.extract({
        instruction:
          "After typing in the search/filter, did the list update (e.g. filtered results, or search applied)?",
        schema: z.object({
          searchApplied: z
            .boolean()
            .describe("Did the search or filter appear to be applied (list updated or filtered)?"),
        }),
      });
      expect(afterSearch.searchApplied).toBe(true);
    },
    TEST_TIMEOUT
  );
});
