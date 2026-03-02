import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import {
  createStagehand,
  BASE_URL,
  TEST_TIMEOUT,
} from "../stagehand.config";
import { z } from "zod";
import { ensureAuthenticated } from "../utils/auth";

describe("Product Ideas", () => {
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
    "should load ideas page",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/ideas`);
      await page.waitForLoadState("networkidle");

      // Verify URL
      const url = page.url();
      expect(url).toContain("/ideas");

      // Use Stagehand to verify a main header/title is visible
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
    "should display idea cards or list",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/ideas`);
      await page.waitForLoadState("networkidle");

      // Use Stagehand to detect idea cards/list items or an empty state
      const ideasCheck = await page.extract({
        instruction:
          "On the ideas page, check whether there are any idea cards or list items visible, " +
          "or if an explicit empty state message is shown instead.",
        schema: z.object({
          hasIdeas: z
            .boolean()
            .describe("Are any idea cards or list items visible?"),
          hasEmptyState: z
            .boolean()
            .describe("Is an empty-state message visible instead of ideas?"),
        }),
      });

      // Either ideas are shown or an empty state is displayed
      expect(ideasCheck.hasIdeas || ideasCheck.hasEmptyState).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should have sort or filter options",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/ideas`);
      await page.waitForLoadState("networkidle");

      const controlsCheck = await page.extract({
        instruction:
          "On the ideas page, determine if there are any sort or filter controls " +
          "such as dropdowns or buttons labeled Sort or Filter.",
        schema: z.object({
          hasSortOrFilter: z
            .boolean()
            .describe("Is any sort or filter control visible?"),
        }),
      });

      expect(controlsCheck.hasSortOrFilter).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should allow clicking on idea cards",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/ideas`);
      await page.waitForLoadState("networkidle");

      const actions = await page.observe(
        "Find the first idea card in the list below the stats (not the Ideas tab, search, or filter buttons)"
      );
      if (!actions.length) {
        expect.fail("No idea card found to click.");
        return;
      }

      const initialUrl = page.url();
      await page.act(actions[0]);
      await page.waitForTimeout(1000);

      const detailCheck = await page.extract({
        instruction: "Is a modal, side panel, or drawer with idea details visible (not just the list)?",
        schema: z.object({
          detailVisible: z.boolean().describe("Is idea detail modal/panel visible?"),
        }),
      });

      expect(page.url() !== initialUrl || detailCheck.detailVisible).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should display page content",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/ideas`);
      await page.waitForLoadState("networkidle");

      // Use Stagehand to verify meaningful page content is visible
      const contentCheck = await page.extract({
        instruction:
          "On the ideas page, determine if there is meaningful main content visible " +
          "such as idea lists, cards, or explanatory text.",
        schema: z.object({
          hasContent: z
            .boolean()
            .describe("Is meaningful main content visible on the ideas page?"),
        }),
      });

      expect(contentCheck.hasContent).toBe(true);
    },
    TEST_TIMEOUT
  );
});
