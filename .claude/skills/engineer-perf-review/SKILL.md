---
name: engineer-perf-review
description: >
  Evaluates individual software engineers (ICs) for a Braze performance review cycle and produces structured written reviews. Use this skill whenever the user asks to evaluate, review, assess, or write up performance for an engineer or a group of engineers — even if they say things like "write up a review for X", "assess how Y is doing", "compare my engineers", "do the perf cycle for the team", or "help me with performance reviews". This skill orchestrates gathering data from JIRA, GitHub, Slack, and 1:1 notes, calibrates against the Engineering Ladder, and outputs both a chat summary and a .docx file. Always invoke this skill when performance review or engineer evaluation is mentioned.
---

# Engineer Performance Review Skill

You are helping an engineering manager at Braze evaluate individual ICs for a performance review cycle. Your output for each engineer is a structured, evidence-backed written review calibrated against the Braze Engineering Ladder.

## Cycle configuration

Cycle name, dates, and output folder are defined in:
```
data/cycles.json
```
(relative to the project root — the directory where Claude Code is open)

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

5. Resolve `jira_projects` from the selected cycle entry:
   - If `jira_projects` is present and non-empty, set `<cycle.jira_projects>` silently and continue.
   - If `jira_projects` is absent or empty, ask the user:
     > "Which JIRA project key(s) should I search for this cycle? Enter one or more keys separated by commas (e.g. PP, GROW)."
   - Parse the response into an array of trimmed uppercase strings.
   - Save the array back to `data/cycles.json` under the selected cycle entry before proceeding.
   - Set `<cycle.jira_projects>` to this array.

Only consider data within `<cycle.start>` – `<cycle.end>`. Ignore anything outside this range.

## Step 0: Load cycle config, engineer profiles, and raw data cache

Before asking the user for anything:
1. Complete the cycle selection described in "Cycle configuration" above — this must happen first.
2. Then check for persisted state in two locations:

### Engineer profiles file
```
data/engineer_profiles.json
```
(relative to the project root)

