# Performance Review Writing Guide — Braze Engineering

This guide covers how to write high-quality performance assessments at Braze. It applies to both accomplishments and improvement sections of downward (manager-to-IC) reviews.

---

## Core Philosophy

**Describe events, not attributes or people.**

- Bad: "X's high level of dedication to his work"
- Good: "Y successfully led a team of five on Project X"

Attributes describe who someone is. Events describe what they did. Always describe what they did.

**Use the SBI Model (Situation → Behaviour → Impact)**

Every paragraph should implicitly follow this structure:
- **Situation**: Describe the specific context where the behavior occurred — be clear about when/where
- **Behaviour**: Focus on the specific, observable behavior using objective language — avoid generalizations
- **Impact**: Explain the consequence for the team, project, or organization — not for the individual personally

**Write in the past tense.** Past tense creates a barrier between past performance and future expectations. Being good at something last half does not guarantee it won't need work in the future.

**Tie events to impact.** After every event, ask "So what?" If the answer isn't there, you haven't described impact. Impact should be for the team/org/Braze — not for the individual.

**Be concise.** Concise writing is clear writing. Brief, focused feedback is more actionable. The more specific the language, the more actionable the feedback.

---

## Accomplishments Section

### General Advice

- Make it crystal clear what behavior you want to encourage. After reading, the IC should have no doubt what they should keep doing and why it was valuable.
- Include positive peer feedback as direct quotes (do not paraphrase, correct grammar, or combine multiple peers).
- Place peer quotes in italics — optional stylistic choice.
- Only include distinct peer feedback; avoid redundant quotes on the same topic.

### Paragraph Structure

**1. Opener — one sentence about what went well.**
- Get straight to the point. No ambiguity.
- If multiple examples, the opener should generalize across both.
- Should almost always connect to the engineering ladder.
- Optional: bold this sentence.

**2. Example(s)**
- At least one concrete example of what happened.
- Every sentence must relate to the opener — do not stray from the topic.

**3. Impact**
- Describe the impact of doing this well.
- Use the career ladder to frame impact — what does Braze value?
- Impact should benefit the team/org/company. Personal growth only matters when it connects to business impact.

**4. Closer**
- Format: **"Because they did X well, the team/Braze/project gained Y"**
- Don't be too specific to the completed project — they can't repeat it exactly.
- Write in a way that guides them to replicate the impact in new situations.
- Optional: bold this sentence.

### Example (from real review)

> Sheryan made significant and consistent contributions to the team's success this half through high-quality project execution and operational excellence. Most notably, he supported the full migration of all Shopify customers to our new Shopify integration. In addition to this key project, he played an essential role in enhancing the overall quality of the PP team by contributing to improving our end-to-end testing coverage and refining our monitoring and alerting tools. Because of his efforts, Sheryan not only delivered valuable outcomes for our customers but also positioned us to maintain high quality standards in the future.

---

## Improvements Section

### General Advice

- Make it crystal clear what behavior you want to change. After reading, the IC should have no doubt what they should start doing differently.
- **Adjust language based on rating.** For a score-3 IC (at expectation), avoid "must" or "should" without care — prefer "can" or "could." This is even more important for 4s and 5s.
- Strike a balance: be direct and firm without making the IC feel attacked.
- **No praise in this section.** Praise belongs in accomplishments. Mixed messages weaken impact. Rare exceptions only, with care.
- **Do not excuse or explain the behavior.** Doing so lessens impact and relies on assumptions that may be wrong.
  - Bad: "X did a lot of mentoring, so they had less time to write impactful code"
  - Good: Just focus on the lack of consistent delivery of impactful code — no explanation needed
- Impact of improvement should almost never be personal growth. Express impact as benefits for the team/org/Braze.
- Avoid "I expect them to do X" or "I'd like to see Y." They must improve to have greater impact on team/org/company — not to satisfy their manager.

### Paragraph Structure

**1. Opener — one sentence about what they should improve on.**
- Open directly with the improvement area — do not start by describing the situation.
- Be direct, concise, specific. Zero ambiguity.
- Should almost always connect to the engineering ladder.
- Optional: bold this sentence.

**2. Example(s)**
- Where did they miss the mark? Describe specific missed opportunities.

**3. Impact**
- What was the impact of not doing this better?
- How did it affect the team/org/company?

**4. Advice**
- Give them concrete, actionable advice on how to improve.
- This can be the bulk of the paragraph — they need to know what to do, not just what was wrong.

**5. Closer**
- Format: **"If they do X better/differently, [team/Braze/project will gain Y]"**
- Forward-looking and inspiring — what's the best-case outcome if they act on this?
- Don't be too narrow — write for a class of problems, not just the specific example cited.
- Optional: bold the expected impact.

### Example (from real review)

> Alvin needs to enhance his task velocity and ensure that he delivers meaningful progress and outcomes in a timely manner that aligns with his role. Throughout this half, there were several instances where Alvin took significantly longer than expected to complete assigned tasks. For example, PR 107973 took nearly a week to finalize, resulting in extensive feedback from team members and extending beyond the expected timeline. It is important for Alvin to consider this feedback and reflect on other strategies he can implement to consistently deliver value at a high velocity (e.g., daily commits and completing tasks in under a day). By improving his task velocity and ensuring regular delivery, Alvin can increase his impact and meet the expectations of his role as a Senior 2.

