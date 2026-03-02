import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { BASE_URL, AI_MODEL } from "../stagehand.config";

/**
 * Schema for login result verification
 */
export const LoginResultSchema = z.object({
  sidebarVisible: z.boolean().describe("Is the sidebar navigation visible?"),
  errorVisible: z.boolean().describe("Is there an error message visible?"),
  errorMessage: z.string().optional().describe("The error message text if visible"),
});

export type LoginResult = z.infer<typeof LoginResultSchema>;

/**
 * Ensures the user is authenticated by performing a fresh login every time.
 */
export async function ensureAuthenticated(stagehand: Stagehand): Promise<void> {
  const page = stagehand.context.pages()[0];
  const username = process.env.PORTAL_USERNAME;
  const password = process.env.PORTAL_PASSWORD;

  if (!username || !password) {
    throw new Error("PORTAL_USERNAME and PORTAL_PASSWORD required for login");
  }

  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  await loginDirect(stagehand, username, password);
  await page.waitForLoadState("networkidle");

  await page.waitForTimeout(1000);

  const finalUrl = page.url();
  if (finalUrl.includes("/login")) {
    await page.waitForTimeout(2000);
    const retryUrl = page.url();
    if (retryUrl.includes("/login")) {
      throw new Error(`Login failed - still on login page. URL: ${retryUrl}`);
    }
  }
}

/**
 * Legacy login function - uses AI agent
 * Only use this if cached auth doesn't work
 */
export async function loginWithAgent(
  stagehand: Stagehand,
  email: string,
  password: string
): Promise<LoginResult> {
  const page = stagehand.context.pages()[0];
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  const agent = stagehand.agent({
    model: AI_MODEL,
    instructions: "You are a QA automation agent. Be precise when filling forms.",
  });

  await agent.execute(
    `Log into this application:
    1. Type "${email}" into the email input field
    2. Type "${password}" into the password input field
    3. Click the Login button to submit the form
    Wait for the page to load after submitting.`
  );

  await page.waitForLoadState("networkidle");

  const result = await page.extract({
    instruction: "Check if login was successful",
    schema: LoginResultSchema as any,
  });

  return result;
}

/**
 * Fast login using direct Playwright selectors (~2-3s)
 */
export async function loginDirect(
  stagehand: Stagehand,
  email: string,
  password: string
): Promise<void> {
  const page = stagehand.context.pages()[0];
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState("networkidle");

  // Use Stagehand act() to interact with the login form without hard-coded selectors
  await page.act({
    action: "type %email% into the email input field",
    variables: { email },
  });

  await page.act({
    action: "type %password% into the password field",
    variables: { password },
  });

  await page.act("click the login button");

  await page.waitForLoadState("networkidle");
}

/**
 * Navigates to a specific route (assumes already authenticated)
 */
export async function navigateTo(
  stagehand: Stagehand,
  route: string
): Promise<void> {
  const page = stagehand.context.pages()[0];
  await page.goto(`${BASE_URL}${route}`);
  await page.waitForLoadState("networkidle");
}

/**
 * Helper to execute an action using the agent
 * Uses gpt-4o-mini for faster execution
 */
export async function executeAction(
  stagehand: Stagehand,
  instruction: string
): Promise<void> {
  const agent = stagehand.agent({
    model: AI_MODEL,
    instructions: "You are a QA automation agent. Be precise and efficient.",
  });
  await agent.execute(instruction);
}
