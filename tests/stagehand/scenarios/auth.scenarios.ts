import type { Scenario } from "./types";

export const authScenarios: Scenario[] = [
  {
    id: "AUTH_LOGIN_SUCCESS",
    linearId: "EXAMPLE-AUTH-001",
    description: "User can log in successfully with valid credentials",
    context: {
      linearIssueSummary:
        "Given valid portal credentials, the login flow should succeed and show the main sidebar without an error message.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the login page",
        route: "/login",
      },
      {
        kind: "wait",
        description: "Wait for the login page to load",
        state: "networkidle",
      },
      {
        kind: "act",
        description:
          "Log into the application using valid credentials and wait for the main app to load",
      },
      {
        kind: "wait",
        description: "Wait for the post-login page to settle",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "Determine whether the main sidebar/navigation is visible and whether an error message is shown.",
        schema: {
          sidebarVisible: "boolean",
          errorVisible: "boolean",
        },
        assert: {
          sidebarVisible: true,
          errorVisible: false,
        },
      },
    ],
  },
  {
    id: "AUTH_PROTECTED_ROUTE_REDIRECTS_TO_LOGIN",
    linearId: "EXAMPLE-AUTH-002",
    description: "Unauthenticated access to a protected route redirects to login",
    context: {
      linearIssueSummary:
        "When an unauthenticated user navigates directly to a protected route, they should be redirected to the login page.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Attempt to access a protected founders route while unauthenticated",
        route: "/founders",
      },
      {
        kind: "wait",
        description: "Wait for any redirect from the protected route",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          "Determine if we are currently on the login page or if a login form with email/password inputs is visible.",
        schema: {
          onLoginPage: "boolean",
          loginFormVisible: "boolean",
        },
        assert: {
          onLoginPage: true,
        },
      },
    ],
  },
];

