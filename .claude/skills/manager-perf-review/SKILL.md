---
name: manager-perf-review
description: >
  Evaluates Engineering Managers (EMs) and Senior Engineering Managers (SEMs) for a Braze performance review cycle and produces structured written reviews. Use this skill whenever the user asks to evaluate, review, assess, or write up performance for an EM or SEM — even if they say things like "write up a review for Hannes", "assess how John is doing as a manager", "do the EM cohort", or "help me with manager performance reviews". This skill synthesizes team OKR delivery, managing-up docs, incident data, 1:1 notes, and Slack signal into a flat achievements/improvements list calibrated against the Engineering Ladder. Always invoke this skill when manager performance review or EM/SEM evaluation is mentioned.
---

# Manager Performance Review Skill

You are helping a director at Braze evaluate Engineering Managers (EMs) and Senior Engineering Managers (SEMs) for a performance review cycle. Your output for each manager is:
- A **flat list of achievements topics** backed by 2–4 sentence paragraphs in Braze review-writing style
- A **flat list of improvement topics** backed by 2–4 sentence paragraphs
- A **calibration score** (e.g. "3", "weak 3", "3-4 leaning 4") with a 2–4 sentence rationale
- A `.docx` file with the full data digest plus the calibrated review

The director curates which topics to keep, expand, or cut. This skill produces the synthesis — the director makes the final judgment calls.

---

## Step 0: Cycle + profile load

Before asking the user for anything:

### 0a. Resolve the active cycle

Follow the cycle resolution logic in `.claude/skills/perf-review-common/references/cycle_loader.md`.

Set `<cycle.name>`, `<cycle.slug>`, `<cycle.start>`, `<cycle.end>` before proceeding.

### 0b. Detect OKR quarters in window

Compare `cycle.start`/`cycle.end` against the quarters defined in the project-tracker registry:
```
~/.claude/skills/project-tracker/shared/references/registry.json
```

A quarter is "in window" if its date range overlaps (partial overlap counts). If the registry doesn't fully cover the cycle window, warn:
> "Warning: [quarter] OKR page is not in the registry. Coverage will be partial for teams in that quarter. Proceed or pause?"

### 0c. Load manager profiles

```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/data/manager_profiles.json
```

If present, load it. Use cached fields silently — do not ask for values already present. See `.claude/skills/perf-review-common/references/profile_pattern.md` for merge semantics and field definitions.

---

## Step 1: Pick manager(s) and confirm scope

Ask who to review: one EM, multiple, or the whole EM/SEM cohort.

For each manager:
1. Check the manager profiles file for cached fields:
   - `level` (EM / SEM)
   - `team_keys` (list — usually 1 for EM, 2+ for SEM)
   - `one_on_one_doc_id` (Google Doc with Dekel)
   - `expectations_doc_path` (relative path in cycle input folder, or null)
   - `slack_handle`
   - `slack_channels`
   - `escalation_team_names` (list of team-name strings as they appear in the "Primary Engineering Team (RCA Owners)" column of the TechOps Escalation Metrics sheet — often does not match `team_keys` exactly, e.g. "Currents & Data Ingestion" not "CDIT")
2. For missing fields, ask.
3. **Always** display the `team_keys` list and ask Dekel to confirm scope:
   > "For [Name], I'll pull data for teams: [team_keys]. Is this the right scope? (Note: if they collaborate on a project owned by another EM, confirm whether to include those teams.)"
4. Persist any new or corrected info to `data/manager_profiles.json` immediately.

---

## Step 2: Read the EM/SEM ladder

Check if the cached ladder excerpt already exists:
```
/Users/dekel.albocher/.claude/skills/manager-perf-review/references/em_sem_ladder_excerpt.md
```

If the file contains the actual ladder content (not just the placeholder), use it directly.

If it's a placeholder (no actual ladder text), extract the ladder:
```bash
pandoc "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/<cycle.slug>/input/Engineering Ladder.docx" -o /tmp/eng_ladder.md
```

Extract the **Engineering Manager** and **Senior Engineering Manager** sections from `/tmp/eng_ladder.md`. Update `em_sem_ladder_excerpt.md` with the extracted content.

**Calibration bars:**
- For EMs: use the EM bar.
- For SEMs: apply the EM bar per team first, then layer the SEM bar on top. One combined score for the SEM.

---

## Step 3: Pull team data (per team_key in scope)

For each team the manager owns, run all sub-steps in parallel where possible.

### Cache check pattern (applies to all Step 3 sub-steps)