This file stores known identifiers for each engineer. If it exists, load it. Example structure:
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
  },
  "Sheryan": { ... }
}
```

#### First-time setup (file does not exist)

If `data/engineer_profiles.json` does **not** exist, do not ask the user to copy files manually. Instead, proceed directly to Step 1 — the user will name which engineer(s) they want to review, and the profile wizard runs only for those engineers at that point. The file is created (or updated) as profiles are collected, one engineer at a time.

### Raw data cache directory
```
data/raw/
```
(relative to the project root)

Raw data files are saved per-engineer per-source:
```
data/raw/<FirstName>_jira_assigned_<start>_<end>.json
data/raw/<FirstName>_jira_reported_<start>_<end>.json
data/raw/<FirstName>_github_prs_merged_<start>_<end>.json
data/raw/<FirstName>_github_prs_reviewed_<start>_<end>.json
data/raw/<FirstName>_slack_<start>_<end>.json
```

Dates in filenames use ISO format: `YYYY-MM-DD`. Example:
```
data/raw/Uriel_jira_assigned_<cycle.start>_<cycle.end>.json
```

## Step 1: Collect runtime inputs

Ask the user which engineer(s) to review. If the profiles file exists and has entries, list the known engineers as options. If the user says "do the whole team", review all engineers in the profiles file.

**For each engineer to be reviewed**, check their entry in the profiles file:

- **If all required fields are present** (`jira_account_id` or `jira_display_name`, `github_username`, `slack_handle`, `slack_channels`, `one_on_one_doc_id`): use them silently, no prompts.
- **If the engineer has no entry, or required fields are `null` or missing**: collect their details now with a single message per engineer:

  > "I don't have a profile for [Name] yet — let me grab a few details:
  > - Level (e.g. SE I, SE II, Senior SE I, Senior SE II, Staff)
  > - Work email (e.g. alice@braze.com)
  > - JIRA display name (full name as it appears in JIRA)
  > - JIRA account ID — paste from https://&lt;org&gt;.atlassian.net/people/&lt;account-id&gt; (or type "unknown" — I'll look it up)
  > - GitHub username
  > - Slack handle (e.g. @alice.smith)
  > - Slack channels to check (e.g. #team-backend, #team-eng)
  > - Google Docs link or ID for your 1:1 notes (or "none")"

  Ask this for one engineer at a time, wait for the response, then move to the next.

**After collecting any new information**, immediately write/update `data/engineer_profiles.json`:
- If the file does not exist, create it.
- If it exists, merge into the existing entry — never overwrite a field already set unless the user explicitly corrects it.
- Store `null` for fields the user marked "unknown" or "none" — do not omit them.
- Do not ask the user to run any commands or edit the file manually.

**JIRA account ID auto-resolution:** If `jira_account_id` is `null` but `jira_display_name` is known, resolve it automatically during Step 4's first JIRA query and backfill it in the profiles file.

## Step 2: Read the Engineering Ladder

The Engineering Ladder is a **fixed company constant** — it is not a per-cycle input and is never supplied by the user. Read it directly from Google Docs using:

```
Document ID: 1_IqgSPJT2s2rFnWa8QvQFnsCWtsXxZnCHxqik1j9pjA
```

Use `mcp__gdocs__get_document` with that document ID. Do not ask the user for the ladder; do not look for a local file; do not use pandoc.

Use the ladder as the **sole calibration reference** for all ICs. Key levels and their scope:
- **SE I** — individual tasks/tickets; building strong engineering foundation
- **SE II** — medium-sized projects/features; deep product/tech understanding; minimal oversight
- **Senior SE I** — large projects/epics; driving technical and product areas; high output
- **Senior SE II** — OKRs/quarter-long plans; defining medium/long-term technical direction
- **Staff** — team technical vision and quality; multi-team influence within division
- **Senior Staff** — division-wide technical leadership; architectural design; incident leadership

## Step 3: Find and read 1:1 notes

**Important:** 1:1 notes are raw conversation notes from weekly/biweekly check-ins — they are NOT formal assessments. Treat them as background context to inform your review, not as source-of-truth evaluations.

Check the engineer profiles file for a cached `one_on_one_doc_id`. If present, use it directly with `mcp__gdocs__get_document` — do not ask the user for it.

If not cached, ask the user:

> "Please share the Google Docs link for your 1:1 notes with [engineer name]."

Once provided, extract the document ID from the URL, save it to the engineer's profiles entry, and read it using the `mcp__gdocs__get_document` tool. Mine the notes for:
- Recurring themes that came up across multiple meetings
- Specific feedback Dekel gave the engineer (look for Dekel's perspective in the notes)
- Growth signals — things the engineer is improving on or struggling with
- Projects, initiatives, or concerns that were discussed
- Any patterns around communication, ownership, or collaboration

Use this as **context** — don't quote raw notes verbatim in the review output.

## Team OKRs (use for epic impact context)

Team OKRs are not embedded in this skill — they vary by team and cycle. To connect engineer work to OKRs:

1. Ask the user to share the team's OKR page or document for the cycle, or pull it from Confluence if the manager profile includes OKR page references.
2. Once loaded, use OKRs as context when writing epic impact summaries — connect each engineer's major epics to the relevant OKR where a clear link exists.
3. If no OKR source is available, write impact summaries based on the epic/project description alone and note the gap.

## Step 4: Gather JIRA data

### Cache check — do this before any live query

For each JIRA query type (`jira_assigned`, `jira_reported`), check whether a raw cache file already exists for this engineer:
```
data/raw/<FirstName>_jira_assigned_<start>_<end>.json
data/raw/<FirstName>_jira_reported_<start>_<end>.json
```

**If a cache file exists and its date range fully covers the requested cycle window**, load it directly and skip the live query entirely.

**If a cache file exists but only partially covers the requested window** (e.g. cached from `<cycle.start>` to mid-cycle, but the full `<cycle.end>` is needed):
1. Load the cached records.
2. Fetch only the uncovered date range (e.g. from mid-cycle to `<cycle.end>`).
3. Merge the new results with the cached records — deduplicate by ticket key.
4. Save the merged result back to a cache file with the full combined date range.

**If no cache file exists**, run the full live query and save results to cache.

### Cache file format

Each cache file is a JSON array of ticket objects:
```json
[
  {
    "key": "PP-1234",
    "summary": "...",
    "status": "Done",
    "resolutiondate": "2026-02-14",
    "created": "2026-01-10",
    "assignee": "Uriel Sharon",
    "reporter": "Uriel Sharon",
    "issuetype": "Story",
    "epic_key": "PP-800",
    "epic_name": "Integration Bridge Refactor"
  },
  ...
]
```

### Live queries (when cache miss or partial coverage)

Use the `mcp__atlassian__searchJiraIssuesUsingJql` tool. Run these queries for the **uncovered** date range only.

**Building the project clause:** Use `<cycle.jira_projects>` to construct the JQL project filter:
- Single project: `project = PP`
- Multiple projects: `project in (PP, GROW)`

Use `<jira_project_clause>` as a placeholder for this value in the queries below.

#### Primary ownership (tickets assigned and completed by the engineer)
```
<jira_project_clause> AND assignee = "<jira_account_id>" AND status in (Done, Closed) AND resolutiondate >= "<fetch_start>" AND resolutiondate <= "<fetch_end>"
```

#### Collaboration (subtasks/tasks within stories owned by others)
```
<jira_project_clause> AND assignee = "<jira_account_id>" AND issueType in (Sub-task, Task) AND status in (Done, Closed) AND resolutiondate >= "<fetch_start>" AND resolutiondate <= "<fetch_end>"
```

#### Initiative/proactiveness (tickets created by the engineer)
```
<jira_project_clause> AND reporter = "<jira_account_id>" AND created >= "<fetch_start>" AND created <= "<fetch_end>"
```

For **each ticket**, surface:
- Ticket key, summary, status
- **Parent Epic** (look up the epic link field) — identifies product area
- Whether they were the sole owner vs. collaborator

Organize findings by epic/product area. For each epic, count:
- Stories/tickets **closed** by the engineer (ownership signal)
- Stories/tickets **created** by the engineer as reporter (initiative signal)
- Approximate % of their total cycle output this epic represents

**Pagination — get all results, not just the first 100:** JIRA caps results at 100 per query. Always paginate using `startAt` until you get a full picture:

```
# Page 1: startAt=0, maxResults=100
# Page 2: if page 1 returned exactly 100, fetch with startAt=100
# Page 3: if page 2 returned exactly 100, fetch with startAt=200
# Stop when a page returns fewer than 100 results
```

The `searchJiraIssuesUsingJql` tool accepts `startAt` and `maxResults` parameters — use them. Repeat until the page is not full. Sum all pages for the true total.

**After fetching live data**, immediately save/merge to the cache file before continuing.

## Step 5: Gather GitHub data

### Cache check — do this before any live query

For each GitHub query type (`github_prs_merged`, `github_prs_reviewed`), check whether a raw cache file already exists:
```
data/raw/<FirstName>_github_prs_merged_<start>_<end>.json
data/raw/<FirstName>_github_prs_reviewed_<start>_<end>.json
```

**If a cache file exists and its date range fully covers the requested window**, load it and skip the live query.

**If a cache file exists but only partially covers the window**, load the cached records, fetch only the uncovered date range, merge (deduplicate by PR number + repo), and save back with the full combined date range.

**If no cache file exists**, run the full live query and save results.

### Cache file format

```json
[
  {
    "number": 1234,
    "title": "...",
    "url": "https://github.com/...",
    "mergedAt": "2026-02-14T10:00:00Z",
    "repository": { "nameWithOwner": "braze/braze-growth-services" }
  },
  ...
]
```

### Live queries (when cache miss or partial coverage)

Use the `gh` CLI. Replace `<github_username>` and dates with the **uncovered** range only:

#### PRs opened and merged
```bash
gh search prs --author <github_username> --merged --merged-at "<fetch_start>..<fetch_end>" --json number,title,url,mergedAt,repository --limit 500
```

#### PRs reviewed
```bash
gh search prs --reviewed-by <github_username> --updated "<fetch_start>..<fetch_end>" --json number,title,url,repository --limit 500
```

Use `--limit 500` to avoid the default 100-result cap. GitHub's search API supports up to 1000 results via the CLI.

Look for:
- Volume and complexity of PRs authored
- Breadth of codebases touched
- Quality and quantity of reviews (are they active reviewers? do they leave substantive comments?)
- Any large/foundational changes

**Query cap handling:** If a GitHub search returns exactly 500 results (the limit), write "500+" — the real count may be higher.

**After fetching live data**, immediately save/merge to the cache file before continuing.

## Step 6: Gather Slack data

### Cache check — do this before any live query

Check whether a Slack cache file already exists for this engineer:
```
data/raw/<FirstName>_slack_<start>_<end>.json
```

**If a cache file exists and fully covers the window**, load it and skip the live query.

**If a cache file exists but only partially covers the window**, load cached records, fetch only the uncovered date range, merge (deduplicate by message timestamp + channel), and save back with the full combined date range.

**If no cache file exists**, run the full live query and save results.

### Cache file format

```json
[
  {
    "channel": "#pp-backend",
    "timestamp": "2026-02-14T10:30:00Z",
    "text": "...",
    "thread_ts": "...",
    "user": "@uriel.sharon"
  },
  ...
]
```

### Live queries (when cache miss or partial coverage)

Use `mcp__slack__slack_search_public_and_private` or `mcp__slack__slack_read_channel` for each specified channel. Search for the engineer's handle or display name over the **uncovered** date range only.

**Proactively expand channel coverage:** Beyond the channels specified by the user, search for additional relevant channels by looking at what channels the engineer posted in during the cycle (visible in search results). If you find a channel that appears highly relevant (e.g., a project channel named after their main epic, an incident channel, a cross-team channel), include it. Note any additional channels you searched in the digest.

Assess:
- **Helpfulness**: answering questions, unblocking teammates
- **Technical depth**: quality of explanations, debugging help
- **Responsiveness**: speed and consistency of engagement
- **Initiative**: proactively sharing knowledge, raising issues

**After fetching live data**, immediately save/merge to the cache file before continuing.

## Step 7: Produce a data digest

The output at this stage is a **data digest** — concise, source-attributed bullet points capturing what the data shows. This is not a polished review narrative. The manager will use this digest as raw material to write the final evaluation.

Do not write narrative paragraphs. Do not editorialize or coach. Just surface what the evidence shows, organized by source and theme.

### Per-engineer digest format

```
## [Engineer Name] — [Role/Level]
Review Period: <cycle.start> – <cycle.end>

