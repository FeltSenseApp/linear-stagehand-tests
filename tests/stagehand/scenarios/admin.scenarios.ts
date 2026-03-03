import type { Scenario } from "./types";

export const adminScenarios: Scenario[] = [
  {
    id: "ADMIN_USER_SEARCH_WORKS",
    linearId: "EXAMPLE-ADMIN-001",
    description: "Admin user search input filters users",
    context: {
      linearIssueSummary:
        "Admin users should be able to search for users via a search input on the admin panel and see filtered results.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the admin page",
        route: "/admin",
      },
      {
        kind: "wait",
        description: "Wait for the admin page to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description: "Check if there is a user search input on the admin panel",
        schema: {
          searchInputVisible: "boolean",
        },
        assert: {
          searchInputVisible: true,
        },
      },
      {
        kind: "act",
        description:
          "Type the current user's username into the user search input to filter the list",
      },
      {
        kind: "wait",
        description: "Wait for the filtered users list to update",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "After searching, determine whether the search filtered the results and how many users are shown.",
        schema: {
          filteredCount: "number",
          searchWorked: "boolean",
        },
        assert: {
          searchWorked: true,
        },
      },
    ],
  },
  {
    id: "ADMIN_USER_DETAILS_VISIBLE",
    linearId: "EXAMPLE-ADMIN-002",
    description: "Clicking a user shows user details",
    context: {
      linearIssueSummary:
        "From the admin users list, clicking a user should reveal user details including at least email and role information.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the admin page",
        route: "/admin",
      },
      {
        kind: "wait",
        description: "Wait for the admin page to load",
        state: "networkidle",
      },
      {
        kind: "act",
        description: "Click on the first user in the users list",
      },
      {
        kind: "wait",
        description: "Wait for user details to appear",
        state: "networkidle",
      },
      {
        kind: "extract",
        description: "Check if user details are visible after clicking on a user",
        schema: {
          userDetailsVisible: "boolean",
        },
        assert: {
          userDetailsVisible: true,
        },
      },
    ],
  },
  {
    id: "ADMIN_FOUNDER_ASSIGNMENT_UI",
    linearId: "EXAMPLE-ADMIN-003",
    description: "Founder assignment UI is visible for a selected user",
    context: {
      linearIssueSummary:
        "After selecting a user in the admin panel, the UI should expose some way to assign founders to that user.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the admin page",
        route: "/admin",
      },
      {
        kind: "wait",
        description: "Wait for the admin page to load and users list to appear",
        state: "networkidle",
      },
      {
        kind: "act",
        description: "Click on the first user in the users list or table",
      },
      {
        kind: "wait",
        description: "Wait for the selected user view to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "After selecting a user, determine if any UI for assigning founders is visible, such as assign buttons or dropdowns.",
        schema: {
          assignmentUIVisible: "boolean",
        },
        assert: {
          assignmentUIVisible: true,
        },
      },
    ],
  },
];

