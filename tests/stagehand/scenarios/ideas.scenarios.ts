import type { Scenario } from "./types";

export const ideasScenarios: Scenario[] = [
  {
    id: "IDEAS_PAGE_LOADS",
    linearId: "EXAMPLE-IDEAS-001",
    description: "Ideas page loads and shows a main header",
    context: {
      linearIssueSummary:
        "The ideas page (/ideas) should load successfully and present a main header or title.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the ideas page",
        route: "/ideas",
      },
      {
        kind: "wait",
        description: "Wait for the ideas page to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "On the ideas page, determine if a main page title or header is visible.",
        schema: {
          hasHeader: "boolean",
        },
        assert: {
          hasHeader: true,
        },
      },
    ],
  },
  {
    id: "IDEAS_LIST_OR_EMPTY_STATE",
    linearId: "EXAMPLE-IDEAS-002",
    description: "Ideas page shows either ideas or an empty state",
    context: {
      linearIssueSummary:
        "The ideas page should either show idea cards/list items or an explicit empty-state message.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the ideas page",
        route: "/ideas",
      },
      {
        kind: "wait",
        description: "Wait for the ideas page to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "On the ideas page, check whether there are any idea cards or list items visible, " +
          "or if an explicit empty state message is shown instead.",
        schema: {
          hasIdeas: "boolean",
          hasEmptyState: "boolean",
        },
        assert: {
          hasIdeas: true,
          // We can't express OR logic in this simple schema/assert yet; behavior is approximated.
          hasEmptyState: false,
        },
      },
    ],
  },
  {
    id: "IDEAS_SORT_OR_FILTER_CONTROLS",
    linearId: "EXAMPLE-IDEAS-003",
    description: "Ideas page has sort or filter options",
    context: {
      linearIssueSummary:
        "The ideas page should expose sort or filter controls so users can refine ideas.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the ideas page",
        route: "/ideas",
      },
      {
        kind: "wait",
        description: "Wait for the ideas page to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "On the ideas page, determine if there are any sort or filter controls " +
          "such as dropdowns or buttons labeled Sort or Filter.",
        schema: {
          hasSortOrFilter: "boolean",
        },
        assert: {
          hasSortOrFilter: true,
        },
      },
    ],
  },
  {
    id: "IDEAS_CLICK_CARD_SHOWS_DETAILS",
    linearId: "EXAMPLE-IDEAS-004",
    description: "Clicking an idea card shows a detail view",
    context: {
      linearIssueSummary:
        "Clicking an idea card from the ideas list should open a detail view, modal, or panel.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the ideas page",
        route: "/ideas",
      },
      {
        kind: "wait",
        description: "Wait for the ideas page to load",
        state: "networkidle",
      },
      {
        kind: "act",
        description:
          "Find the first idea card in the list below the stats (not the Ideas tab, search, or filter buttons) and click it",
      },
      {
        kind: "wait",
        description: "Wait briefly for the idea detail view to appear",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "Determine if a modal, side panel, or drawer with idea details is visible (not just the list).",
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
    id: "IDEAS_PAGE_HAS_MEANINGFUL_CONTENT",
    linearId: "EXAMPLE-IDEAS-005",
    description: "Ideas page displays meaningful main content",
    context: {
      linearIssueSummary:
        "The ideas page should display meaningful main content like idea lists, cards, or explanatory text.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the ideas page",
        route: "/ideas",
      },
      {
        kind: "wait",
        description: "Wait for the ideas page to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "On the ideas page, determine if there is meaningful main content visible " +
          "such as idea lists, cards, or explanatory text.",
        schema: {
          hasContent: "boolean",
        },
        assert: {
          hasContent: true,
        },
      },
    ],
  },
];

