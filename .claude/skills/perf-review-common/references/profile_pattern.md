# Profile Pattern — Shared Reference

## Purpose

Both `engineer-perf-review` (uses `engineer_profiles.json`) and `manager-perf-review` (uses `manager_profiles.json`) follow the same merge semantics for profile files. This document defines those patterns.

## Profile file locations

```
data/engineer_profiles.json
data/manager_profiles.json
```

## Load behavior

- If the file exists, load it before asking the user for anything.
- Use cached fields silently — do not ask for values that are already present.
- Only ask for fields that are missing or explicitly corrected by the user.

## Merge semantics

When updating a profile:
1. If the file does not exist, create it with the new data.
2. If it exists, merge new fields into the existing entry — **never overwrite fields already present** unless the user explicitly corrects them.
3. Save immediately after collecting any new information — don't batch saves.

## Engineer profile structure

```json
{
  "Uriel": {
    "level": "Senior SE I",
    "jira_account_id": "712020:abc123",
    "jira_display_name": "Uriel Sharon",
    "github_username": "uriel-sharon",
    "slack_handle": "@uriel.sharon",
    "slack_channels": ["#team-canvas", "#pp-backend"],
    "one_on_one_doc_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
  }
}
```

## Manager profile structure

```json
{
  "Hannes": {
    "last_name": "Visagie",
    "level": "EM",
    "team_keys": ["CO"],
    "slack_handle": "@hannes.visagie",
    "slack_channels": ["#team-co", "#irt-co"],
    "one_on_one_doc_id": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
    "expectations_doc_path": "cycles/summer-2026/input/Hannes_Expectations_H1FY27.docx"
  },
  "JohnP": {
    "last_name": "Parsons",
    "level": "SEM",
    "team_keys": ["CDIT", "INF"],
    "slack_handle": "@john.parsons",
    "slack_channels": ["#team-cdit", "#team-inf", "#irt-cdit"],
    "one_on_one_doc_id": "...",
    "expectations_doc_path": null
  }
}
```

## Key fields for manager profiles

| Field | Description |
|-------|-------------|
| `last_name` | For file naming in output |
| `level` | `"EM"` or `"SEM"` — determines calibration bar |
| `team_keys` | Array — one key for EMs, two+ for SEMs. Must match registry |
| `slack_handle` | The manager's own Slack handle for personal signal pass |
| `slack_channels` | Channels to search for the manager's own Slack activity |
| `one_on_one_doc_id` | Google Doc ID for the 1:1 notes with Dekel |
| `expectations_doc_path` | Relative path to per-EM expectations doc in cycle input, or null |

## Coverage check (cache files)

Raw data files follow the pattern:
```
data/raw/<key>_<source>_<start>_<end>.json
```

Before any live query:
1. Check if the cache file exists for the full `cycle.start`–`cycle.end` range.
2. If it covers the full window — load it, skip the live query.
3. If it partially covers the window — load it, fetch only the uncovered range, merge (deduplicate), save the merged result with the full date range.
4. If it does not exist — run the full live query, save to cache.
