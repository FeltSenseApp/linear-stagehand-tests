# Stagehand E2E Test Findings

Findings from improving consistency, structure, and reliability of the Stagehand e2e test suite.

---

## 1. Prefer Stagehand Over Selectors

**What we did:** Removed all `page.$()` / `page.$$()` and CSS selector loops from tests and shared helpers.

**Why it helped:**
- Tests no longer depend on specific class names, `data-testid`, or DOM structure.
- UI changes (e.g. renaming a class) don’t break tests.
- One source of truth: natural-language instructions + `extract` schemas.

**Pattern:**
- **Interactions:** `page.act("Click the login button")` or `page.act({ action: "type %email% into the email field", variables: { email } })`.
- **Verification:** `page.extract({ instruction: "...", schema: z.object({ ... }) })` instead of querying for elements.

**Exception:** `page.url()` and `page.goto()` are still used; they’re not selectors.

---

## 2. Prefer `act()` Over `executeAction()` (Agent)

**What we did:** Replaced every `executeAction(stagehand, "…")` with `page.act("…")` or `page.act({ action, variables })`.

**Why it helped:**
- `act()` is a single-step, targeted action (faster, more predictable).
- `executeAction()` runs the full agent and is better for multi-step flows.
- For “click this”, “type here”, “submit”, `act()` is enough and gives more consistent results.

**When to use each:**
- **`page.act()`:** Single, clear action (click, type, select). Default choice.
- **`executeAction()` / agent:** Multi-step or exploratory flows when a single act isn’t enough.

---

## 3. Tight Assertions and Clear Failures

**What we did:** Removed “always pass” patterns and made preconditions and outcomes explicit.

**Anti-patterns we removed:**
- `expect(true).toBe(true)` when a precondition wasn’t met (e.g. no admin, no traces).
- Passing when “nothing to click” instead of failing with a clear message.
- Loose ORs that made tests pass when the intended behavior didn’t happen (e.g. “URL changed OR detail visible” when neither was true).

**Patterns that worked:**
- **Precondition not met:** `expect.fail("Clear reason (e.g. No traces in list; cannot verify trace detail.)")` instead of silently passing.
- **Access/feature checks:** If the test needs admin/traces/founders, check first and `expect.fail("Test requires …")` when not available.
- **Outcome:** Assert the real condition (e.g. `detailVisible` or URL change), not a no-op.

**Example (traces):**
```ts
if (!listState.hasTraceRows) {
  expect.fail("No traces in list; cannot verify trace detail. The test expects at least one trace row to click.");
  return;
}
// … act, then:
expect(urlChanged || detailCheck.detailVisible).toBe(true);
```

---

## 4. Use `observe()` When “First” Is Ambiguous

**What we did:** For “click the first idea card”, a single `page.act("…")` often clicked the wrong element (e.g. “Ideas” tab, search, filter) because the a11y tree’s “first” match wasn’t the card. We switched to `observe()` then `act(observed)`.

**Why it helped:**
- `observe()` returns concrete elements (with selector) for a given instruction.
- We can phrase the instruction so it targets the right region (e.g. “in the list below the stats”) and excludes tabs/search/filters.
- Then `page.act(actions[0])` clicks that element, so behavior is consistent.

**Pattern:**
```ts
const actions = await page.observe(
  "Find the first idea card in the list below the stats (not the Ideas tab, search, or filter buttons)"
);
if (!actions.length) {
  expect.fail("No idea card found to click.");
  return;
}
await page.act(actions[0]);
```

**When to use:**
- Use **`observe()` + `act(result)`** when the page has many clickables and “first” would be wrong (tabs, headers, filters).
- Use **`page.act("…")`** when the instruction unambiguously identifies one element (e.g. “Click the login button” on a login page).

---

## 5. Login and Shared Auth Without Selectors

**What we did:** `loginDirect()` in `utils/auth.ts` now uses `page.act()` with variables instead of selector fallbacks.

**Pattern:**
```ts
await page.act({ action: "type %email% into the email input field", variables: { email } });
await page.act({ action: "type %password% into the password field", variables: { password } });
await page.act("click the login button");
```

**Why it helped:** Same as §1: no brittle selectors, credentials stay out of the raw prompt via variables.

---

## 6. Logging and Debugging

**What we did:** Env-driven verbosity and optional inference dumps; one test (ideas click) briefly used a screenshot on failure.

