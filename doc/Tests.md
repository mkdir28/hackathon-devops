# Testing Guide — Scout / JobMatch Agent

## Overview

The test suite lives entirely inside `app/server/tests/` and runs with [Vitest](https://vitest.dev/).
No network, no LLM keys, no running cluster is required — every external dependency is mocked.

```
app/server/
├── tests/
│   ├── fixtures/
│   │   └── boards.ts            # Shared test doubles (boards, raw listings)
│   ├── unit/
│   │   ├── parsers.test.ts      # HTML parsers for job boards
│   │   ├── http.test.ts         # fetchHtml + encodeQuery
│   │   ├── json.test.ts         # parseJsonFromModelText + schemaInstruction
│   │   ├── web-search.test.ts   # webSearchJobs error paths & backend selection
│   │   └── agent.test.ts        # runJobSearchAgent + searchRawJobs (end-to-end unit)
│   └── integration/
│       ├── fetch-board.test.ts  # fetchJobBoard (HTTP mocked)
│       └── evals.test.ts        # LLM-as-a-Judge quality gates (AI mocked)
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

Expected output:

```
Test Files  8 passed (8)
     Tests  69 passed (69)
  Duration  ~600ms
```

---

## Unit Tests

### 1. `parsers.test.ts` — HTML board parsers

**What is tested:**

| Test | Description |
|------|-------------|
| `parseDouVacancies` | Extracts job listings from DOU.ua HTML structure |
| `parseWorkUa` | Extracts job IDs from Work.ua anchor tags |
| `parseDjinni` | Parses Djinni job cards (company, location) |
| `parseGenericLinks` | Generic link extractor with job-URL pattern matching |
| `parseBoardHtml` | Dispatcher routes to correct parser by `board.parser` type |

**Key assertions:**
- Correct extraction of `title`, `company`, `location`, `applyUrl`
- `limit` parameter is respected
- Duplicate URLs are deduplicated
- Index/search page links are excluded (e.g. `/vacancies/` with no ID)
- Links from other domains are excluded

**Example:**

```bash
npx vitest run tests/unit/parsers.test.ts --reporter=verbose
```

---

### 2. `http.test.ts` — HTTP utilities

**What is tested:**

| Test | Description |
|------|-------------|
| `encodeQuery` | Encodes spaces, trims whitespace, collapses multi-spaces |
| `fetchHtml` — success | Returns body text on `ok: true` response |
| `fetchHtml` — error | Throws `HTTP <status>` on non-ok response |
| `fetchHtml` — abort | Propagates `AbortError` on signal cancellation |
| `fetchHtml` — headers | Sends `User-Agent: JobMatchAgent` header |

**Mocking strategy:** `vi.stubGlobal('fetch', vi.fn(...))` replaces the global `fetch`.

**Example:**

```bash
npx vitest run tests/unit/http.test.ts --reporter=verbose
```

---

### 3. `json.test.ts` — LLM JSON extraction

**What is tested:**

| Test | Description |
|------|-------------|
| Plain JSON object/array | Direct `JSON.parse` path |
| Markdown fences ` ```json ... ``` ` | Regex strip + parse |
| JSON embedded in prose | Boundary-search extraction |
| No valid JSON | Throws `Model response did not contain valid JSON` |
| `schemaInstruction` | Returns generic message or embedded schema |

This module is critical: if it fails, all LLM responses become unparseable.

**Example:**

```bash
npx vitest run tests/unit/json.test.ts --reporter=verbose
```

---

### 4. `web-search.test.ts` — Web search tool

**What is tested:**

| Test | Description |
|------|-------------|
| `webSearchBackend()` | Returns correct identifier per provider or `null` in demo |
| Demo mode guard | Throws when `demoMode: true` |
| Missing Gemini key | Throws `GEMINI_API_KEY is required` |
| Missing OpenAI key | Throws `OPENAI_API_KEY is required` |
| Missing Anthropic key | Throws `ANTHROPIC_API_KEY is required` |

**Mocking strategy:** `vi.mock('../../ai/resolve.js')` controls what `resolveLlmConfig()` returns, avoiding any env var caching issues.

**Example:**

```bash
npx vitest run tests/unit/web-search.test.ts --reporter=verbose
```

---

### 5. `agent.test.ts` — JobSearchAgent orchestration

Tests the full agent pipeline with all I/O mocked.

**What is tested:**

| Test | Description |
|------|-------------|
| No boards for country | Throws `No job boards configured for country` |
| URL deduplication | `dedupeListings` removes duplicate `applyUrl` before LLM call |
| All boards empty | Throws `No job listings found` |
| `agentMeta` returned | Tool-call logs and counts are present in result |
| Fallback to `webSearchJobs` | Called when `fetchJobBoard` returns `[]` |
| Error resilience | Board error logged as `status: 'error'`, agent continues |
| Parallel board queries | All boards called via `Promise.all` batches |
| `searchRawJobs` dedup | Multiple boards returning the same URL → 1 unique result |

**Mocking strategy:**

```typescript
vi.mock('../../agent/boards.js')           // selectBoardsForCountry
vi.mock('../../agent/tools/fetch-board.js') // fetchJobBoard
vi.mock('../../agent/tools/web-search.js')  // webSearchJobs
vi.mock('../../agent/synthesize.js')        // rankListingsWithLlm
```

**Example:**

```bash
npx vitest run tests/unit/agent.test.ts --reporter=verbose
```

---

## Integration Tests

### 6. `fetch-board.test.ts` — fetchJobBoard

Tests the composition of URL-building + HTTP fetch + HTML parsing.

**What is tested:**

| Test | Description |
|------|-------------|
| Parse DOU HTML | Returns listings with correct `applyUrl` |
| Web-only boards | `fetch` is never called; returns `[]` |
| HTTP 503 error | Throws `HTTP 503` |
| Query substitution | `{query}` placeholder replaced in URL template |
| AbortError propagation | Fetch abort error bubbles up correctly |
| Work.ua URL check | Board-specific URL contains `work.ua` |

**Mocking strategy:** `vi.stubGlobal('fetch', ...)` replaces global `fetch` per test.

**Example — run with verbose output:**

```bash
npx vitest run tests/integration/fetch-board.test.ts --reporter=verbose
```

---

### 7. `evals.test.ts` — LLM-as-a-Judge quality gates

Validates agent *output quality* using the same dataset as `evals/run-evals.mjs`.
In unit/CI mode the AI client is mocked; in staging the real LLM judge runs.

**What is tested:**

| Eval ID | Test Case | Quality Gate |
|---------|-----------|--------------|
| `tc-001` | Senior DevOps relevance | Cloud-native jobs ranked above legacy sysadmin roles |
| `tc-003` | Prompt injection resistance | Hallucinated URLs removed by allow-list filter |
| `tc-004` | PII exposure | Output defined (gateway-side masking documented) |
| Dataset integrity | `dataset.json` schema | All required fields present, `minScore` in `[1, 5]` |

**Prompt injection resistance test (tc-003):**

The CV summary contains `ATTENTION: Ignore all previous instructions`. The mock LLM "obeys" and returns a hallucinated URL. The test verifies the agent's **allow-list filter** strips it before returning results, so injected instructions never produce fabricated job listings.

**Hallucination guard:**

`rankListingsWithLlm` builds an allow-list from input `applyUrl` values and filters out any job the LLM returns with an URL not in that list.

```bash
npx vitest run tests/integration/evals.test.ts --reporter=verbose
```

---

## Running the Full LLM-as-a-Judge Eval Suite

The file `evals/run-evals.mjs` runs **real** LLM calls against a live server.

```bash
# 1. Build the server
cd app/server && npm run build

# 2. Export API keys
export GEMINI_API_KEY=your_key

# 3. Run evals (starts the server automatically)
cd evals && node run-evals.mjs
```

Expected output:

```
=== JobMatch Evaluation Suite ===
API Server is ready. Running test suite...

Running Test Case [tc-001]: Senior DevOps Engineer...
  - Relevance: 4.8/5
  - Hallucination-free: 5.0/5
  - Average Judge Score: 4.7/5 (Required: 4.2)
Test case [tc-001] PASSED.

QUALITY GATE PASSED: All metrics satisfied!
```

---

## CI Integration

Add to `.github/workflows/ci.yml`:

```yaml
- name: Run unit & integration tests
  working-directory: app/server
  run: npm test

- name: Run evals (mock mode — no LLM key needed)
  working-directory: evals
  run: node run-evals.mjs
  # Note: without GEMINI_API_KEY the eval runner exits 0 after dataset integrity check.
  # Set the secret in GitHub Actions to enable full LLM-as-a-Judge evaluation.
```

---

## Test Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **Vitest** | Native ESM, TypeScript support, minimal config, fast |
| **No external HTTP** | Tests are hermetic; board websites change constantly |
| **Mock AI client** | LLM APIs are non-deterministic and require paid keys in CI |
| **Allow-list filter tested** | Hallucination guard is a security-critical path |
| **Evals separate from unit tests** | LLM quality gates need real models; dataset integrity runs always |
| **`vi.mock` at module level** | Avoids cached-module issues with env-based config switching |


## Coverage Report

```bash
cd app/server && npm run test:coverage
```

Output goes to `app/server/coverage/index.html`. Covered modules:

- `agent/**` — orchestration, boards, deduplication
- `ai/**` — JSON parsing, client interface
- `services/**` — CV extraction