### From JIRA
- **[Epic name (key)] (~X% of cycle):** [1 sentence on what this epic is and why it matters — connect to team OKR where relevant]. Engineer's contribution: [1–2 sentences on what they owned and the outcome]. Tickets closed: N. Tickets created: N. Notable: [2–3 standout ticket keys + one-liner each, only if they warrant individual mention]
- ...

Time investment estimate: derive rough % from the per-epic ticket counts (tickets closed in this epic / sum of all per-epic closed tickets). Never use a capped query total as the denominator. Label as approximate (e.g. "~40% of cycle").

**Important:** Always paginate JIRA queries and use `--limit 500` for GitHub so totals are complete and accurate. Report exact counts, not estimates.

### From GitHub
- PRs merged: [count], across [repos listed]
- PRs reviewed: [count]
- Notable: [any large/foundational PRs or high-volume review activity worth flagging]

### From Slack ([channel names])
- [bullet per meaningful engagement — help given, thread owned, cross-team coordination, proactive signal]
- ...

### From 1:1 notes
- [bullet per recurring theme, feedback given, or growth signal from the Nov–Apr window only]
- [Do NOT include comp, ratings, scores, or salary numbers]

### Ladder signals
- Strengths vs [Level] bar: [2–3 bullet points mapping observed behaviors to ladder expectations]
- Gaps vs [Level] bar: [2–3 bullet points mapping observed gaps to ladder expectations]
```

**Calibration guidance by level:**
- For **SE I/II**: focus on execution quality, code output, PR practices, ticket throughput
- For **Senior SE I/II**: focus on ownership breadth, initiative, design influence, cross-team impact
- For **Staff/Senior Staff**: focus on technical vision, multi-team influence, architectural contributions, incident leadership

**What to exclude from the digest:**
- Comp, performance scores, ratings, or salary numbers from 1:1 notes
- Events or data outside the <cycle.start> – <cycle.end> window
- Generic observations without specific evidence (no "is a good communicator" without a concrete example)

## Step 7b: Save a raw evidence file

Before writing the review, save a structured evidence file to the project root. This file is your reference for answering follow-up questions like "why did you write X?" or "can you give me an example of Y?" after the review is delivered.

### File path
```
cycles/<cycle.slug>/output/<FirstName>_<LastName>_<cycle.start>_<cycle.end>_evidence.md
```
(relative to the project root)

Example:
```
cycles/summer-2026/output/Alice_Smith_2025-11-01_2026-06-15_evidence.md
```

### Evidence file format

For each claim you intend to make in the written review, record the specific source data that backs it. Organize by review claim (not by data source). Be specific — include ticket keys, PR numbers, Slack message dates/channels, and 1:1 note dates. This is not a summary; it is a traceable map from review language back to raw evidence.

```markdown
# Evidence File — [Engineer Name]
Review Period: [start] – [end]