**Options that worked:**
- **`STAGEHAND_VERBOSE=2`** – Act/extract start and end, DOM/LLM details in the terminal.
- **`STAGEHAND_LOG_INFERENCE=1`** – Writes LLM request/response files under `./inference_summary/` (act, extract) for debugging wrong element or wrong extract.
- **`BROWSERBASE_CONFIG_DIR=~/.config/browserbase`** – Session logs (`llm_events.log`, `cdp_events.log`, `stagehand.log`); `tail -f …/sessions/latest/*.log` for live trace.
- **Screenshot on failure** – For a flaky test, saving `screenshots/ideas-click-failure.png` on assert failure helped confirm the click target (removed once we fixed the test with observe+act).

**Scripts:** `test:stagehand:ideas` and `test:stagehand:ideas:debug` (with `STAGEHAND_VERBOSE=2`) to run only ideas tests with verbose logging.

---

## 7. Test Structure Conventions

**Common shape:**
1. **Setup:** `page.goto(url)`, `page.waitForLoadState("networkidle")`.
2. **Precondition (if needed):** `page.extract({ … })` and, if not met, `expect.fail("…")` and `return`.
3. **Action:** `page.act("…")` or `page.observe("…")` then `page.act(actions[0])`.
4. **Stabilize:** `page.waitForLoadState("networkidle")` and/or short `page.waitForTimeout(...)` if the UI needs a moment (e.g. modal open).
5. **Assert:** `page.extract({ … })` and `expect(...).toBe(true)` (or equivalent).

**Keep tests lean:**
- Short, precise instructions for act/observe/extract.
- One main assertion per test (or one logical group).
- No redundant extract (e.g. we dropped a separate “hasClickableIdeas” when `observe()` already tells us).

**Suite-level:**
- `beforeAll`: create Stagehand, `ensureAuthenticated(stagehand)`.
- `afterAll`: `stagehand.close()`.
- Access/feature flags (e.g. `hasAccess`, `isAdmin`) set once in `beforeAll` and used to `expect.fail` in tests that require them.

---

## Summary Table

| Practice | Benefit |
|----------|---------|
| No selectors; use act + extract | Resilient to DOM/class renames; consistent behavior |
| Prefer `act()` over `executeAction()` | Faster, more predictable single-step actions |
| `expect.fail()` when precondition not met | Clear failures instead of false passes |
| `observe()` then `act(result)` for ambiguous “first” | Correct click target (e.g. idea card vs tab) |
| Env-based verbose + inference logs | Easy debugging of act/extract and LLM choices |
| Short instructions and one main assertion per test | Readable, maintainable suite |

These findings are reflected in the current `tests/stagehand/e2e/` and `tests/stagehand/utils/auth.ts` implementation.

---

## 8. AI-Generated Tests from Git Diffs / PRs (Possible Automation)

**Idea:** Use an AI agent to propose new or updated Stagehand e2e tests based on: git diff (or changed files), PR title/description/labels, this findings doc, and 1–2 existing test files as examples.

**Why it fits:**
- Tests are instruction-based (act/extract/observe); the model does not need to infer CSS selectors from app code.
- Structure is fixed (see §7), so the agent can follow a template.
- Findings give clear rules (no selectors, prefer act, observe when "first" is ambiguous, expect.fail when precondition fails).

**Inputs:** Diff or summary of changed routes/features; PR title and description; `docs/STAGEHAND-FINDINGS.md`; 1–2 existing test files (e.g. `ideas.test.ts`, `founder-details.test.ts`) for imports and structure.

**Output:** Draft test file or new `it(...)` blocks using `page.goto`, `page.act()` or `page.observe()` + `page.act(actions[0])`, `page.extract()`, and `expect.fail()` when preconditions are not met.

**Where it could run:** Cursor/IDE (manual prompt or rule); a CLI script with `--diff` / `--pr-body` that writes a draft; or a GitHub Action that comments with suggested test code or opens a draft PR.

**Caveats:** Review generated act/extract instructions and routes (model may not know exact URLs/copy). Run the test and use §6 (verbose, inference logs) if it fails.

**Prompt shape:** Tell the agent to follow `docs/STAGEHAND-FINDINGS.md`, provide the diff and PR body, and reference 1–2 existing tests. Ask for Vitest + Stagehand code that uses createStagehand, ensureAuthenticated, BASE_URL, TEST_TIMEOUT; page.act / page.observe + page.act(result) / page.extract with z.object; expect.fail() for unmet preconditions; no page.$() or page.$$(); and the structure in §7.
