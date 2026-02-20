# Intent-to-Code Spatial Map (Demo Version)

> This document provides the physical-to-logical mapping required by the Agent Trace specification.
> It links human-readable business intents to their physical file scopes and key symbols.

---

## INT-001: Build Weather API Integration

| File                                     | Purpose                             | Key Symbols                       |
| ---------------------------------------- | ----------------------------------- | --------------------------------- |
| `src/services/weather/WeatherService.ts` | Core service for external API calls | `WeatherService`, `getForecast()` |
| `src/services/weather/types.ts`          | Data models and API response types  | `WeatherData`, `ForecastResponse` |
| `tests/weather/WeatherService.test.ts`   | Integration and unit tests          | `describe("WeatherService")`      |
| `src/index.ts`                           | Service registration and exposure   | `registerWeatherService()`        |

---

## INT-002: Refactor Authentication Logic

| File                         | Purpose                                     | Key Symbols                         |
| ---------------------------- | ------------------------------------------- | ----------------------------------- |
| `src/auth/SessionManager.ts` | Manages JWT creation and cookie handling    | `SessionManager`, `createSession()` |
| `src/middleware/auth.ts`     | Express-style middleware for route guarding | `authMiddleware`, `validateToken()` |
| `src/auth/constants.ts`      | Security configuration (expiry, flags)      | `COOKIE_FLAGS`, `JWT_EXPIRY`        |

---

## INT-003: Cleanup Legacy Assets

| File                             | Purpose                                     | Key Symbols         |
| -------------------------------- | ------------------------------------------- | ------------------- |
| `public/assets/legacy/**`        | Old images and binary artifacts for removal | N/A (Binary assets) |
| `src/styles/legacy/main.old.css` | Deprecated styles marked for cleanup        | CSS selectors       |

---

## Governance Metadata (Infrastructure)

The following files are managed by the **Hook Engine** and **Orchestration Service** to enforce the mappings above.

| Infrastructure File                  | Role                                                         |
| ------------------------------------ | ------------------------------------------------------------ |
| `.orchestration/active_intents.yaml` | Source of truth for intent metadata and scope patterns       |
| `.orchestration/agent_trace.jsonl`   | Append-only ledger linking content hashes to Intent IDs      |
| `src/hooks/classifyMutation.ts`      | Logic that determines if a change is a refactor or evolution |
| `src/hooks/classifyCommand.ts`       | Security boundary for safe vs destructive shell commands     |
