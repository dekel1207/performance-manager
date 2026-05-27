# Cycle Loader — Shared Reference

## Purpose

Both `engineer-perf-review` and `manager-perf-review` resolve the active performance review cycle from the same file. This document defines that resolution logic.

## Cycle config file path

```
data/cycles.json
```
(relative to the project root — the directory where Claude Code is open)

## Resolution steps

1. Read `data/cycles.json`. If the file is absent or unreadable, stop immediately:
   > "Cannot find `data/cycles.json`. Please create it before running a review."
   Do not fall back to any hardcoded defaults.

2. If exactly one entry, auto-select silently and continue (no prompt).

3. If two or more entries, list them and ask the user to choose:
   ```
   Which cycle are you running?
   (1) Summer Round — Nov 1 2025 – Apr 30 2026
   (2) ...
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

## Example cycles.json

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

## Quarter detection from cycle window

To determine which OKR quarters fall within the cycle window:

1. Compare `cycle.start` and `cycle.end` against the `meta.quarters` in the project-tracker registry.
2. A quarter is "in window" if its date range overlaps with the cycle window (partial overlap counts).
3. If the registry does not cover the full window (e.g., missing an early quarter), warn:
   > "Warning: FY26Q4 OKR page is not in the registry. Coverage will be partial. Proceed or pause?"
