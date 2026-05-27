# Performance Manager — Claude Code Skills

Claude Code skills and scripts for running engineering performance review cycles. Covers both individual contributor (IC) engineers and Engineering Managers (EMs/SEMs).

## Skills

| Skill | Purpose |
|---|---|
| `engineer-perf-review` | IC engineer reviews — pulls JIRA, GitHub, Slack, 1:1 notes; outputs `.docx` |
| `manager-perf-review` | EM/SEM reviews — synthesizes OKRs, incidents, managing-up docs, 1:1 notes |
| `perf-review-common` | Shared references used by both skills (cycle loading, docx patterns, profile schema) |

## Setup

### 1. Install skills

Copy the `.claude/skills/` directory into your project, or symlink individual skills into `~/.claude/skills/` for global availability:

```bash
ln -s "$(pwd)/.claude/skills/engineer-perf-review" ~/.claude/skills/engineer-perf-review
ln -s "$(pwd)/.claude/skills/manager-perf-review" ~/.claude/skills/manager-perf-review
ln -s "$(pwd)/.claude/skills/perf-review-common" ~/.claude/skills/perf-review-common
```

### 2. Install script dependencies

```bash
cd scripts
npm install
```

### 3. Configure your data files

Copy the example files and fill in your team's details:

```bash
cp data/engineer_profiles.example.json data/engineer_profiles.json
cp data/manager_profiles.example.json data/manager_profiles.json
```

See the example files for the expected schema. These files are gitignored — never commit real profile data.

### 4. Configure your review cycle

Edit `data/cycles.json` to set the current cycle name, slug, and date range:

```json
[
  {
    "name": "Summer Round",
    "slug": "summer-2026",
    "start": "2025-11-01",
    "end": "2026-06-15"
  }
]
```

### 5. Required MCP integrations

The skills pull data from:
- **Jira** (via Atlassian MCP) — tickets and project activity
- **GitHub** (via `gh` CLI) — PR history
- **Slack** (via Slack MCP) — channel activity
- **Google Docs** (via GDocs MCP) — 1:1 notes and managing-up docs
- **Confluence** (via Atlassian MCP) — OKR pages
- **Datadog** (via Datadog MCP) — incident/IRT data (manager reviews)

Configure these MCPs in your Claude Code settings before running a review.

## Usage

Open Claude Code in this directory and ask naturally:

```
Write up Alice's perf review for the summer cycle.
Her JIRA username is alice.smith, GitHub is asmith-co, Slack is @alice.smith.
```

```
Do the EM reviews for the summer cycle for Carol and Dave.
```

The skills handle data collection, calibration against the Engineering Ladder, and `.docx` output automatically.

## Directory structure

```
.claude/skills/
  engineer-perf-review/   # IC review skill
  manager-perf-review/    # EM/SEM review skill
  perf-review-common/     # Shared references
data/
  cycles.json                      # Cycle configuration
  engineer_profiles.example.json   # Schema reference (copy → engineer_profiles.json)
  manager_profiles.example.json    # Schema reference (copy → manager_profiles.json)
scripts/
  generate_review.js      # docx generation script
```

## What's gitignored

- `data/engineer_profiles.json` — real team member details
- `data/manager_profiles.json` — real manager details
- `data/raw/` — scraped Confluence/Slack data
- `cycles/` — review input documents and generated output
- `.claude/settings.local.json` — personal MCP UUIDs and local paths
