# Architecture Notes: Phase 0 - The Archaeological Dig

This document maps the core components of Roo Code, focusing on the tool execution loop and the system prompt construction.

## Phase 0: Archaeological Dig Findings

### 1. Tool Execution Loop

The tool execution loop in Roo Code is a sophisticated agentic loop that coordinates LLM responses with local tool execution.

**Key Orchestrator: `src/core/task/Task.ts`**

- `initiateTaskLoop(userContent)`: The main entry point for a task. It initializes checkpoints and starts the sequential request loop.
- `recursivelyMakeClineRequests(...)`: The core of the loop. It:
    1. Prepares environment details (cwd, file structure, etc.).
    2. Adds the user message to history.
    3. Calls `api.createMessage` (via `attemptApiRequest`) to get a streaming response from the LLM.
    4. Iterates through the streamed chunks (text, tool calls).
    5. Dispatches content to `presentAssistantMessage` during streaming.

**Tool Dispatcher: `src/core/assistant-message/presentAssistantMessage.ts`**

- `presentAssistantMessage(cline: Task)`: This function handles the "presentation" and execution of content blocks.
- It contains a comprehensive `switch (block.name)` statement for tools.
- **`execute_command`**: Handled by `executeCommandTool.handle(cline, block, ...)` (Line 765).
- **`write_to_file`**: Handled by `writeToFileTool.handle(cline, block, ...)` (Line 681).

**Specific Tool Implementations: `src/core/tools/`**

- Each tool inherits from `BaseTool` and implements an `execute` (for full blocks) and sometimes `handlePartial` (for streaming) method.
- `ExecuteCommandTool.ts`: Manages terminal interaction, output streaming, and termination.
- `WriteToFileTool.ts`: Handles file creation/modification, including integration with the Diff View.

### 2. Prompt Builder

Roo Code uses a dynamic, modular system for constructing the system prompt.

**Core Builder: `src/core/prompts/system.ts`**

- `SYSTEM_PROMPT(...)`: The primary function called to generate the operational context for the LLM.
- It uses a "build/generate" pattern, calling `generatePrompt` which aggregates multiple sections.

**Modular Sections: `src/core/prompts/sections/`**

- The prompt is built from various segments:
    - `role`: Defines the persona (e.g., "You are Roo...").
    - `capabilities`: Details what the agent can do.
    - `modes`: Instructions specific to the current active mode (Code, Architect, etc.).
    - `tools`: Documentation for the available tools.
    - `rules`: Global and project-specific constraints.
- This modularity allows Roo Code to be highly customizable via `customModes` and `customInstructions`.

### 3. UI and State Management

**Provider: `src/core/webview/ClineProvider.ts`**

- Acts as the `WebviewViewProvider`.
- Manages the lifecycle of the webview and serves as the bridge between the UI (React) and the core `Task` logic.
- Handles `postMessage` communication for task updates, terminal output, and user interactions.

---

## Technical Context for Development

### Extension Host Activation

- Entry point: `src/extension.ts`.
- VS Code `activate` function initializes services (Telemetry, MCP, etc.) and registers the `ClineProvider`.

### Debugging & Testing

- Use the **"Run and Debug"** sidebar in VS Code.
- Launch the **"Roo Code"** configuration to start a new Extension Development Host.
- This allows for real-time testing of changes to the core logic or UI.

---

## Environment & Setup Notes

- **Node.js**: Expected `v20.x` (enforced via `.pnpm-workspace.yaml` and `.npmrc`).
- **Package Manager**: `pnpm` (configured as a monorepo with `turbo`).
- **Build System**: Managed by `turbo`. Key commands: `pnpm run build`, `pnpm run dev`.
    - `capabilities.ts`: Description of what the agent can do.
    - `tool-use.ts`: Instructions on how to use tools.
    - `objective.ts`: Defines the agent's goal-oriented behavior.

## 4. Integration Point: Webview Provider

`src/core/webview/ClineProvider.ts` acts as the bridge between the VS Code UI (Webview) and the `Task` logic. It handles sidebar registration, message passing, and state management.

---

_This document serves as the foundation for Phase 1 (The Neural Graft)._
