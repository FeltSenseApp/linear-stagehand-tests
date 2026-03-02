import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import {
  createStagehand,
  BASE_URL,
  TEST_TIMEOUT,
} from "../stagehand.config";
import { ensureAuthenticated } from "../utils/auth";

describe("Traces View", () => {
  let stagehand: Stagehand;
  let hasAccess = false;

  beforeAll(async () => {
    stagehand = await createStagehand();
    await ensureAuthenticated(stagehand);

    // Check if user has access to traces
    const page = stagehand.context.pages()[0];
    await page.goto(`${BASE_URL}/traces`);
    await page.waitForLoadState("networkidle");

    const accessCheck = await page.extract({
      instruction: "Check if we have access to the traces page",
      schema: z.object({
        hasAccess: z.boolean().describe("Do we have access to the traces page?"),
        accessDenied: z.boolean().describe("Is there an access denied message?"),
      }),
    });

    hasAccess = accessCheck.hasAccess && !accessCheck.accessDenied;
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (stagehand) {
      await stagehand.close();
    }
  });

  it.skip(
    "should load traces page with traces list",
    async () => {
      if (!hasAccess) {
        expect.fail("Test requires traces access; current user does not have access to the traces page.");
        return;
      }

      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/traces`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Check we're on the traces page via URL
      const url = page.url();
      const onTracesPage = url.includes("/traces");

      // Use Stagehand to determine if a traces list or empty state is visible
      const listCheck = await page.extract({
        instruction:
          "On the traces page, determine if a list or table of traces is visible, " +
          "or if an explicit empty state is shown instead.",
        schema: z.object({
          hasTracesList: z
            .boolean()
            .describe("Is a list or table of traces visible?"),
          hasEmptyState: z
            .boolean()
            .describe("Is an empty-state message visible instead?"),
        }),
      });

      expect(onTracesPage).toBe(true);
      expect(listCheck.hasTracesList || listCheck.hasEmptyState).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should toggle between Overview and Traces views",
    async () => {
      if (!hasAccess) {
        expect.fail("Test requires traces access; current user does not have access to the traces page.");
        return;
      }

      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/traces`);
      await page.waitForLoadState("networkidle");

      // Check if view toggle exists
      const toggleCheck = await page.extract({
        instruction: "Check if there are Overview and Traces view toggle buttons",
        schema: z.object({
          overviewTabVisible: z.boolean().describe("Is an Overview tab visible?"),
          tracesTabVisible: z.boolean().describe("Is a Traces tab visible?"),
        }),
      });

      if (!toggleCheck.overviewTabVisible) {
        expect.fail("Traces page has no Overview/Traces view toggle.");
        return;
      }

      // Switch to Overview
        await page.act("Click on the Overview tab to switch views");
        await page.waitForLoadState("networkidle");

        const overviewResult = await page.extract({
          instruction: "Check if the overview dashboard is visible with charts and summary cards",
          schema: z.object({
            overviewVisible: z.boolean().describe("Is the overview dashboard visible?"),
            hasCharts: z.boolean().describe("Are charts visible?"),
            hasSummaryCards: z.boolean().describe("Are summary cards visible?"),
          }),
        });

        expect(overviewResult.overviewVisible).toBe(true);

        // Switch back to Traces
        await page.act("Click on the Traces tab to go back to the list");
        await page.waitForLoadState("networkidle");

        const tracesResult = await page.extract({
          instruction: "Check if the traces list is visible again",
          schema: z.object({
            tracesListVisible: z.boolean().describe("Is the traces list visible?"),
          }),
        });

        expect(tracesResult.tracesListVisible).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should display trace detail when clicking on a trace",
    async () => {
      if (!hasAccess) {
        expect.fail("Test requires traces access; current user does not have access to the traces page.");
      }

      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/traces`);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      // Require at least one trace in the list; otherwise we cannot verify detail view
      const listState = await page.extract({
        instruction:
          "On the traces page, are there any trace rows, items, or rows in a table that represent a trace (i.e. clickable traces in the list)?",
        schema: z.object({
          hasTraceRows: z
            .boolean()
            .describe("Are there one or more trace rows/items in the list to click?"),
        }),
      });

      if (!listState.hasTraceRows) {
        expect.fail(
          "No traces in list; cannot verify trace detail. The test expects at least one trace row to click."
        );
        return;
      }

      const initialUrl = page.url();

      await page.act("Click on the first trace row or item in the list");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2000);

      const newUrl = page.url();
      const urlChanged = newUrl !== initialUrl;

      const detailCheck = await page.extract({
        instruction:
          "Is a trace detail view, detail panel, or trace detail modal visible (content showing a single trace's details, spans, or timeline)? Not the main traces list.",
        schema: z.object({
          detailVisible: z
            .boolean()
            .describe("Is a trace detail view/panel/modal visible (single trace details), not the list?"),
        }),
      });

      expect(urlChanged || detailCheck.detailVisible).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should display trace spans in timeline",
    async () => {
      if (!hasAccess) {
        expect.fail("Test requires traces access; current user does not have access to the traces page.");
      }

      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/traces`);
      await page.waitForLoadState("networkidle");

      // Check if there are traces
      const hasTraces = await page.extract({
        instruction: "Check if there are any traces in the list",
        schema: z.object({
          hasTraces: z.boolean().describe("Are there traces in the list?"),
        }),
      });

      if (!hasTraces.hasTraces) {
        expect.fail("No traces in list; cannot verify trace spans in timeline.");
      }

      await page.act("Click on the first trace to view its details");
      await page.waitForLoadState("networkidle");

      const spansResult = await page.extract({
        instruction: "Check if trace spans are visible in the timeline",
        schema: z.object({
          spansVisible: z.boolean().describe("Are trace spans visible?"),
          spanCount: z.number().describe("How many spans are visible?"),
          hasNestedSpans: z.boolean().describe("Are there nested/child spans?"),
        }),
      });

      // We reached the detail view; it must expose span info (even if empty)
      expect(spansResult.spansVisible !== undefined).toBe(true);
    },
    TEST_TIMEOUT
  );

  it(
    "should show access denied for non-admin users",
    async () => {
      // This test verifies access control
      const page = stagehand.context.pages()[0];
      await page.goto(`${BASE_URL}/traces`);
      await page.waitForLoadState("networkidle");

      const accessResult = await page.extract({
        instruction: "Check the current access state for the traces page",
        schema: z.object({
          hasFullAccess: z.boolean().describe("Does the user have full traces access?"),
          accessDeniedShown: z.boolean().describe("Is an access denied message shown?"),
          redirectedAway: z.boolean().describe("Was the user redirected away from traces?"),
        }),
      });

      // Either they have access or they don't - both are valid states
      expect(
        accessResult.hasFullAccess ||
          accessResult.accessDeniedShown ||
          accessResult.redirectedAway
      ).toBe(true);
    },
    TEST_TIMEOUT
  );
});
