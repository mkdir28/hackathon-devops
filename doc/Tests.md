# Testing Guide — Scout / JobMatch Agent

## Overview

The test suite lives in `app/server/tests/` and runs with [Vitest](https://vitest.dev/).
No network access, no LLM keys, and no running cluster are required — every external dependency is mocked.

```
app/server/
├── tests/
│   ├── fixtures/
│   │   └── boards.ts                — shared test doubles (boards + raw listings)
│   ├── unit/
│   │   ├── parsers.test.ts          — HTML parsers for job boards
│   │   ├── http.test.ts             — fetchHtml + encodeQuery
│   │   ├── json.test.ts             — parseJsonFromModelText + schemaInstruction
│   │   ├── web-search.test.ts       — webSearchJobs error paths & backend selection
│   │   ├── agent.test.ts            — runJobSearchAgent + searchRawJobs (e2e unit)
│   │   ├── synthesize.test.ts       — rankListingsWithLlm (hallucination guard, fallback)
│   │   ├── boards.test.ts           — loadJobBoardCatalog, selectBoardsForCountry, formatBoardsForPrompt
│   │   ├── resolve.test.ts          — resolveLlmConfig (all provider branches)
│   │   ├── demo-notice.test.ts      — logDemoModeWarningIfNeeded (idempotency)
│   │   ├── providers.test.ts        — DemoAIClient, OpenAIProvider, GeminiProvider, ClaudeProvider
│   │   ├── ai-client.test.ts        — createAIClient factory, getAIClient singleton, resetAIClient
│   │   ├── skills-loader.test.ts    — loadAllSkills, selectSkillsForTask, buildSkillsSystemAppendix
│   │   ├── llm-service.test.ts      — runAgenticJobMatch, extractCvStructured, getActiveSkillIdsForTask
│   │   └── cv-service.test.ts       — extractTextFromFile (PDF, text, unsupported types)
│   └── integration/
│       ├── fetch-board.test.ts      — fetchJobBoard (HTTP mocked)
│       └── evals.test.ts            — LLM-as-a-Judge quality gates (AI mocked)
└── vitest.config.ts
```

---

## Quick Start

```bash
cd app/server

# Run all tests once (CI mode)
npm test

# Run in watch mode (development)
npm run test:watch

# Run with coverage report
npm run test:coverage
```

Expected output (146 tests, ~600 ms):

```
Test Files  16 passed (16)
     Tests  146 passed (146)
  Duration  ~600ms
```

---

## Coverage Report

| Area | Statements | Branches | Functions | Lines |
|------|-----------|----------|-----------|-------|
| **All files** | **81.74%** | **72.04%** | **90.78%** | **84.52%** |
| `agent/` | 97.69% | 82.53% | 100% | 98.29% |
| `agent/tools/` | 59% | 55% | 70% | 62% |
| `ai/` | 93.87% | 92.1% | 100% | 93.75% |
| `ai/providers/` | 100% | 78.57% | 100% | 100% |
| `ai/skills/` | 95.55% | 81.81% | 100% | 100% |

> **Before → After**: 43% → 82% statements (+39 pp), 44% → 91% functions (+47 pp)

Generate HTML report:
```bash
npm run test:coverage
# open coverage/index.html
```

---

## Unit Tests

### 1. `parsers.test.ts` — HTML board parsers

Tests `parseDouVacancies`, `parseWorkUa`, `parseDjinni`, `parseGenericLinks`, `parseBoardHtml`.

Key assertions:
- Correct extraction of `title`, `company`, `location`, `applyUrl`
- `limit` parameter is respected
- Duplicate URLs are deduplicated within a page
- Index/search page links are excluded (e.g. `/vacancies/` without an ID)
- Links from other domains are excluded

---

### 2. `http.test.ts` — HTTP utilities

Tests `encodeQuery` and `fetchHtml`.

| Test | Description |
|------|-------------|
| `encodeQuery` | Encodes spaces, trims whitespace, collapses multi-spaces, encodes special chars |
| `fetchHtml` success | Returns body text on `ok: true` response |
| `fetchHtml` error | Throws `HTTP <status>` on non-ok response |
| `fetchHtml` abort | Propagates `AbortError` when signal fires |
| `fetchHtml` headers | Sends `User-Agent: JobMatchAgent` header |

---

### 3. `json.test.ts` — LLM JSON extraction

Tests `parseJsonFromModelText` and `schemaInstruction`.

Critical path: if JSON extraction breaks, all LLM responses become unparseable.

| Test | Description |
|------|-------------|
| Plain JSON object/array | Direct `JSON.parse` path |
| Markdown fences ` ```json ... ``` ` | Regex strip + parse |
| JSON embedded in prose | Boundary-search extraction |
| No valid JSON | Throws `Model response did not contain valid JSON` |
| `schemaInstruction` | Returns generic message or embedded schema |

---

### 4. `boards.test.ts` — Job board catalog

Tests `loadJobBoardCatalog`, `selectBoardsForCountry`, `formatBoardsForPrompt`.
`node:fs` is mocked — no `job-boards.json` file needed.

| Test | Description |
|------|-------------|
| GLOBAL code | Returns only globally-tagged boards |
| UA country | Returns UA-specific + global boards |
| Unknown country | Returns only global boards (graceful fallback) |
| `maxBoards` limit | Output is capped correctly |
| Priority sort | Boards sorted descending by `priority` |
| Deduplication | Boards with same `id` appear once |
| Case insensitive | `UA` and `ua` produce the same result |
| `formatBoardsForPrompt` | Groups by region, sorts regions alphabetically |
| Cache | Second call to `loadJobBoardCatalog` returns same reference |

---

### 5. `resolve.test.ts` — LLM config resolution

Tests `resolveLlmConfig` for all four provider values.

```bash
npx vitest run tests/unit/resolve.test.ts --reporter=verbose
```

---

### 6. `demo-notice.test.ts` — Demo mode warning

Tests `logDemoModeWarningIfNeeded`:
- Logs a warning when `demoMode: true`
- Logs **only once** even on repeated calls (idempotent via module-level flag)
- Does not log when `demoMode: false`

---

### 7. `providers.test.ts` — AI provider implementations

**Mocking strategy**: `vi.hoisted()` makes mock functions available before module hoisting; SDK classes are mocked using `vi.fn().mockImplementation(class { ... })` (Vitest requires `class` keyword for constructor mocks).

#### DemoAIClient
- Returns DEMO_JOBS array for `job_match` task
- Returns demo CV structure for `cv_extract` task

#### OpenAIProvider
- Parses structured JSON from `chat.completions.create` response
- Throws `Empty OpenAI response` on empty content
- Sends `json_schema` format when schema is provided; `json_object` when not
- Sends both system and user messages

#### GeminiProvider
- Parses structured JSON from `models.generateContent` response
- Throws `Empty Gemini response` on empty text
- Delegates to `OpenAIProvider` when `GATEWAY_URL` env is set
- Appends `/v1` to `GATEWAY_URL` when missing

#### ClaudeProvider
- Parses structured JSON from `messages.create` response
- Throws `Empty Claude response` on empty content array
- Delegates to `OpenAIProvider` when `GATEWAY_URL` env is set

---

### 8. `ai-client.test.ts` — AIClient factory and singleton

Provider classes are mocked, so no SDK constructors are invoked.

| Test | Description |
|------|-------------|
| `createAIClient` demo mode | Returns `DemoAIClient` when `demoMode: true` |
| `createAIClient` gemini | Returns `GeminiProvider` |
| `createAIClient` claude | Returns `ClaudeProvider` |
| `createAIClient` + `GATEWAY_URL` | Returns `OpenAIProvider` (gateway routing) |
| `getAIClient` singleton | Two calls return the same instance |
| `resetAIClient` | Clears singleton; next call creates a new instance |

---

### 9. `skills-loader.test.ts` — Agent skills loading

`node:fs` is mocked. Tests `loadAllSkills`, `selectSkillsForTask`, `buildSkillsSystemAppendix`.

| Test | Description |
|------|-------------|
| Missing skills dir | Returns `[]` |
| Directory with SKILL.md | Loads skill with parsed name and description |
| Top-level `.md` files | Loads skills from standalone markdown files |
| Non-.md and no-SKILL.md entries | Skipped cleanly |
| `SKILLS_DIR` env var | Used as skills root when set |
| `selectSkillsForTask` | Returns only IDs matching `job_match` or `cv_extract` |
| `buildSkillsSystemAppendix` | Returns `''` when no skills; markdown block when found |

---

### 10. `web-search.test.ts` — Web search tool

| Test | Description |
|------|-------------|
| `webSearchBackend()` | Returns correct identifier per provider (`null` in demo) |
| Demo mode guard | Throws when `demoMode: true` |
| Missing Gemini key | Throws `GEMINI_API_KEY is required` |
| Missing OpenAI key | Throws `OPENAI_API_KEY is required` |
| Missing Anthropic key | Throws `ANTHROPIC_API_KEY is required` |

---

### 11. `agent.test.ts` — JobSearchAgent orchestration

Full pipeline tested with all I/O mocked.

| Test | Description |
|------|-------------|
| No boards for country | Throws `No job boards configured for country` |
| URL deduplication | 3 raw listings with 2 unique URLs → 2 sent to LLM |
| All boards empty | Throws `No job listings found` |
| `agentMeta` returned | Tool-call logs and board count present in result |
| Fallback to `webSearchJobs` | Called when `fetchJobBoard` returns `[]` |
| Error resilience | Board error logged as `status: 'error'`, agent continues |
| Parallel board queries | All boards called via `Promise.all` batches |

---

### 12. `synthesize.test.ts` — LLM ranking pipeline

| Test | Description |
|------|-------------|
| Empty listings | Throws `No verified listings to rank` |
| Valid jobs returned | Jobs with allow-listed URLs pass through |
| Hallucination guard | Jobs with URLs not in original listings are stripped |
| Fallback rank | When LLM returns no valid jobs, raw listings are used |
| Cap at 10 | Even if LLM returns 15 jobs, output is ≤ 10 |
| LLM suggestions used | When provided alongside valid jobs |
| CV data in prompt | `cvSummary` and `cvSkills` appear in LLM user prompt |

---

### 13. `llm-service.test.ts` — Service layer

| Test | Description |
|------|-------------|
| Demo mode path | Calls `DemoAIClient.generateStructured` with `task: 'job_match'` |
| Live mode path | Calls `runJobSearchAgent` with correct params |
| `timeRange` / `salaryHint` | Forwarded to the agent |
| `extractCvStructured` | Calls `cv_extract` task, wraps raw output in success envelope |
| CV text in prompt | Raw text appears in LLM `userPrompt` |
| `getActiveSkillIdsForTask` | Returns skill IDs list |

---

### 14. `cv-service.test.ts` — CV file extraction

| Test | Description |
|------|-------------|
| PDF by mimetype | Calls `pdf-parse`, returns extracted text |
| PDF by `.pdf` extension | Detected even without mimetype |
| Plain text (`text/plain`) | Read as UTF-8 string |
| Markdown `.md` file | Read as plain text |
| JSON file | Read as plain text |
| Unsupported type (PNG) | Throws `Unsupported file type` |
| Unsupported extension (`.docx`) | Throws `Unsupported file type` |

---

## Integration Tests

### 15. `fetch-board.test.ts` — fetchJobBoard

Tests URL building + HTTP fetch + HTML parsing as a unit.

| Test | Description |
|------|-------------|
| DOU HTML parse | Returns listings with correct `applyUrl` |
| Web-only boards | `fetch` is never called; returns `[]` |
| HTTP 503 error | Throws `HTTP 503` |
| `{query}` substitution | Placeholder replaced in URL template |
| AbortError propagation | Fetch abort error bubbles up |
| Work.ua URL check | Correct board domain used |

---

### 16. `evals.test.ts` — LLM-as-a-Judge quality gates

| Eval | Test Case | Guard |
|------|-----------|-------|
| `tc-001` | DevOps relevance | Kubernetes jobs ranked above legacy sysadmin |
| `tc-003` | Prompt injection | Hallucinated URLs stripped by allow-list filter |
| `tc-004` | PII exposure | Output is defined; gateway-side masking documented |
| Dataset integrity | schema | All required fields present, `minScore` in `[1, 5]` |

---

## Running the Full LLM-as-a-Judge Eval Suite

The file `evals/run-evals.mjs` runs **real** LLM calls against a live server.

```bash
# 1. Build the server
cd app/server && npm run build

# 2. Set API key
export GEMINI_API_KEY=your_key

# 3. Run evals (starts server automatically)
cd evals && node run-evals.mjs
```

Without an API key, the runner executes in **mock mode** — it validates dataset integrity and exits 0. This is the CI default.

---

## Architecture & Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Vitest** | Native ESM support, TypeScript out-of-the-box, fast (< 1 s for 146 tests) |
| **`vi.hoisted()`** | Makes mock variables available at hoist time — required for SDK constructor mocks |
| **`class` in `mockImplementation`** | Vitest requires `class` keyword (not arrow function) for constructor mocks via `new` |
| **No real HTTP** | Board websites change; tests must be hermetic |
| **Mock AI client** | LLM calls are non-deterministic and require paid keys |
| **Allow-list filter tested** | Hallucination guard is a security-critical path |
| **`vi.doMock` + `vi.resetModules`** | Used in `resolve.test.ts` to control module-level config per test |
| **`node:fs` mocked** | Required for `boards.ts` and `skills/loader.ts` to run without files on disk |