For each raw data file:
```
data/raw/<team_key>_<source>_<start>_<end>.json
```
- Full coverage → load, skip live query.
- Partial coverage → load, fetch uncovered range, merge (deduplicate), save with full date range.
- No cache → run full live query, save to cache.

### 3a. Managing-up doc walk

- Fetch by `teams.<KEY>.managing_up.doc_id` from the registry using `mcp__gdocs__get_document` (or the equivalent tool available — `mcp__e4a2a4b8-bc96-4514-9669-981347c8f686__gdocs__get_document`).
- Parse entries within `cycle.start`–`cycle.end`. Each team's format differs:
  - **CO:** red/yellow/green per KR with commentary
  - **CDIT:** Sprint Updates format
  - **INF:** Last Sprint / This Sprint / My Take sections
  - **DLKH:** leads with Priorities
  - Check the registry's `note` field per team for format hints.
- Extract per entry:
  - Date
  - OKR statuses (KR-level color/emoji + commentary)
  - Notable events (incidents, scope changes, escalations, personnel changes)
  - Team Snapshot block when present (people signals)
- Cache to: `data/raw/<team_key>_managing_up_<cycle.start>_<cycle.end>.json`

### 3b. OKR Confluence pages

For each quarter in window, fetch the OKR page:
- Registry path: `teams.<KEY>.confluence_okr_pages.<quarter>.page_id`
- Tool: `mcp__atlassian__getConfluencePage`
- Extract: Objectives, Key Results, end-of-quarter status.
- Cache to: `data/raw/<team_key>_okr_<quarter>.json`

### 3c. Project tracker live snapshot

Read (do not re-collect):
```
~/Documents/Claude/Projects/Project tracker/projects_state.json
```

Check file mtime. If older than 7 days, warn:
> "projects_state.json is [N] days old. Consider running project-tracker/collector before proceeding. Continue with stale data?"

Filter to projects where `team == team_key`. Surface:
- `risk_score`, `alerts`, `progress_snapshot`, `blockers`, `known_epics`

This gives "current state" to complement the managing-up doc's "trajectory."

### 3d. Incidents — Datadog + Slack

**Datadog (preferred source):**
- Query incidents in `cycle.start`–`cycle.end` filtered by team tag/component.
- For each incident: severity, summary, retrospective notes, participants, RCA, follow-up status.
- Cross-reference participants against the manager and their direct reports (from `engineer_profiles.json` if available, else from the registry).
- If Datadog returns zero incidents, surface explicitly:
  > "Datadog returned 0 incidents for team [KEY] in the cycle window. This could be a tag mapping issue. Confirm before treating as 'no incidents'."
- If Datadog MCP is not connected, surface:
  > "Datadog not connected — partial incident coverage. Continuing with Slack IRT signal only."

**Slack IRT channels:**
- Search channels matching pattern `irt-<team_key>` (case-insensitive) within the cycle window.
- For each thread involving the manager or their reports:
  - Was the EM **leading** (opening incident, assigning, driving retro), **supporting** (responding, helping), or **absent**?
  - Are there recurrence patterns (same type of incident multiple times)?
- Cache to: `data/raw/<team_key>_irt_<cycle.start>_<cycle.end>.json`

### 3e. Escalations — TechOps sheet + Slack channels

**Source sheet (hardcoded):**
- Spreadsheet ID: `1H-lcNCGs5ZpEXH5X8z4KUzQXSMWsTKHsHt3gPsgAilg`
- Tab: `TechOps Escalation Metrics`
- Owning-team column: `Primary Engineering Team (RCA Owners)`
- Use `mcp__gsheets__get_sheet_data` (or equivalent) to pull the tab.

**Filter rows for this manager:**
- Match rows where `Primary Engineering Team (RCA Owners)` equals any value in the manager's `escalation_team_names` profile field.
- Restrict to rows whose escalation date falls within `cycle.start`–`cycle.end`.
- If `escalation_team_names` is missing in the profile, ask Dekel once for the exact team-name string(s) as they appear in the sheet, then persist to `manager_profiles.json`.

**Slack channel for each escalation:**
- Expected pattern: `#escalation-<YYYYMMDD>-<company>-<short-description>` (slugified, lowercased, hyphens for spaces).
  - Example: row "Bolt Email Delay" on 2026-05-13 → `#escalation-20260513-bolt-email-delay`.
- **Channel names are not always consistent** — date format, word ordering, abbreviations, and descriptor wording all vary. Treat the pattern as a starting guess, not a guarantee.
- Resolution procedure:
  1. Try the exact pattern first.
  2. If not found, `slack_search_channels` for `escalation <company>` and inspect candidates within ±7 days of the escalation date.
  3. Confirm the match by sampling the channel's earliest messages — they should reference the same company and issue described in the sheet row.
