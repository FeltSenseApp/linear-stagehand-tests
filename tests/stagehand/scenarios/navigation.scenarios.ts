import type { Scenario } from "./types";

export const navigationScenarios: Scenario[] = [
  {
    id: "NAV_DASHBOARD_LOADS_AFTER_LOGIN",
    linearId: "EXAMPLE-NAV-001",
    description: "Dashboard loads after login and navigation is visible",
    context: {
      linearIssueSummary:
        "After successful login, the user should land on the main dashboard with sidebar/navigation visible and not be on the login page.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the main dashboard",
        route: "/",
      },
      {
        kind: "wait",
        description: "Wait for the dashboard to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "Determine if the current page is the dashboard (not login) and if a sidebar or main navigation is visible.",
        schema: {
          hasNavigation: "boolean",
        },
        assert: {
          hasNavigation: true,
        },
      },
    ],
  },
  {
    id: "NAV_FOUNDERS_PAGE",
    linearId: "EXAMPLE-NAV-002",
    description: "Founders page shows its main content",
    context: {
      linearIssueSummary:
        "The /founders route should display founders content when accessed by an authenticated user.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go directly to the Founders page",
        route: "/founders",
      },
      {
        kind: "wait",
        description: "Wait for the Founders page to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "On the founders page, determine if the main content (list, table, or cards) is visible.",
        schema: {
          contentVisible: "boolean",
        },
        assert: {
          contentVisible: true,
        },
      },
    ],
  },
  {
    id: "NAV_IDEAS_PAGE",
    linearId: "EXAMPLE-NAV-003",
    description: "Ideas page shows a main header",
    context: {
      linearIssueSummary:
        "The /ideas route should load successfully and show a main page header or title.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go directly to the Ideas page",
        route: "/ideas",
      },
      {
        kind: "wait",
        description: "Wait for the Ideas page to load",
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
    id: "NAV_ADMIN_PAGE_ACCESS",
    linearId: "EXAMPLE-NAV-004",
    description: "Admin route either loads admin content or redirects away",
    context: {
      linearIssueSummary:
        "Navigating to /admin should either show admin content or redirect the user (e.g. to login) depending on access control.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go directly to the Admin page",
        route: "/admin",
      },
      {
        kind: "wait",
        description: "Wait for the Admin page or redirect to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "Determine whether admin panel content is visible, or if the user has been redirected away (e.g. to login).",
        schema: {
          adminContentVisible: "boolean",
        },
        assert: {
          adminContentVisible: true,
        },
      },
    ],
  },
  {
    id: "NAV_TRACES_PAGE_ACCESS",
    linearId: "EXAMPLE-NAV-005",
    description: "Traces route either loads traces content or redirects away",
    context: {
      linearIssueSummary:
        "Navigating to /traces should either show traces content or redirect the user (e.g. to login) depending on access control.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go directly to the Traces page",
        route: "/traces",
      },
      {
        kind: "wait",
        description: "Wait for the Traces page or redirect to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "Determine whether traces page content is visible, or if the user has been redirected away (e.g. to login).",
        schema: {
          tracesContentVisible: "boolean",
        },
        assert: {
          tracesContentVisible: true,
        },
      },
    ],
  },
];

