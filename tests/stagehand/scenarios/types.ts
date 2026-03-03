export type StepKind = "navigate" | "wait" | "agent" | "act" | "extract";

export type NavigateStep = {
  kind: "navigate";
  description?: string;
  route: string;
};

export type WaitStep = {
  kind: "wait";
  description?: string;
  state: "load" | "domcontentloaded" | "networkidle";
  timeoutMs?: number;
};

export type AgentOrActStep = {
  kind: "agent" | "act";
  description: string;
};

export type ExtractStep = {
  kind: "extract";
  description: string;
  /**
   * Simple schema description: key -> primitive type.
   * This is intentionally minimal for now; we can extend it later.
   */
  schema: Record<string, "boolean" | "string" | "number">;
  /**
   * Expected values for assertions.
   */
  assert: Record<string, boolean | string | number>;
};

export type ScenarioStep = NavigateStep | WaitStep | AgentOrActStep | ExtractStep;

export type Scenario = {
  /**
   * Stable ID for this scenario (used by tools / generators).
   */
  id: string;
  /**
   * Linked Linear issue ID, e.g. "APP-123".
   */
  linearId: string;
  /**
   * Human‑readable description of the scenario.
   */
  description: string;
  /**
   * Optional metadata for filtering, grouping, etc.
   */
  meta?: Record<string, unknown>;
  /**
   * High‑level context for the scenario (Linear summary, seed data, etc.).
   */
  context?: {
    linearIssueSummary?: string;
    seedData?: Record<string, string | number | boolean>;
  };
  /**
   * Ordered list of steps to execute.
   */
  steps: ScenarioStep[];
};

