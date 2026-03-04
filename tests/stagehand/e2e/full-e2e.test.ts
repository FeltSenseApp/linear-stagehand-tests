import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { createStagehand, BASE_URL, AI_MODEL } from "../stagehand.config";
import { ensureAuthenticated } from "../utils/auth";

// Full end-to-end timeout (includes auth, founder creation, discovery, and PRD generation)
const FULL_FLOW_TIMEOUT = 600_000;

describe.skip("Full Founder PRD Flow", () => {
  let stagehand: Stagehand;

  beforeAll(async () => {
    stagehand = await createStagehand();
    await ensureAuthenticated(stagehand);
  }, FULL_FLOW_TIMEOUT);

  afterAll(async () => {
    if (stagehand) {
      await stagehand.close();
    }
  });

  it(
    "creates a new founder from the dashboard and generates a PRD",
    async () => {
      const page = stagehand.context.pages()[0];

      const founderName = `Stagehand Test Founder ${Date.now()}`;
      const startupIdea = "AI-powered productivity assistant for founders";
      const founderAppearance = "Tall founder wearing a blue hoodie and glasses";

      // Start on dashboard
      await page.goto(`${BASE_URL}/`);
      await page.waitForLoadState("networkidle");

      // Navigate to founders page via navigation
      await page.act(
        "From the dashboard, click the Founders navigation item in the sidebar or top navigation to go to the founders page"
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1_000);

      if (!page.url().includes("/founders")) {
        // Fallback: direct navigation if the nav click did not succeed
        await page.goto(`${BASE_URL}/founders`);
        await page.waitForLoadState("networkidle");
      }

      const onFoundersPage = page.url().includes("/founders");
      expect(onFoundersPage).toBe(true);

      // Open the create-founder flow (left panel)
      await page.act(
        "On the founders page, click the button to create a new founder in the left panel (for example a button labeled Create founder, New Founder, or similar)"
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1_000);

      // Use an agent to carefully fill the founder create form so each field gets the correct value
      const formAgent = stagehand.agent({
        model: AI_MODEL,
        instructions:
          "You are a precise QA automation agent. " +
          "Interact only with the founder create form in the left panel. " +
          "Make sure each value is entered into the correct field based on its label.",
      });

      await formAgent.execute(
        `On the current founders page:
1. In the left panel, find the founder create form.
2. In the input labeled with the founder's name (for example "Founder name" or "Name"), type "${founderName}".
3. In the input labeled with the startup idea (for example "Startup idea" or "What is their startup?"), type "${startupIdea}".
4. In the input labeled with the founder's appearance or description (for example "Founder appearance" or "Describe the founder"), type "${founderAppearance}".
5. If the primary button to create/save the founder is not visible, scroll the left panel form until it is visible, then click that primary button to create/save the founder.`
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(2_000);

      // Verify the new founder appears in the list or detail view
      const creationCheck = await page.extract({
        instruction: `Determine whether a founder with the name "${founderName}" is visible in the current view (either in a list, table, or as a detail header).`,
        schema: z.object({
          founderVisible: z
            .boolean()
            .describe(
              "Is the newly created founder visible in the list or detail view?"
            ),
        }),
      });

      expect(creationCheck.founderVisible).toBe(true);

      // If we're on the list, open the new founder's detail view
      if (page.url().includes("/founders")) {
        await page.act({
          action:
            "Click on the founder row, card, or list item with name %name% to open the founder details",
          variables: { name: founderName },
        });
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1_000);
      }

      const detailUrl = page.url();
      const onDetailPage =
        detailUrl.includes("/founder") ||
        (!detailUrl.endsWith("/founders") && !detailUrl.includes("/login"));
      expect(onDetailPage).toBe(true);

      // Click the combined Discover & Generate PRD button
      await page.act(
        "In the founder detail view, click the Discover & Generate PRD button (or similarly labeled button) to run discovery and generate the PRD for this founder"
      );
      await page.waitForLoadState("networkidle");

      // Discovery questions can take a while to generate; poll using Stagehand extract
      const maxWaitMs = 90_000;
      const pollIntervalMs = 5_000;
      const startTime = Date.now();
      let questionsVisible = false;
      let questionCount = 0;

      while (Date.now() - startTime < maxWaitMs) {
        const discoveryCheck = await page.extract({
          instruction:
            "Determine whether a PRD discovery questionnaire or list of discovery questions is now visible for this founder. " +
            "Count approximately how many distinct questions are shown.",
          schema: z.object({
            questionsVisible: z
              .boolean()
              .describe(
                "Is a PRD discovery questionnaire or list of discovery questions visible?"
              ),
            questionCount: z
              .number()
              .describe(
                "Approximate number of visible discovery questions (0 if none)."
              ),
          }),
        });

        questionsVisible = discoveryCheck.questionsVisible;
        questionCount = discoveryCheck.questionCount;

        if (questionsVisible && questionCount > 0) {
          break;
        }

        await page.waitForTimeout(pollIntervalMs);
      }

      expect(questionsVisible).toBe(true);
      expect(questionCount).toBeGreaterThan(0);

      // Answer each discovery question in the scrollable list, then click "Generate PRD with context"
      const discoveryAgent = stagehand.agent({
        model: AI_MODEL,
        instructions:
          "You are a precise QA automation agent. " +
          "Interact only with the PRD discovery questions section for this founder.",
      });

      await discoveryAgent.execute(
        `On the current founder detail page:
1. Locate the PRD discovery questions section or scrollable list of questions.
2. For each visible discovery question, select one reasonable answer option or fill in a reasonable text answer. 
   - If the answers are buttons, radios, checkboxes, or selects, choose one appropriate option.
   - If the answers are text inputs or textareas, type a concise but meaningful answer.
3. If not all questions are visible at once, scroll the discovery questions area so that you can answer all questions currently present for this flow.
4. After answering all discovery questions, find the button labeled "Generate PRD with context" (or a very similar label) that appears in or below the discovery questions section, and click it once to generate the PRD with the provided context.`
      );

      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(3_000);

      // PRD generation can also take a while; poll using Stagehand extract (similar to discovery)
      const prdMaxWaitMs = 450_000;
      const prdPollIntervalMs = 5_000;
      const prdStartTime = Date.now();
      let prdVisible = false;
      let prdSectionCount = 0;

      while (Date.now() - prdStartTime < prdMaxWaitMs) {
        const prdCheck = await page.extract({
          instruction:
            "Determine whether a PRD document is now visible for this founder. " +
            "Treat a PRD as visible if you can see a structured product document with at least one named section " +
            'such as "Overview", "Problem", "Solution", "Requirements", or similar.',
          schema: z.object({
            prdVisible: z
              .boolean()
              .describe("Is any PRD document visible for this founder?"),
            sectionCount: z
              .number()
              .describe(
                "Approximate number of visible PRD sections (0 if none)."
              ),
          }),
        });

        prdVisible = prdCheck.prdVisible;
        prdSectionCount = prdCheck.sectionCount;

        if (prdVisible && prdSectionCount > 0) {
          break;
        }

        await page.waitForTimeout(prdPollIntervalMs);
      }

      expect(prdVisible).toBe(true);
      expect(prdSectionCount).toBeGreaterThan(0);
    },
    FULL_FLOW_TIMEOUT
  );
});

