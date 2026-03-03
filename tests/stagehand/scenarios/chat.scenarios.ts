import type { Scenario } from "./types";

/**
 * Initial example scenario derived from the existing
 * "should load chat container on main dashboard" test.
 *
 * This is intentionally simple and can later be generated
 * from Linear issues and code/DOM context.
 */
export const chatScenarios: Scenario[] = [
  {
    id: "CHAT_MAIN_CONTAINER_VISIBLE",
    linearId: "EXAMPLE-CHAT-001",
    description: "Chat container is visible on the main dashboard",
    context: {
      linearIssueSummary:
        "When the user opens the main dashboard, the unified chat container must be visible with an input field.",
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
        description: "Check if the unified chat container and input field are visible",
        schema: {
          visible: "boolean",
          hasInputField: "boolean",
        },
        assert: {
          visible: true,
          hasInputField: true,
        },
      },
    ],
  },
  {
    id: "CHAT_ANNIE_ROUTE_CONTAINER_VISIBLE",
    linearId: "EXAMPLE-CHAT-002",
    description: "Chat container is visible on the Annie route",
    context: {
      linearIssueSummary:
        "When the user opens the Annie chat route, the unified chat container must be visible.",
    },
    steps: [
      {
        kind: "navigate",
        description: "Go to the Annie chat route",
        route: "/annie",
      },
      {
        kind: "wait",
        description: "Wait for the Annie page to load",
        state: "networkidle",
      },
      {
        kind: "extract",
        description: "Check if the unified chat container is visible on the Annie page",
        schema: {
          visible: "boolean",
        },
        assert: {
          visible: true,
        },
      },
    ],
  },
  {
    id: "CHAT_CREATE_NEW_SESSION",
    linearId: "EXAMPLE-CHAT-003",
    description: "User can create a new chat session from the main dashboard",
    context: {
      linearIssueSummary:
        "Users must be able to start a new chat session from the main dashboard and see it in the sessions list.",
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
        kind: "act",
        description: "Click the new chat button to create a new conversation",
      },
      {
        kind: "extract",
        description: "Check if a new chat session is visible in the sessions list",
        schema: {
          sessionVisible: "boolean",
        },
        assert: {
          sessionVisible: true,
        },
      },
    ],
  },
  {
    id: "CHAT_SEND_MESSAGE",
    linearId: "EXAMPLE-CHAT-004",
    description: "User can send a message and see it appear in the chat",
    context: {
      linearIssueSummary:
        "When a user sends a chat message from the main dashboard, the message must appear in the chat history.",
      seedData: {
        message: "Hello, this is a test message",
      },
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
        kind: "act",
        description:
          'Type "Hello, this is a test message" into the chat input and click the send button to send the message',
      },
      {
        kind: "wait",
        description: "Wait for the message to appear in the chat",
        state: "networkidle",
      },
      {
        kind: "extract",
        description:
          'Check if the message "Hello, this is a test message" appears in the chat history',
        schema: {
          messageVisible: "boolean",
        },
        assert: {
          messageVisible: true,
        },
      },
    ],
  },
  {
    id: "CHAT_HISTORY_VISIBLE",
    linearId: "EXAMPLE-CHAT-005",
    description: "Chat history list is visible on the main dashboard",
    context: {
      linearIssueSummary:
        "When the user views the main dashboard, there should be a visible chat history or sessions list.",
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
        description: "Check if there is a chat history or sessions list visible",
        schema: {
          historyVisible: "boolean",
        },
        assert: {
          historyVisible: true,
        },
      },
    ],
  },
];