## Accomplishment claims

### [Short label matching the accomplishment paragraph opener]
- JIRA: [ticket key] — [one-line description of what it shows]
- JIRA: [ticket key] — ...
- GitHub: [PR number / repo] — [what it shows]
- Slack: [channel] [date] — [what was said / done]
- 1:1: [date] — [relevant note]

### [Second accomplishment claim label]
- ...

## Improvement claims

### [Short label matching the improvement paragraph opener]
- JIRA: [ticket key] — [what it shows about the gap]
- Slack: [channel] [date] — [relevant signal]
- 1:1: [date] — [feedback given or pattern noted]

### [Second improvement claim label]
- ...
```

### How this file is used

After delivering the review, if asked "why did you write X?" or "can you give an example of Y?", read this file and answer directly from the evidence recorded here. Do not rely on memory or re-query data sources.

## Step 8: Write the review section

Using the data digest from Step 7 and the ladder signals, write the formal performance review for each engineer. This is the manager-facing written review that will be shared with the IC and uploaded to Lattice. It must follow the Braze review writing framework exactly.

### Review writing rules (non-negotiable)

**Language and tone:**
- Write in **past tense** throughout — past performance does not guarantee future behavior
- Describe **events, not attributes** — "Led the Integration Bridge Refactor scoping and delivered 60+ tickets" not "is a strong technical leader"
- **Do not mix messages** — accomplishment paragraphs contain no negatives; improvement paragraphs contain no positives (be very careful here)
- Use **"can" / "could"** for a score-3 IC; use **"must" / "should"** only for score-2 or below
- **Do not excuse or explain** behavior in the improvements section — just state the gap, give the example, describe the impact, give advice
- Impact must always be framed as benefit to **team / org / Braze / customers** — not personal growth
- Avoid "_I expect them to_" or "_I'd like to see_" — frame improvements in terms of team/company benefit
- Leave the door open for change — say "significantly more" not "mastered"
- Be **concise** — clear paragraphs, no padding, no narration for its own sake
- Don't narrate the full event — refer to it for context, focus on the impact and the behavior to reinforce or change

**Structure — Accomplishments (2–3 paragraphs):**

Each paragraph follows this pattern:
1. **Opener** (1 sentence, optionally bold): What went well — generalize if multiple examples follow. Tie to the ladder.
2. **Example(s)**: Specific events that support the opener. Every sentence must relate to the opener.
3. **Impact**: What did doing this well mean for the team/org/Braze/customers?
4. **Closer** (optionally bold): Format — *"Because [name] did X well, [team/Braze/customers] gained Y."* Write it forward-looking enough that it applies beyond the specific example.

After the accomplishment paragraphs, include a **peer quotes block** — **only if peer review quotes have been explicitly provided by the user as input**. Do not fabricate or infer quotes from other data sources. If no peer quotes were provided, omit this block entirely.

When peer quotes are provided:
- Direct quotes only — no paraphrasing, no grammar correction, no combining quotes
- Only include quotes from the accomplishments section of peer reviews (no improvement feedback)
- Choose distinct quotes that don't overlap in topic
- Italicize quotes

**Structure — Improvements (2–3 paragraphs):**

Each paragraph follows this pattern:
1. **Opener** (1 sentence, optionally bold): What they should improve — direct, no ambiguity, no room for interpretation. Tie to the ladder.
2. **Example(s)**: Specific missed opportunities or events where the gap was visible.
3. **Impact**: What was the cost of not doing this better — for the team/org/company?
4. **Advice**: Concrete, actionable guidance. This can be the bulk of the paragraph.
5. **Closer** (optionally bold): Format — *"By doing X better/differently, [team/Braze/project] will gain Y."* Inspiring, forward-looking, not too narrow.

### What to pull from the digest

| Digest section | Use for |
|---|---|
| From JIRA — epics with high % of cycle | Accomplishment openers and examples |
| From GitHub — PR volume, cross-repo breadth | Supporting evidence in accomplishments |
| From Slack — cross-team coordination, incident response, knowledge sharing | Accomplishment examples, especially for collaboration/leadership paragraphs |
| From 1:1 notes — recurring themes, manager feedback | Improvements openers and examples (use carefully — don't quote verbatim) |
| Ladder signals — Gaps vs level bar | Improvements openers |
| Ladder signals — Strengths vs level bar | Accomplishment openers |
| Peer reviews (from the assessment Google Doc) | Peer quotes block |

### Output format

The output is a single `.docx` file per engineer (see Step 10 for generation details). Do **not** produce a `review_output.md` file. All content — data digest and written review — goes into the `.docx`.

## Step 9: Team comparison (if reviewing multiple engineers)

After all individual digests, produce a side-by-side comparison table:

```
## Team Comparison — <cycle.name> [YYYY]

