import type { Scenario } from "./types";

export const tracesScenarios: Scenario[] = [
  {
    id: "TRACES_TOGGLE_VIEWS",
    linearId: "EXAMPLE-TRACES-001",
    description: "Toggle between Overview and Traces views",
    context: {
      linearIssueSummary:
        "On the traces page, users should be able to switch between Overview and Traces views using toggle tabs.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the traces page",
        route: "/traces",
      },
      {
        kind: "wait",
        description: "Wait for the traces page to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description: "Check if there are Overview and Traces view toggle buttons",
        schema: {
          overviewTabVisible: "boolean",
          tracesTabVisible: "boolean",
        },
        assert: {
          overviewTabVisible: true,
          tracesTabVisible: true,
        },
      },
      {
        kind: "act",
        description: "Click on the Overview tab to switch views",
      },
      {
        kind: "wait",
        description: "Wait for the Overview view to render",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "Check if the overview dashboard is visible with charts and summary cards",
        schema: {
          overviewVisible: "boolean",
        },
        assert: {
          overviewVisible: true,
        },
      },
      {
        kind: "act",
        description: "Click on the Traces tab to go back to the list",
      },
      {
        kind: "wait",
        description: "Wait for the traces list view to render again",
        state: "networkidle",
      },
      {
        kind: "extract",
        description: "Check if the traces list is visible again",
        schema: {
          tracesListVisible: "boolean",
        },
        assert: {
          tracesListVisible: true,
        },
      },
    ],
  },
  {
    id: "TRACES_CLICK_ROW_SHOWS_DETAIL",
    linearId: "EXAMPLE-TRACES-002",
    description: "Clicking a trace row shows trace detail view",
    context: {
      linearIssueSummary:
        "From the traces list, clicking a trace row should open a detail view or panel for that trace.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the traces page",
        route: "/traces",
      },
      {
        kind: "wait",
        description: "Wait for the traces page to load and traces to appear",
        state: "networkidle",
      },
      {
        kind: "act",
        description:
          "If there are one or more trace rows in the list, click on the first trace row or item",
      },
      {
        kind: "wait",
        description: "Wait for the trace detail view to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "Determine if a trace detail view, panel, or modal is visible (showing a single trace's details, spans, or timeline).",
        schema: {
          detailVisible: "boolean",
        },
        assert: {
          detailVisible: true,
        },
      },
    ],
  },
  {
    id: "TRACES_SPANS_IN_TIMELINE",
    linearId: "EXAMPLE-TRACES-003",
    description: "Trace detail view shows spans in timeline",
    context: {
      linearIssueSummary:
        "When viewing a trace detail, the timeline should show spans representing the trace's operations.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the traces page",
        route: "/traces",
      },
      {
        kind: "wait",
        description: "Wait for the traces page to load",
        state: "networkidle",
      },
      {
        kind: "act",
        description: "Click on the first trace to view its details",
      },
      {
        kind: "wait",
        description: "Wait for the trace detail view to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description: "Check if trace spans are visible in the timeline",
        schema: {
          spansVisible: "boolean",
        },
        assert: {
          spansVisible: true,
        },
      },
    ],
  },
  {
    id: "TRACES_ACCESS_CONTROL_STATE",
    linearId: "EXAMPLE-TRACES-004",
    description: "Traces page reflects access control state",
    context: {
      linearIssueSummary:
        "The traces page should either show full access, an access denied message, or redirect away, depending on the user's permissions.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the traces page",
        route: "/traces",
      },
      {
        kind: "wait",
        description: "Wait for the traces page or redirect to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "Check the current access state for the traces page, including whether there is full access, access denied, or a redirect.",
        schema: {
          hasFullAccess: "boolean",
          accessDeniedShown: "boolean",
          redirectedAway: "boolean",
        },
        assert: {
          // We can't encode the OR logic directly; this approximates the expectation
          hasFullAccess: true,
          accessDeniedShown: false,
          redirectedAway: false,
        },
      },
    ],
  },
];

