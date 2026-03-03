import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { z } from "zod";
import type { Stagehand } from "@browserbasehq/stagehand";

import { createStagehand, TEST_TIMEOUT, BASE_URL } from "../stagehand.config";
import { ensureAuthenticated } from "../utils/auth";
import type { Scenario, ScenarioStep } from "./types";
import { chatScenarios } from "./chat.scenarios";
import { navigationScenarios } from "./navigation.scenarios";
import { ideasScenarios } from "./ideas.scenarios";
import { adminScenarios } from "./admin.scenarios";
import { tracesScenarios } from "./traces.scenarios";
import { authScenarios } from "./auth.scenarios";

async function runStep(stagehand: Stagehand, scenario: Scenario, step: ScenarioStep) {
  const page = stagehand.context.pages()[0];

  switch (step.kind) {
    case "navigate": {
      await page.goto(`${BASE_URL}${step.route}`);
      break;
    }
    case "wait": {
      await page.waitForLoadState(step.state, {
        timeout: step.timeoutMs ?? TEST_TIMEOUT,
      });
      break;
    }
    case "agent":
    case "act": {
      await page.act(step.description);
      break;
    }
    case "extract": {
      const shape: Record<string, z.ZodTypeAny> = {};
      for (const [key, type] of Object.entries(step.schema)) {
        if (type === "boolean") shape[key] = z.boolean().describe(key);
        else if (type === "string") shape[key] = z.string().describe(key);
        else if (type === "number") shape[key] = z.number().describe(key);
      }

      const result = await page.extract({
        instruction: step.description,
        schema: z.object(shape),
      });

      for (const [key, expected] of Object.entries(step.assert)) {
        expect(result[key as keyof typeof result]).toBe(expected);
      }
      break;
    }
  }
}

describe("Scenario runner (data-driven)", () => {
  let stagehand: Stagehand;

  beforeAll(
    async () => {
      stagehand = await createStagehand();
      await ensureAuthenticated(stagehand);
    },
    TEST_TIMEOUT
  );

  afterAll(async () => {
    if (stagehand) {
      await stagehand.close();
    }
  });

  const allScenarios: Scenario[] = [
    ...chatScenarios,
    ...navigationScenarios,
    ...ideasScenarios,
    ...adminScenarios,
    ...tracesScenarios,
    ...authScenarios,
  ];

  for (const scenario of allScenarios) {
    it(
      `${scenario.linearId}: ${scenario.description}`,
      async () => {
        for (const step of scenario.steps) {
          await runStep(stagehand, scenario, step);
        }
      },
      TEST_TIMEOUT
    );
  }
}
);

