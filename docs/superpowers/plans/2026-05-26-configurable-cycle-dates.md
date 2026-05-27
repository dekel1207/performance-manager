# Configurable Cycle Dates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded cycle name, dates, and folder paths in `engineer-perf-review/SKILL.md` with a runtime lookup against `data/cycles.json`, so adding a new review cycle requires only appending a JSON entry — no skill edits.

**Architecture:** A new `data/cycles.json` file holds all cycle definitions. At skill startup (before any other action), the skill reads this file, selects or auto-selects a cycle, and uses the resolved `name`/`start`/`end`/`slug` values everywhere hardcoded strings currently appear.

**Tech Stack:** Plain JSON config file, Markdown skill file edits only — no code changes.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `data/cycles.json` | **Create** | New config file with the existing Summer Round entry |
| `.claude/skills/engineer-perf-review/SKILL.md` | **Modify** | Remove hardcoded defaults block; add cycle-selection step; replace all hardcoded dates and `summer-2026` slugs with variable references |

---

### Task 1: Create `data/cycles.json`

**Files:**
- Create: `data/cycles.json`

- [ ] **Step 1: Create the file**

Write this content to `/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/data/cycles.json`:

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

- [ ] **Step 2: Verify the file was written correctly**

Run:
```bash
cat "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/data/cycles.json"
```
Expected: the four-field JSON array above, valid JSON, no syntax errors.

---

### Task 2: Replace the "Performance cycle defaults" block in SKILL.md

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (lines 11–16)

The current block to remove:
```markdown
## Performance cycle defaults
- Cycle name: **Summer Round**
- Default dates: **Nov 1 – Apr 30** (spanning the prior fall through spring)
- Only consider data within this window — JIRA tickets resolved, GitHub PRs merged/reviewed, Slack messages, and 1:1 notes entries must all fall within Nov 1 – Apr 30. Ignore anything outside this range.
- These can be overridden at runtime if the user specifies different dates.
```

- [ ] **Step 1: Replace the defaults block with cycle-selection instructions**

Replace the block above (lines 11–16 in SKILL.md) with this new section:

```markdown
## Cycle configuration

Cycle name, dates, and output folder are defined in:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/data/cycles.json
```

At skill startup, before doing anything else, resolve the active cycle:

1. Read `data/cycles.json`. If the file is absent or unreadable, stop immediately and tell the user: "Cannot find `data/cycles.json`. Please create it before running a review." Do not fall back to any hardcoded defaults.
2. If the file contains exactly one entry, auto-select it silently and continue (no prompt shown).
3. If the file contains two or more entries, list them and ask the user to choose:
   > "Which cycle are you running?
   > (1) Summer Round — Nov 1 2025 – Apr 30 2026
   > (2) ..."
4. Set these variables from the selected entry for use throughout the rest of the skill:
   - `<cycle.name>` — e.g. "Summer Round"
   - `<cycle.slug>` — e.g. "summer-2026"
   - `<cycle.start>` — e.g. "2025-11-01"
   - `<cycle.end>` — e.g. "2026-04-30"

Only consider data within `<cycle.start>` – `<cycle.end>`. Ignore anything outside this range.
```

- [ ] **Step 2: Verify the replacement looks correct**

Read lines 1–35 of SKILL.md and confirm:
- The old "Performance cycle defaults" heading and its four bullets are gone
- The new "Cycle configuration" section is present with all four steps
- The `<cycle.name>`, `<cycle.slug>`, `<cycle.start>`, `<cycle.end>` variable names are defined

---

### Task 3: Update Step 0 heading reference and load instruction

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (the Step 0 section)

Step 0 currently says "Before asking the user for anything, check for persisted state…". We need to insert a note that cycle selection happens before Step 0.

- [ ] **Step 1: Add cycle-selection-first note to Step 0**

Find this line in SKILL.md:
```
## Step 0: Load engineer profiles and raw data cache

Before asking the user for anything, check for persisted state in two locations:
```

Replace it with:
```
## Step 0: Load cycle config, engineer profiles, and raw data cache

