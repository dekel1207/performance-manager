# Configurable JIRA Projects Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make JIRA project keys configurable per cycle in `cycles.json` instead of hardcoded as `PP` in the skill, with a setup prompt when the field is missing.

**Architecture:** Add a `jira_projects` array field to each cycle entry in `cycles.json`. The skill reads this after cycle selection, builds a dynamic JQL `project` clause, and asks the user to supply the keys if the field is absent — saving the answer back to `cycles.json` before continuing.

**Tech Stack:** Markdown skill files, JSON config files — no code compilation or test runner involved. Validation is done by reading the files and verifying correctness manually.

---

### Task 1: Update `cycles.json` to include `jira_projects`

**Files:**
- Modify: `data/cycles.json`

- [ ] **Step 1: Add `jira_projects` to `cycles.json`**

Edit `data/cycles.json` to add the field to the existing entry (the live file has `"end": "2026-06-15"`):

```json
[
  {
    "name": "Summer Round",
    "slug": "summer-2026",
    "start": "2025-11-01",
    "end": "2026-06-15",
    "jira_projects": ["PP"]
  }
]
```

- [ ] **Step 2: Verify the file is valid JSON**

```bash
python3 -c "import json; json.load(open('data/cycles.json')); print('valid')"
```
Expected: `valid`

- [ ] **Step 3: Commit**

```bash
git add data/cycles.json
git commit -m "feat: add jira_projects field to cycles.json"
```

---

### Task 2: Update `engineer-perf-review/SKILL.md` — cycle load section

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md`

The "Cycle configuration" section needs a step 5 for resolving `jira_projects`, and the Step 1 user prompt that mentions "JIRA project PP" needs to be generalized.

- [ ] **Step 1: Add `jira_projects` resolution to the "Cycle configuration" section**

Find this exact block (the `<cycle.end>` example uses `"2026-04-30"` in the skill — verify before editing):

```
4. Set these variables from the selected entry for use throughout the rest of the skill:
   - `<cycle.name>` — e.g. "Summer Round"
   - `<cycle.slug>` — e.g. "summer-2026"
   - `<cycle.start>` — e.g. "2025-11-01"
   - `<cycle.end>` — e.g. "2026-04-30"

Only consider data within `<cycle.start>` – `<cycle.end>`. Ignore anything outside this range.
```

Replace with:

```
4. Set these variables from the selected entry for use throughout the rest of the skill:
   - `<cycle.name>` — e.g. "Summer Round"
   - `<cycle.slug>` — e.g. "summer-2026"
   - `<cycle.start>` — e.g. "2025-11-01"
   - `<cycle.end>` — e.g. "2026-04-30"

5. Resolve `jira_projects` from the selected cycle entry:
   - If `jira_projects` is present and non-empty, set `<cycle.jira_projects>` silently and continue.
   - If `jira_projects` is absent or empty, ask the user:
     > "Which JIRA project key(s) should I search for this cycle? Enter one or more keys separated by commas (e.g. PP, GROW)."
   - Parse the response into an array of trimmed uppercase strings.
   - Save the array back to `data/cycles.json` under the selected cycle entry before proceeding.
   - Set `<cycle.jira_projects>` to this array.

Only consider data within `<cycle.start>` – `<cycle.end>`. Ignore anything outside this range.
```

- [ ] **Step 2: Generalize the "JIRA project PP" reference in the Step 1 user prompt**

In the Step 1 "Collect runtime inputs" section, find:

```
- JIRA username (the display name or account ID used in JIRA project PP)
```

Replace with:

```
- JIRA username (the display name or account ID used in the configured JIRA project(s))
```

- [ ] **Step 3: Update the Step 4 section heading**

Find:

```
## Step 4: Gather JIRA data (project PP)
```

Replace with:

```
## Step 4: Gather JIRA data
```

- [ ] **Step 4: Verify the edits look correct**

```bash
grep -n "project PP\|JIRA project PP" ".claude/skills/engineer-perf-review/SKILL.md"
```
Expected: no output

- [ ] **Step 5: Commit**

```bash
git add .claude/skills/engineer-perf-review/SKILL.md
git commit -m "feat: add jira_projects resolution to cycle config; generalize PP references"
```

---

### Task 3: Update `engineer-perf-review/SKILL.md` — JQL queries in Step 4

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md`

Replace the three hardcoded `project = PP` JQL clauses with a dynamic `<jira_project_clause>`, and add a note explaining how to build it.

- [ ] **Step 1: Add a JQL project clause note before the live queries section**

The find string is uniquified by the `mcp__atlassian__searchJiraIssuesUsingJql` tool name — there is only one such block in the file (the GitHub and Slack sections use different tools).

Find:

```
### Live queries (when cache miss or partial coverage)

Use the `mcp__atlassian__searchJiraIssuesUsingJql` tool. Run these queries for the **uncovered** date range only:
```

Replace with:

```
### Live queries (when cache miss or partial coverage)

Use the `mcp__atlassian__searchJiraIssuesUsingJql` tool. Run these queries for the **uncovered** date range only.

**Building the project clause:** Use `<cycle.jira_projects>` to construct the JQL project filter:
- Single project: `project = PP`
- Multiple projects: `project in (PP, GROW)`

Use `<jira_project_clause>` as a placeholder for this value in the queries below.
```

