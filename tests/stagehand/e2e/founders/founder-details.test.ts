import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import {
  createStagehand,
  BASE_URL,
  TEST_TIMEOUT,
} from "../../stagehand.config";
import { ensureAuthenticated } from "../../utils/auth";


describe("Founder Details", () => {
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
    "should open founder details when clicking a founder card",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/founders`);
      await page.waitForLoadState("networkidle");

      const hasFounders = await page.extract({
        instruction: "Are there any founder cards, rows, or list items to click on the founders page?",
        schema: z.object({
          hasFounders: z.boolean().describe("Are there one or more founder entries to click?"),
        }),
      });
      if (!hasFounders.hasFounders) {
        expect.fail("No founder cards/rows on the list; cannot verify opening founder details.");
        return;
      }

      const initialUrl = page.url();
      await page.act("Click on the first founder card, row, or list item to open its details");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);

      const newUrl = page.url();
      const navigated = newUrl !== initialUrl;
      const onDetailUrl = newUrl.includes("/founder");

      expect(navigated || onDetailUrl).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should navigate through founder detail tabs",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/founders`);
      await page.waitForLoadState("networkidle");

      const hasFounders = await page.extract({
        instruction: "Are there any founder cards, rows, or list items to click on the founders page?",
        schema: z.object({
          hasFounders: z.boolean().describe("Are there one or more founder entries to click?"),
        }),
      });
      if (!hasFounders.hasFounders) {
        expect.fail("No founder entries on the list; cannot verify detail tabs.");
        return;
      }

      await page.act("Click a founder entry to open the founder detail view");
      await page.waitForLoadState("networkidle");

      const currentUrl = page.url();
      const onDetailPage = currentUrl !== `${BASE_URL}/founders`;
      if (!onDetailPage) {
        expect.fail("Did not reach founder detail page after clicking a founder.");
        return;
      }

      await page.act("Click on a different tab such as Financials, Website, or Overview that is not currently selected");
      await page.waitForLoadState("networkidle");

      const tabCheck = await page.extract({
        instruction:
          "On the founder detail view, determine if multiple tabs are visible " +
          "and if content for the currently selected tab is visible.",
        schema: z.object({
          tabsVisible: z
            .boolean()
            .describe("Are multiple tabs visible in the founder detail view?"),
          tabContentVisible: z
            .boolean()
            .describe("Is content for the selected tab visible?"),
        }),
      });

      expect(tabCheck.tabsVisible).toBe(true);
      expect(tabCheck.tabContentVisible).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should display founder overview information",
    async () => {
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/founders`);
      await page.waitForLoadState("networkidle");

      const hasFounders = await page.extract({
        instruction: "Are there any founder cards, rows, or list items to click on the founders page?",
        schema: z.object({
          hasFounders: z.boolean().describe("Are there one or more founder entries to click?"),
        }),
      });
      if (!hasFounders.hasFounders) {
        expect.fail("No founder entries on the list; cannot verify overview.");
        return;
      }

      await page.act("Click a founder to open the founder detail view");
      await page.waitForLoadState("networkidle");

      const currentUrl = page.url();
      const onDetailPage = currentUrl !== `${BASE_URL}/founders`;
      if (!onDetailPage) {
        expect.fail("Did not reach founder detail page after clicking a founder.");
        return;
      }

      const overviewCheck = await page.extract({
        instruction:
          "On the founder detail view, determine if overview information is visible, " +
          "such as the founder's name, company, contact details, or a summary section.",
        schema: z.object({
          overviewVisible: z
            .boolean()
            .describe("Is overview information visible for the founder?"),
        }),
      });

      expect(overviewCheck.overviewVisible).toBe(true);
    },
    TEST_TIMEOUT
  );
});