Before asking the user for anything:
1. Complete the cycle selection described in "Cycle configuration" above — this must happen first.
2. Then check for persisted state in two locations:
```

- [ ] **Step 2: Verify**

Read the Step 0 section and confirm the cycle-selection-first note is present and the rest of Step 0 is unchanged.

---

### Task 4: Update raw cache filename example (Step 0, line ~58)

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (Step 0 section, line ~58)

Current hardcoded example filename:
```
data/raw/Uriel_jira_assigned_2025-11-01_2026-04-30.json
```

- [ ] **Step 1: Replace the hardcoded date in the example filename**

Find:
```
data/raw/Uriel_jira_assigned_2025-11-01_2026-04-30.json
```

Replace with:
```
data/raw/Uriel_jira_assigned_<cycle.start>_<cycle.end>.json
```

- [ ] **Step 2: Verify**

Confirm `2025-11-01` and `2026-04-30` no longer appear in the Step 0 raw cache directory section.

---

### Task 5: Update date references in Step 1 (collect runtime inputs, line ~85)

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (Step 1 section, line ~85)

Current hardcoded text:
```
- Cycle start/end dates (default: Nov 1 – Apr 30)
```

- [ ] **Step 1: Replace the hardcoded date default in Step 1**

Find:
```
- Cycle start/end dates (default: Nov 1 – Apr 30)
```

Replace with:
```
- Cycle start/end dates (resolved from `data/cycles.json` — do not ask the user for these)
```

- [ ] **Step 2: Verify**

Read the Step 1 section and confirm the old `Nov 1 – Apr 30` default text is gone.

---

### Task 6: Replace hardcoded Engineering Ladder path (Step 2, lines ~98–105)

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (Step 2 section, lines ~98–105)

Current hardcoded path:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/input/Engineering Ladder.docx
```

And the pandoc command:
```bash
pandoc "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/input/Engineering Ladder.docx" -o /tmp/eng_ladder.md
```

- [ ] **Step 1: Replace both occurrences in Step 2**

Replace the hardcoded path:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/input/Engineering Ladder.docx
```
with:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/<cycle.slug>/input/Engineering Ladder.docx
```

Replace the pandoc command:
```bash
pandoc "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/input/Engineering Ladder.docx" -o /tmp/eng_ladder.md
```
with:
```bash
pandoc "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/<cycle.slug>/input/Engineering Ladder.docx" -o /tmp/eng_ladder.md
```

- [ ] **Step 2: Verify**

Search SKILL.md for `summer-2026` — it should not appear in Step 2 anymore. Confirm `<cycle.slug>` appears in both the path and the pandoc command.

---

### Task 7: Update partial-coverage example in JIRA cache section (Step 4, lines ~162–164)

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (Step 4 section, lines ~162–164)

These lines contain hardcoded dates in a partial-coverage illustration:
```
(e.g. cached `2025-11-01` to `2026-03-31`, but cycle needs `2025-11-01` to `2026-04-30`)
```
and:
```
2. Fetch only the uncovered date range (e.g. `2026-04-01` to `2026-04-30`).
```

- [ ] **Step 1: Replace the partial-coverage example dates**

Find:
```
**If a cache file exists but only partially covers the requested window** (e.g. cached `2025-11-01` to `2026-03-31`, but cycle needs `2025-11-01` to `2026-04-30`):
1. Load the cached records.
2. Fetch only the uncovered date range (e.g. `2026-04-01` to `2026-04-30`).
```

Replace with:
```
**If a cache file exists but only partially covers the requested window** (e.g. cached from `<cycle.start>` to mid-cycle, but the full `<cycle.end>` is needed):
1. Load the cached records.
2. Fetch only the uncovered date range (e.g. from mid-cycle to `<cycle.end>`).
```

- [ ] **Step 2: Verify**

Confirm `2025-11-01` and `2026-04-30` no longer appear in the Step 4 JIRA cache section.

---

### Task 8: Update hardcoded date reference in Step 7 digest template

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (Step 7 section, line ~344)

Current hardcoded text in the digest format example:
```
Review Period: Nov 1 [YYYY] – Apr 30 [YYYY]
```

And in the "What to exclude" note:
```
- Events or data outside the Nov 1 – Apr 30 window
```

- [ ] **Step 1: Replace both occurrences**

Replace:
```
Review Period: Nov 1 [YYYY] – Apr 30 [YYYY]
```
with:
```
Review Period: <cycle.start> – <cycle.end>
```

Replace:
```
- Events or data outside the Nov 1 – Apr 30 window
```
with:
```
- Events or data outside the <cycle.start> – <cycle.end> window
```

- [ ] **Step 2: Verify**

Search SKILL.md for `Nov 1` and `Apr 30` — neither should appear in Step 7 anymore.

---

### Task 9: Update hardcoded paths in Step 7b (evidence file)

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (Step 7b section, lines ~388–394)

Current hardcoded paths:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/output/<FirstName>_<LastName>_<CycleStartDate>_<CycleEndDate>_evidence.md
```
and the example:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/output/Uriel_Silva_2025-11-01_2026-04-30_evidence.md
```

- [ ] **Step 1: Replace both paths**

Replace the file path template:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/output/<FirstName>_<LastName>_<CycleStartDate>_<CycleEndDate>_evidence.md
```
with:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/<cycle.slug>/output/<FirstName>_<LastName>_<cycle.start>_<cycle.end>_evidence.md
```

Replace the example path:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/output/Uriel_Silva_2025-11-01_2026-04-30_evidence.md
```
with:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/<cycle.slug>/output/Uriel_Silva_<cycle.start>_<cycle.end>_evidence.md
```