---

## Process Dos and Don'ts

### Dos

**Consider writing the calibration document first.**
Building consensus with leadership on key impacts and areas for improvement (in concise bullet form) before writing the full review leads to better reviews.

**Leave the door open for change.**
Avoid "They have become..." or "They have mastered...". Instead: "They have become significantly more..." — leaves room for further growth or future regression.

**Use AI tools for polish, not content.**
Use Grammarly for grammar and ChatGPT for sentence structure or rephrasing. Never include IC names or project names in ChatGPT. Re-read everything that comes out — preserve original meaning.

**Stick to 2–3 paragraphs per section.**
Constrain yourself to only the most impactful topics. More paragraphs dilute the message.

**Be data-informed, not data-driven.**
Don't cite raw metrics as evidence ("X completed more Jira stories than anyone"). Use data to prompt deeper investigation into impact. Relevant sources: JIRA, GitHub, Slack, CodeClimate/Span, OKR retros, 1:1 notes, peer reviews, previous reviews.

### Don'ts

**Don't mix topics.** Each paragraph should have one clear takeaway. Every sentence must relate to the opening statement. If two topics emerge, use two paragraphs.

**Don't mix messages.** Don't bring up negatives in the accomplishments section. Don't muddle improvements with praise.

**Don't narrate too much.** Focus on impact, not the full story of what happened. Don't describe every detail of the event — give just enough context. Ask: "What about this behavior would apply to a different class of problem in the future?" Write toward that.

**Don't iterate reviews in the same order.** If working through a full team, vary the order across sessions to even out quality — the last review you write in a long session will be lower quality.

---

## Calibration and Scores

**What we measure:** Realized impact — activities that led to real business value. Business value includes customer-facing work (satisfaction, competitive positioning, renewals) and non-customer-facing work (team productivity, cost reduction, stability, modernization, tech debt reduction).

**We do not reward unrealized work.** Work not yet delivered is not credited.

**Primary metric:** Contribution to company and team goals — features/tickets delivered, projects led and completed, and outcomes from that work.

**Secondary metrics (for order-of-magnitude comparison only):** PRs merged, PRs reviewed, tickets QA'd, Span/CodeClimate Impact. These are directional only — 100 PRs vs. 95 PRs is not meaningful; 100 PRs vs. 15 PRs is.

**Signs of underperformance by level:**
- SE I: gets very little done
- SE II: low output, low value-add anywhere (e.g. PR comments)
- Senior SE I: can't own goals independently or push through blockers
- Senior SE II: not a leader, or leads but codes too little
- Staff: inconsistent impact or trouble finding wins
- Senior Staff: doesn't organize or communicate

**On scores:** Scores are the clearest signal you can give. A 2 score is often what finally catalyzes change after months of verbal feedback. Use scores intentionally.

---

## Engineering Ladder Quick Reference

| Level | Primary Scope | Key Expectation |
|---|---|---|
| SE I | Individual tasks/tickets | Strong engineering foundation; great velocity on existing tech |
| SE II | Medium project/feature | Deep product/tech understanding; minimal oversight; owns large areas |
| Senior SE I | Large project/epic | Epitomizes ownership; high output; drives technical and product forward |
| Senior SE II | OKRs/quarter-long plans | Defines medium/long-term technical direction; critical team leader |
| Staff | Team technical vision | Formal owner of team's technical vision and quality; multi-team influence |
| Senior Staff | Division-wide | Primary owner of division's quality and strategic technical direction |

For full descriptions, use Document ID: `1_IqgSPJT2s2rFnWa8QvQFnsCWtsXxZnCHxqik1j9pjA`

---

## Impact Heuristics

Impact means providing business value. Main ways engineers add value:
- Build something customers want and use
- Change/build something to reduce cost
- Support something customers need (on-call, bugfixes, documentation)
- Help coworkers have more impact (PR reviews, design docs, mentoring)
- Make tools/processes so coworkers (and themselves) have more impact (build system, refactors, internal docs)

Time horizon: think 1–2 years. Anything longer is likely low ROI.

---

## Writing Quality Checklist

Before finalizing any review paragraph:

- [ ] Does it describe an event, not an attribute?
- [ ] Is it written in past tense?
- [ ] Does every sentence connect to the opener?
- [ ] Is impact clearly stated — for the team/org/company?
- [ ] Is the opener direct and unambiguous?
- [ ] Is the closer forward-looking and not tied too narrowly to one project?
- [ ] Is there any excuse/explanation language in the improvements section? (Remove it)
- [ ] Is there any praise in the improvements section? (Remove it unless carefully deliberate)
- [ ] Is the language calibrated to the IC's rating? (Softer for 3+, firmer for 1–2)
- [ ] Would you bold the opener and closer for clarity?
- [ ] Does it connect to the engineering ladder?
- [ ] No em dashes (—)? Use commas or rewrite instead.