- **Confidence tagging — required:**
  - `confidence: high` — exact pattern match, or fuzzy match with topic confirmed from channel content.
  - `confidence: low` — fuzzy match with weak/ambiguous content confirmation, or multiple plausible candidates.
  - `confidence: unresolved` — no plausible channel found.
- In the digest and evidence file, **explicitly flag `confidence: low` and `confidence: unresolved` rows** so Dekel can verify before any claim is built on them. Never silently treat a low-confidence channel as the source of truth for an EM-presence judgment.

**For each escalation, capture:**
- Date, company, short description, severity if listed
- Whether the EM joined the escalation channel
- EM role: **leading** (driving comms, assigning owners, posting status), **supporting** (present, responding), or **absent**
- Whether escalations of the same shape (same product area, same root-cause family) recurred across the cycle for this team

**Aggregate per team:**
- Total escalation count in window
- Recurrence pattern: list of repeated escalation themes
- EM presence breakdown: leading / supporting / absent counts

- Cache to: `data/raw/<team_key>_escalations_<cycle.start>_<cycle.end>.json`

---

## Step 4: Pull manager-personal data

### 4a. 1:1 notes with Dekel

Load via `one_on_one_doc_id` from the manager profile using the gdocs tool.

Mine for (within `cycle.start`–`cycle.end` only):
- Recurring themes Dekel raised across multiple meetings
- Specific feedback Dekel gave the manager (look for Dekel's perspective)
- Mentions of underperforming reports + EM's plan + follow-through ("the perf issues on the team" signal)
- Growth signals and concerns

Do not quote raw notes verbatim in the review output.

### 4b. Expectations doc (when present)

If `expectations_doc_path` is set in the manager profile:
```bash
pandoc "/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/<expectations_doc_path>" -o /tmp/em_expectations.md
```

Parse each goal/theme. Each becomes an explicit **Hit / Partial / Miss / Unverifiable** check at synthesis time:
- **Hit:** clear evidence the goal was achieved
- **Partial:** goal attempted, partial delivery with documented reasons
- **Miss:** goal not achieved or unaddressed
- **Unverifiable:** no evidence found in the data sources; flag for Dekel to fill in

### 4c. EM's own Slack (default-on)

Search `slack_channels` from the manager profile. Also search for the manager's handle across any additional channels that emerge in search results.

Focus on:
- Cross-team coordination examples
- IRT leadership tone and decisions
- Technical or strategic decisions driven to resolution
- Escalation handling

Cache to: `data/raw/<first_name>_em_slack_<cycle.start>_<cycle.end>.json`

### 4d. Direct reports' IC reviews (optional, when present)

Glob the cycle output folder:
```
cycles/<cycle.slug>/output/*.docx
```

For each IC review file whose engineer maps to this EM (use `engineer_profiles.json` for team mapping), read the document and note:
- Bottom-of-band scores → underperformer pattern
- Team-wide growth themes → EM-attributable strengths or gaps
- EM-attributable strengths called out in peer/manager sections

---

## Step 5: Build the digest

Produce a structured internal digest (markdown, not user-facing yet). One digest per manager.

```markdown
## <Manager> — <Level>
Review Period: <cycle.start> – <cycle.end>
Teams in scope: <team_key(s)>

### Team OKR Delivery (per team)
#### [team_key]
- **Quarter-by-quarter rollup:**
  - [Quarter]: Committed: [list KRs from OKR page]. Landed: [from final managing-up entry + OKR resolution]. Slippage: [any KRs dropped/descoped with dates].
  - [Next quarter if in window]: ...
- **Live status (projects_state.json):** risk_score=[X], alerts=[list], blockers=[list], progress=[summary]

### Expectations Check (when expectations_doc_path is set)
- [Goal 1]: **Hit** — [evidence: managing-up entry date, ticket key, etc.]
- [Goal 2]: **Partial** — [what landed vs. what was expected, with evidence]
- [Goal 3]: **Miss** — [what didn't happen and when it became clear]
- [Goal 4]: **Unverifiable** — [no signal found; flag for Dekel]

### Incidents
- Count by severity in window: Sev1=[N], Sev2=[N], Sev3=[N]
- Notable IRTs:
  - [Incident name/date]: EM role=[lead/supporting/absent], retro follow-through=[status], recurred=[yes/no]
- Slack IRT signal: [patterns observed in IRT channels]

### Escalation Handling
- Total escalations in window: [N]
- EM presence breakdown: leading=[N], supporting=[N], absent=[N]
- Notable escalations:
  - [Date] [Company] — [short desc]: channel=[#escalation-...] (confidence: high/low/unresolved), EM role=[lead/supporting/absent], notes=[what stood out]
- **Low-confidence / unresolved channels (verify before relying on):** [list rows where channel match is uncertain, or "none"]
- Recurrence patterns: [list of repeated themes, e.g. "3 email-delivery escalations for distinct customers"] or "no clear pattern"

### People Management Signal
- 1:1 with Dekel: [bullet per recurring theme or feedback given in the cycle window]
- Report concerns: [any specific underperformer situations raised + EM's plan/follow-through]
- Hiring/departures/onboarding: [events from managing-up doc]
- Reports' IC reviews: [patterns when available — bottom-of-band clustering, team-wide growth themes]

### Manager-Personal Signal
- Cross-team coordination: [specific examples from Slack]
- Technical leadership: [decisions or guidance given]
- Strategic decisions: [driven to resolution or dropped]

### Ladder Mapping
- **Strengths vs [EM/SEM] bar:**
  - [Behavior observed] → [Ladder dimension it maps to]
  - ...
- **Gaps vs [EM/SEM] bar:**
  - [Gap observed] → [Ladder dimension it maps to]
  - ...
```

---

## Step 6: Save the evidence file

**Path:**
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/<cycle.slug>/output/<FirstName>_<LastName>_EM_<cycle.start>_<cycle.end>_evidence.md
```

For each claim that will appear in the final achievements or improvements list, record the specific source data backing it. Organize by claim, not by source.

```markdown
# Evidence File — [Manager Name] ([Level])
Review Period: [start] – [end]

## Achievements claims

### [Short label matching the achievement headline]
- Managing-up: [team_key] [date] — [what it shows]
- OKR page: [team_key] [quarter] — [KR + resolution]
- Projects state: [risk_score/alert detail]
- Datadog: [incident ID / severity] — [what it shows about the manager's role]
- Escalation: [date] [company] [#escalation-channel] — [EM role + what stood out]
- 1:1: [date] — [relevant note]

### [Next achievement label]
- ...

## Improvement claims

### [Short label matching the improvement headline]
- Managing-up: [team_key] [date] — [what it shows about the gap]
- Expectations: [goal] — [Hit/Partial/Miss and evidence]
- Slack: [channel] [date] — [relevant signal]
- Escalation: [date] [company] [#escalation-channel] — [EM absence / weak handling / recurrence theme]
- 1:1: [date] — [feedback given or pattern noted]

### [Next improvement label]
- ...
```

---

## Step 7: Synthesize the two flat lists

From the digest and ladder mapping, produce the calibrated review output.

### Score and rationale

```
**Score:** [e.g. "3-4 leaning 4"]
**Rationale:** [2–4 sentences tying observed behaviors to ladder expectations. Name the strongest evidence pushing the score up. Name the most significant evidence holding it from being higher. For SEMs, call out which teams pushed the score up vs. down.]
```

**Escalation handling factors explicitly into the score:**
- EM consistently leading escalation channels (driving comms, assigning owners, resolving) → pushes score up; surface in achievements and reference in rationale.
- EM repeatedly absent from escalation channels, or letting reports drive without guidance → pulls score down; surface in improvements and reference in rationale.
- A recurrence pattern (same shape of escalation hitting the team multiple times) without evidence the EM addressed the systemic cause → significant pull-down signal; must appear in improvements.

Score descriptors:
- **4:** Consistently exceeds bar; rare behaviors at next level
- **3–4 leaning 4:** Meets bar solidly; shows some next-level behaviors
- **3:** Meets expectations; no significant gaps
- **2–3 (weak 3):** Generally meets bar with notable gaps in 1–2 areas
- **2:** Significant gaps; needs a plan to address them

### Achievements list

Flat list — no nested sections. For SEMs, each bullet is tagged with the team it came from (e.g. `[CDIT]`). EMs with one team omit the tag.

```markdown
### Achievements

- **[Team tag if SEM] Topic headline (one line, past tense, event-grounded)**
  [2–4 sentence paragraph in Braze review-writing style: opener tying to ladder, specific example(s), impact for team/Braze/customers, closer. Use "can/could" tone. No mixing in negatives.]

- **[Next achievement topic]**
  ...
```

### Areas for Improvement list

```markdown
### Areas for Improvement

- **[Team tag if SEM] Topic headline (one line, direct, no ambiguity)**
  [2–4 sentence paragraph: opener tying to ladder, specific missed opportunity or pattern, impact, concrete actionable advice, closer. For score-3 use "can/could"; for score-2 use "must/should". No mixing in positives.]

- **[Next improvement topic]**
  ...
```

### Review writing rules (non-negotiable)

- **Past tense throughout** — past performance does not guarantee future behavior
- **Events not attributes** — "Led CO's Source/Sync GA delivery" not "is an effective leader"
- **No mixed messages** — achievement bullets contain no negatives; improvement bullets contain no positives
- **"can/could" for score-3** — "must/should" only for score-2 or below
- **Do not excuse** gaps in the improvement paragraphs — state the gap, give the example, describe the impact, give advice
- **Impact framed as team/org/Braze/customers benefit** — not personal growth
- **Concise** — no padding, no narration for its own sake
- **Every bullet traces to specific evidence** in the evidence file

---

## Step 8: Output to .docx

### Pre-flight: ensure node_modules exists

Before writing any Node script, verify the `docx` dependency is installed:

```bash
ls scripts/node_modules
```

If the directory is absent (e.g. fresh clone), install it first:

```bash
cd scripts && npm install
```

**File path:**
```
/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/<cycle.slug>/output/<FirstName>_<LastName>_EM_<cycle.start>_<cycle.end>.docx
```

**Document structure:**

Header block:
```
[Manager Name] — [Level]
Review Period: <cycle.start> – <cycle.end> · <cycle.name>
Teams: [team_key(s)]
```

- **Heading 1:** Data Digest
  - **Heading 2:** Team OKR Delivery (one H2 per team for SEMs)
  - **Heading 2:** Expectations Check (only when expectations doc was present)
  - **Heading 2:** Incidents
  - **Heading 2:** Escalation Handling
  - **Heading 2:** People Management Signal
  - **Heading 2:** Manager-Personal Signal
  - **Heading 2:** Ladder Mapping
- **Heading 1:** Calibration
  - Score + rationale paragraph
- **Heading 1:** Achievements
  - Flat list of bulleted topic paragraphs (team-tagged for SEMs)
- **Heading 1:** Areas for Improvement
  - Flat list of bulleted topic paragraphs (team-tagged for SEMs)

**Formatting:** Arial font, 1" margins, US Letter. Reuse docx npm patterns from `.claude/skills/perf-review-common/references/docx_patterns.md` and `anthropic-skills:docx` skill.

**The chat output** is a condensed version showing: score + rationale + the two flat lists (without the full data digest). The director uses this for quick scanning.

---

## SEM-specific handling

- `level: "SEM"` and `team_keys: ["CDIT", "INF"]` (multiple) in profile.
- Steps 3 and 4 run per `team_key` — caches are team-keyed, so re-runs are efficient.
- Step 5 digest has per-team OKR Delivery sections.
- Step 7 synthesis:
  - One combined achievements list and one combined improvements list.
  - Each bullet tagged with the team it came from: `[CDIT]`, `[INF]`, etc.
  - One overall score with rationale calling out which teams pushed the score up vs. down.

---

## Graceful degradation

- **Datadog not connected:** Surface "Datadog not connected — partial incident coverage" and continue with Slack-only IRT signal. Do not fail hard.
- **Managing-up doc missing or access denied:** Note the gap explicitly, continue with other sources. Do not substitute or fabricate.
- **projects_state.json missing:** Surface "projects_state.json not found — skipping live project snapshot". Do not fail hard.
- **Expectations doc not found at path:** Surface "Expectations doc not found at [path] — skipping expectations check". Continue without it.
- **No IC reviews in cycle output folder:** Skip Step 4d silently.
- **TechOps Escalation Metrics sheet inaccessible:** Surface "Escalation sheet not accessible — skipping escalation handling section". Do not fail hard.
- **`escalation_team_names` missing from profile:** Ask Dekel once for the exact team-name string(s) from the sheet's "Primary Engineering Team (RCA Owners)" column, persist to the profile, then proceed. Do not guess.
- **Escalation Slack channel not found for a row:** Mark the row `confidence: unresolved` in the digest. Still count it in the escalation total, but do not attribute an EM presence/role to it.
- **Escalation Slack channel match is uncertain:** Mark the row `confidence: low` in the digest. Surface it in the "Low-confidence channels (verify before relying on)" list. Do not use it as the sole basis for any achievement or improvement claim — require either Dekel confirmation or corroborating evidence from another source.

---

## Data source conventions

See shared references for detailed patterns:
- **Cycle loading:** `.claude/skills/perf-review-common/references/cycle_loader.md`
- **Profile merge:** `.claude/skills/perf-review-common/references/profile_pattern.md`
- **docx generation:** `.claude/skills/perf-review-common/references/docx_patterns.md`
- **Ladder calibration:** `.claude/skills/manager-perf-review/references/em_sem_ladder_excerpt.md`