- [ ] **Step 2: Replace the three JQL `project = PP` clauses**

Replace each of the three query blocks. Do them one at a time to avoid ambiguity.

**Primary ownership query** — find:
```
project = PP AND assignee = "<jira_account_id>" AND status in (Done, Closed) AND resolutiondate >= "<fetch_start>" AND resolutiondate <= "<fetch_end>"
```
Replace with:
```
<jira_project_clause> AND assignee = "<jira_account_id>" AND status in (Done, Closed) AND resolutiondate >= "<fetch_start>" AND resolutiondate <= "<fetch_end>"
```

**Collaboration query** — find:
```
project = PP AND assignee = "<jira_account_id>" AND issueType in (Sub-task, Task) AND status in (Done, Closed) AND resolutiondate >= "<fetch_start>" AND resolutiondate <= "<fetch_end>"
```
Replace with:
```
<jira_project_clause> AND assignee = "<jira_account_id>" AND issueType in (Sub-task, Task) AND status in (Done, Closed) AND resolutiondate >= "<fetch_start>" AND resolutiondate <= "<fetch_end>"
```

**Initiative/proactiveness query** — find:
```
project = PP AND reporter = "<jira_account_id>" AND created >= "<fetch_start>" AND created <= "<fetch_end>"
```
Replace with:
```
<jira_project_clause> AND reporter = "<jira_account_id>" AND created >= "<fetch_start>" AND created <= "<fetch_end>"
```

- [ ] **Step 3: Verify no remaining `project = PP` literals exist in the skill**

```bash
grep -n "project = PP" ".claude/skills/engineer-perf-review/SKILL.md"
```
Expected: no output

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/engineer-perf-review/SKILL.md
git commit -m "feat: replace hardcoded project = PP with dynamic jira_project_clause in JQL"
```

---

### Task 4: Update `cycle_loader.md` shared reference

**Files:**
- Modify: `.claude/skills/perf-review-common/references/cycle_loader.md`

The shared cycle loader reference should document the `jira_projects` field so future skills can follow the same pattern. Note: the example in this file uses `"end": "2026-04-30"` — that is intentional (it's a generic example, not the live file's date).

- [ ] **Step 1: Add `jira_projects` resolution to `cycle_loader.md`**

Find:

```
4. Set these variables for use throughout the skill:
   - `<cycle.name>` — e.g. "Summer Round"
   - `<cycle.slug>` — e.g. "summer-2026"
   - `<cycle.start>` — e.g. "2025-11-01"
   - `<cycle.end>` — e.g. "2026-04-30"

Only consider data within `<cycle.start>` – `<cycle.end>`. Ignore anything outside this range.
```

Replace with:

```
4. Set these variables for use throughout the skill:
   - `<cycle.name>` — e.g. "Summer Round"
   - `<cycle.slug>` — e.g. "summer-2026"
   - `<cycle.start>` — e.g. "2025-11-01"
   - `<cycle.end>` — e.g. "2026-04-30"

5. Resolve `jira_projects` from the selected cycle entry:
   - If `jira_projects` is present and non-empty, set `<cycle.jira_projects>` silently and continue.
   - If `jira_projects` is absent or empty, ask the user:
     > "Which JIRA project key(s) should I search for this cycle? Enter one or more keys separated by commas (e.g. PP, GROW)."
   - Parse the response into an array of trimmed uppercase strings.
   - Save the array back to `data/cycles.json` under the selected cycle entry before proceeding.
   - Set `<cycle.jira_projects>` to this array.

Only consider data within `<cycle.start>` – `<cycle.end>`. Ignore anything outside this range.
```

- [ ] **Step 2: Update the example in `cycle_loader.md` to include `jira_projects`**

Find (this is the doc's own example — uses `"2026-04-30"`, not the live file date):

```json
[
  {
    "name": "Summer Round",
    "slug": "summer-2026",
    "start": "2025-11-01",
    "end": "2026-04-30"
  }
]
```

Replace with:

```json
[
  {
    "name": "Summer Round",
    "slug": "summer-2026",
    "start": "2025-11-01",
    "end": "2026-04-30",
    "jira_projects": ["PP"]
  }
]
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/perf-review-common/references/cycle_loader.md
git commit -m "docs: document jira_projects field in shared cycle_loader reference"
```

---

### Task 5: Final verification

- [ ] **Step 1: Confirm no remaining hardcoded `project = PP` or `project PP` references across skill files**

```bash
grep -rn "project = PP\|project PP\|JIRA project PP" ".claude/skills/"
```
Expected: exactly one hit — the illustrative `project = PP` example inside the "Building the project clause" note added in Task 3 Step 1. Any hit outside that block is a regression that must be fixed.

- [ ] **Step 2: Confirm `jira_projects` appears in all expected places**

```bash
grep -rn "jira_projects" ".claude/skills/" "data/"
```
Expected: matches in `SKILL.md`, `cycle_loader.md`, and `data/cycles.json`

- [ ] **Step 3: Confirm `cycles.json` is valid JSON**

```bash
python3 -c "import json; json.load(open('data/cycles.json')); print('valid')"
```
Expected: `valid`

- [ ] **Step 4: Confirm branch is clean**

```bash
git status
```
Expected: `nothing to commit, working tree clean`