- [ ] **Step 2: Verify**

Read the Step 7b section and confirm both paths use `<cycle.slug>`, `<cycle.start>`, `<cycle.end>`.

---

### Task 10: Update hardcoded references in Step 9 (team comparison)

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (Step 9 section, line ~495)

Current hardcoded text:
```
## Team Comparison — Summer Round [YYYY]
```

- [ ] **Step 1: Replace the hardcoded cycle name**

Replace:
```
## Team Comparison — Summer Round [YYYY]
```
with:
```
## Team Comparison — <cycle.name> [YYYY]
```

- [ ] **Step 2: Verify**

Read the Step 9 section and confirm `Summer Round` is replaced with `<cycle.name>`.

---

### Task 11: Update hardcoded paths in Step 10 (.docx output)

**Files:**
- Modify: `.claude/skills/engineer-perf-review/SKILL.md` (Step 10 section, lines ~514–528)

Current hardcoded paths and text:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/output/<FirstName>_<LastName>_<CycleStartDate>_<CycleEndDate>.docx
```
Example path:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/output/Uriel_Silva_2025-11-01_2026-04-30.docx
```
Review period header in the document:
```
- **Review period** (e.g. "Nov 1, 2025 – Apr 30, 2026 · Summer Round")
```

- [ ] **Step 1: Replace the file path template**

Replace:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/output/<FirstName>_<LastName>_<CycleStartDate>_<CycleEndDate>.docx
```
with:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/<cycle.slug>/output/<FirstName>_<LastName>_<cycle.start>_<cycle.end>.docx
```

- [ ] **Step 2: Replace the example path**

Replace:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/output/Uriel_Silva_2025-11-01_2026-04-30.docx
```
with:
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/<cycle.slug>/output/Uriel_Silva_<cycle.start>_<cycle.end>.docx
```

- [ ] **Step 3: Replace the hardcoded review period example in the document header**

Replace:
```
- **Review period** (e.g. "Nov 1, 2025 – Apr 30, 2026 · Summer Round")
```
with:
```
- **Review period** (e.g. "<cycle.start> – <cycle.end> · <cycle.name>")
```

- [ ] **Step 4: Verify — final sweep for any remaining hardcoded values**

Run:
```bash
grep -n "summer-2026\|2025-11-01\|2026-04-30\|Summer Round" \
  "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/.claude/skills/engineer-perf-review/SKILL.md"
```

Expected: **zero matches**. All four of these strings must be gone — replaced with `<cycle.slug>`, `<cycle.start>`, `<cycle.end>`, or `<cycle.name>`.

Note: `Nov 1`, `Apr 30`, `Nov 2025`, `Apr 2026` will still appear in the OKR section as historical business context dates — that is intentional. This grep deliberately excludes those patterns. If the grep above returns zero, the task is complete.

If any of the four prohibited strings remain, fix them before continuing.

---

### Task 12: Smoke test — read the skill as if starting a new review session

This is a manual verification step. No file changes.

- [ ] **Step 1: Read the full updated SKILL.md and mentally trace through a new session**

Check that:
1. The first thing the skill does is read `data/cycles.json` (Cycle configuration section)
2. Step 0 explicitly says cycle selection comes first
3. Every path that was `cycles/summer-2026/...` now uses `cycles/<cycle.slug>/...`
4. Every date that was `2025-11-01` / `2026-04-30` now uses `<cycle.start>` / `<cycle.end>`
5. The digest template says `<cycle.start> – <cycle.end>` not `Nov 1 – Apr 30`
6. Step 9 team comparison header uses `<cycle.name>`
7. `data/cycles.json` exists and contains the Summer Round entry

- [ ] **Step 2: Confirm `data/cycles.json` exists**

Run:
```bash
cat "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/data/cycles.json"
```
Expected: valid JSON array with the Summer Round entry.

- [ ] **Step 3: Confirm Step 0 heading was updated**

Run:
```bash
grep "Load cycle config" "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/.claude/skills/engineer-perf-review/SKILL.md"
```
Expected: one match — `## Step 0: Load cycle config, engineer profiles, and raw data cache`

- [ ] **Step 4: Confirm the skill file has no stale hardcoded values**

Run:
```bash
grep -n "summer-2026\|2025-11-01\|2026-04-30\|Summer Round" \
  "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/.claude/skills/engineer-perf-review/SKILL.md"
```
Expected: **zero matches**. These strings must not appear anywhere in the file — all occurrences were replaced with `<cycle.slug>`, `<cycle.start>`, `<cycle.end>`, or `<cycle.name>`.

Note: `Nov 1`, `Apr 30`, `Nov 2025`, `Apr 2026` may still appear in the OKR section as historical business dates — that is intentional and acceptable. Only the four strings above are prohibited.
