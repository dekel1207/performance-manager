# Configurable Cycle Dates — Design Spec

**Date:** 2026-05-26  
**Project:** Performance Manager  
**Skill affected:** `engineer-perf-review`

---

## Problem

The `engineer-perf-review` skill has cycle name and date range hardcoded in its `## Performance cycle defaults` block (`Summer Round`, `Nov 1 – Apr 30`). Adding a new review cycle requires editing the skill file directly. All hardcoded `summer-2026` path references must also be manually updated.

## Goal

Make the cycle name, date range, and output folder slug configurable without touching the skill file. Adding a new cycle should require only appending a JSON entry to a config file.

---

## Solution

### 1. Central config file

**Path:** `data/cycles.json`

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

**Fields:**

| Field | Description |
|-------|-------------|
| `name` | Human-readable cycle name shown to the user |
| `slug` | Folder name used in `cycles/<slug>/input/` and `cycles/<slug>/output/` |
| `start` | ISO date (YYYY-MM-DD) — inclusive start of the review window |
| `end` | ISO date (YYYY-MM-DD) — inclusive end of the review window |

---

### 2. Skill startup — cycle selection (Step 0, first action)

Before loading engineer profiles or doing anything else:

1. Read `data/cycles.json`. If the file is absent or unreadable, stop immediately and tell the user: "Cannot find `data/cycles.json`. Please create it before running a review." Do not fall back to any hardcoded defaults.
2. If the file contains exactly one entry, auto-select it silently and continue (no prompt shown).
3. If the file contains two or more entries, present the list and ask the user to choose:
   > "Which cycle are you running?  
   > (1) Summer Round — Nov 1 2025 – Apr 30 2026"
4. The selected cycle's `name`, `start`, `end`, and `slug` are resolved into variables used throughout the rest of the skill.

---

### 3. Skill changes

| What | Current | After |
|------|---------|-------|
| Performance cycle defaults block | Hardcoded name + dates | Removed; replaced by runtime resolution from config |
| Date filter in all JIRA/GitHub/Slack queries | `2025-11-01` / `2026-04-30` | `<cycle.start>` / `<cycle.end>` |
| Raw cache file paths | `data/raw/Uriel_jira_assigned_2025-11-01_2026-04-30.json` | Same pattern, dates from selected cycle |
| Cycle folder paths | `cycles/summer-2026/input/` | `cycles/<cycle.slug>/input/` |
| Output file paths | `cycles/summer-2026/output/<engineer_name>_2025-11-01_2026-04-30.docx` | `cycles/<cycle.slug>/output/<engineer_name>_<cycle.start>_<cycle.end>.docx` |
| Engineering Ladder path | `cycles/summer-2026/input/Engineering Ladder.docx` | `cycles/<cycle.slug>/input/Engineering Ladder.docx` |

---

### 4. Adding a new cycle

No skill edits required. Simply append to `data/cycles.json`:

```json
{
  "name": "Winter Round",
  "slug": "winter-2026",
  "start": "2026-05-01",
  "end": "2026-10-31"
}
```

Then create the folder structure:
```
cycles/winter-2026/input/   ← place Engineering Ladder.docx here
cycles/winter-2026/output/  ← reviews will be written here
```

---

## Out of scope

- Validation of date ranges or overlapping cycles
- UI for managing cycles
- Per-engineer cycle overrides
