# AGENTS.md

This file provides guidance to agents when working with code in this repository.

- Settings View Pattern: When working on `SettingsView`, inputs must bind to the local `cachedState`, NOT the live `useExtensionState()`. The `cachedState` acts as a buffer for user edits, isolating them from the `ContextProxy` source-of-truth until the user explicitly clicks "Save". Wiring inputs directly to the live state causes race conditions.

> This file is a persistent knowledge base shared across parallel AI sessions.
> It contains lessons learned, architectural decisions, and project-specific rules.
>
> **Update Pattern:** Append new entries when verification loops fail, architectural
> decisions are made, or agents discover important patterns.

---

## Architectural Decisions

### AD-001: Plugin-Based Hook Engine (2026-02-17)

- **Decision:** Use the Observer/Plugin pattern for the Hook Engine instead of inline governance checks.
- **Rationale:** Allows adding new governance behaviors (e.g., cost tracking, security audit) by registering new plugins without modifying existing code. Follows Open/Closed Principle.
- **Consequence:** All governance logic lives in `src/hooks/` as independent plugins.

### AD-002: Sidecar Storage in `.orchestration/` (2026-02-17)

- **Decision:** Machine-managed metadata lives in `.orchestration/` alongside the source code.
- **Rationale:** Keeps source files clean. No inline `<!-- INTENT: INT-001 -->` comments. Metadata is structural, not inline.
- **Consequence:** All intent definitions, traces, and maps are in `.orchestration/`.

### AD-003: Defense in Depth — Soft + Hard Enforcement (2026-02-18)

- **Decision:** Two layers of governance — prompt engineering (soft) and code checks (hard).
- **Rationale:** LLMs usually follow prompt instructions, but not always. The code-level checks in `presentAssistantMessage.ts` are the fail-safe.
- **Consequence:** Even if the LLM ignores the system prompt, the tool dispatcher blocks unauthorized actions.

### AD-004: Append-Only Trace Ledger (2026-02-18)

- **Decision:** `agent_trace.jsonl` is append-only. Never edit or delete entries.
- **Rationale:** Creates a tamper-evident audit trail. If any entry is modified, the sequence becomes detectable.
- **Consequence:** File size grows monotonically. May need rotation/archival for long-running projects.

---

## Lessons Learned

### LL-001: TypeScript `any` Escape Hatch (2026-02-18)

- **Context:** `Task` class doesn't have `activeIntentId` property.
- **Lesson:** Using `(task as any).activeIntentId` works for POC but is fragile. For production, extend the `Task` interface.
- **Impact:** Low risk for now; document for future refactoring.

### LL-002: `ignore` Library for Scope Matching (2026-02-18)

- **Context:** Needed `.gitignore`-style glob matching for scope enforcement.
- **Lesson:** The `ignore` npm package provides exactly this functionality. Use `ig.ignores(path)` to check if a file matches scope patterns.
- **Impact:** Works well but note that `ignore` expects forward slashes. Windows paths need normalization.

---

## Project Rules

1. **All state-changing tools require an active intent.** No exceptions.
2. **Trace records must include content hashes.** This ensures spatial independence.
3. **Hooks must be fail-safe.** Errors in hooks log warnings but never crash the extension.
4. **The `.orchestration/` directory is machine-managed.** Humans write `active_intents.yaml`; machines write `agent_trace.jsonl`.