| Engineer | Level | JIRA Tickets | PRs Merged | PRs Reviewed | Key Product Areas | Ladder signal |
|----------|-------|-------------|------------|--------------|-------------------|---------------|
| ...      | ...   | ...         | ...        | ...          | ...               | meeting / exceeding / below |

### Cross-team patterns (bullets only)
- [Pattern across engineers — concentration of work, collaboration dynamics, who is punching above level, who needs more support]
- ...
```

## Step 10: Generate .docx output

Produce a `.docx` file using the `docx` npm library. This is the **sole output file** — no `.md` files.

### Pre-flight: ensure node_modules exists

Before writing any Node script, verify the `docx` dependency is installed:

```bash
ls scripts/node_modules
```

If the directory is absent (e.g. fresh clone), install it first:

```bash
cd scripts && npm install
```

Then proceed with generation.

### File naming

One file per engineer, saved to the cycle output folder:
```
cycles/<cycle.slug>/output/<FirstName>_<LastName>_<cycle.start>_<cycle.end>.docx
```
(relative to the project root)

Use ISO date format for dates: `YYYY-MM-DD`. Example:
```
cycles/summer-2026/output/Alice_Smith_2025-11-01_2026-06-15.docx
```

If only a first name is known, use just the first name. Never use a generic filename like `PerfReviews.docx`.

### Output directory creation

Before writing any file under `cycles/<cycle.slug>/output/`, always create the directory tree if it doesn't exist:

```js
const path = require('path');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
```

This must appear immediately before every `fs.writeFileSync` call — both for `.docx` files and for the evidence `.md` file. Without it, the write will fail on a fresh machine where the directory tree hasn't been created yet.

### Document structure

The document should open with a header block containing:
- **Engineer name and level** (e.g. "Uriel Silva — Senior SE I")
- **Review period** (e.g. "<cycle.start> – <cycle.end> · <cycle.name>")

Then for each engineer:
- **Heading 1**: "Data Digest"
  - **Heading 2**: "From JIRA" — epics, ticket counts, notable tickets
  - **Heading 2**: "From GitHub" — PRs merged/reviewed, repos
  - **Heading 2**: "From Slack" — key signals by channel
  - **Heading 2**: "From 1:1 Notes" — recurring themes
  - **Heading 2**: "Ladder Signals" — strengths and gaps vs level bar
- **Heading 1**: "Written Review"
  - **Heading 2**: "Accomplishments" — the 2–3 narrative paragraphs, followed by peer quotes if provided
  - **Heading 2**: "Areas for Growth" — the 2–3 narrative paragraphs
- Team comparison table at the end (if multiple engineers reviewed)

Apply professional formatting: Arial font, 1" margins, US Letter.

Use the `docx` npm library. Key patterns are in the `anthropic-skills:docx` skill — consult it for table, list, and heading patterns.

## Data source availability

Each data source (JIRA, GitHub, Slack, 1:1 notes) is required. If a tool is unavailable or returns an error:
- **Do not silently fall back to a proxy** (e.g., do not use GitHub PR titles as a substitute for JIRA data)
- **Stop and tell the user** which tool failed and ask them to check the connection before continuing
- It is better to produce a partial digest with a clear gap noted than to produce inaccurate data from a substitute source

## Important notes

- **No per-engineer expectations files exist.** The Engineering Ladder is the only calibration reference.
- **Be specific, not generic.** Every strength and growth area needs a named ticket, PR, or quote. Vague observations without evidence are not useful to the manager.
- **Be fair and balanced.** Lead with genuine strengths before growth areas. Don't soften growth areas so much they lose their point.
- **1:1 notes are confidential context.** Use them to inform your analysis but don't quote them verbatim in a way that would embarrass the engineer if shared.
- **Surface epics, not just tickets.** Showing which product areas the engineer touched demonstrates scope of impact better than a raw ticket count.
- **If data is missing** (e.g., no GitHub data found, no Slack messages), note the gap explicitly rather than omitting the section — the manager may have additional context.
