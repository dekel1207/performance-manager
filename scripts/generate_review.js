try {
  require.resolve('docx');
} catch {
  console.error('Error: docx module not found. Run: cd scripts && npm install');
  process.exit(1);
}

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, LevelFormat
} = require('docx');
const fs = require('fs');
const path = require('path');

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    children: [new TextRun({ text, font: 'Arial', bold: true, size: 32 })],
    spacing: { before: 360, after: 120 },
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, font: 'Arial', bold: true, size: 28 })],
    spacing: { before: 280, after: 80 },
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, font: 'Arial', bold: true, size: 24 })],
    spacing: { before: 200, after: 80 },
  });
}

function para(runs, spacingAfter) {
  const after = spacingAfter !== undefined ? spacingAfter : 160;
  const children = typeof runs === 'string'
    ? [new TextRun({ text: runs, font: 'Arial', size: 22 })]
    : runs;
  return new Paragraph({ children, spacing: { after } });
}

function bullet(text) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    children: [new TextRun({ text, font: 'Arial', size: 22 })],
    spacing: { after: 80 },
  });
}

function bold(text) {
  return new TextRun({ text, font: 'Arial', size: 22, bold: true });
}

function normal(text) {
  return new TextRun({ text, font: 'Arial', size: 22 });
}

function divider() {
  return new Paragraph({
    border: { bottom: { style: 'single', size: 6, color: 'CCCCCC', space: 1 } },
    spacing: { before: 200, after: 200 },
    children: [],
  });
}

const children = [
  // Header block
  para([bold('Uriel Silva'), normal('  -  Senior SE I')], 60),
  para([bold('Review Period: '), normal('Nov 1, 2025 - Apr 30, 2026  |  Summer Round')], 200),
  divider(),

  // DATA DIGEST
  h1('Data Digest'),

  h2('From JIRA'),
  para([bold('Pagination note: '), normal('Closed-ticket query (Nov-Apr) returned exactly 100 results (query cap hit). A second query scoped to Feb-Apr returned 59 tickets. By deduplicating the overlap, the true total closed ticket count is ~124 tickets across the cycle. Created (reporter) query returned ~130 tickets.')]),

  h3('Integration Bridge Refactor (PP-5054) -- ~48% of cycle'),
  para([bold('OKR: '), normal('FY26Q4 - Refactor: standardize the integration bridge to improve consistency and enable self-service to other PDE teams')]),
  para('The Integration Bridge Refactor was the team\'s most consequential Q4 OKR. The goal: deprecate the legacy Alloys::IntegrationBridge framework and replace it with a new TechnologyPartnerIntegration pattern giving each partner its own isolated, self-service-friendly integration class. Uriel was the technical lead and primary executor of this epic from inception to delivery.'),
  bullet('Tickets closed: ~60  |  Tickets created: ~65'),
  bullet('PP-5055 - SPIKE: Plan out the Integration Bridge Refactor work and create cards. Uriel authored the full scoping document and backlog.'),
  bullet('PP-5100/PP-5101 - Create ShopifyPartnerIntegration + Modify all webhook processors. Most complex migration: 20+ files changed.'),
  bullet('PP-5129 - Write documentation and migration guide; authored a Cursor skill (SKILL.md) enabling other PDE teams to self-execute migrations.'),
  bullet('Created PartnerIntegration classes for 20+ partners: Adjust, Branch, Shopify, Segment, DataDog, Amplitude, AppsFlyer, and more.'),
  bullet('Executed live data migrations in prod for Attribution (Jan), Cohort Import (Feb), Shopify (Jan), Segment, DataDog.'),
  bullet('Released integration_bridge_refactor FF (PP-5247) and wrote release plan.'),

  h3('E2E Testing Improvements (PP-4795) -- ~15% of cycle'),
  para([bold('OKR: '), normal('FY26Q4 - E2E Testing: comprehensive, reliable E2E automation running on daily cadence')]),
  bullet('Tickets closed: ~18  |  Tickets created: ~12'),
  bullet('PP-5032 - Create Buildkite integration blocking merges unless E2E tests pass on staging (critical infrastructure milestone).'),
  bullet('PP-5031 - Add test coverage across web pixel code.'),
  bullet('PP-5268/PP-5271 - Address race conditions and infrequent failures in E2E suite (Jan 2026).'),

  h3('System Health & Monitoring (PP-4771) -- ~5% of cycle'),
  para([bold('OKR: '), normal('FY26Q4 - System Monitoring: all monitors and alerts per SRE guidance implemented and active')]),
  bullet('Tickets closed: ~6  |  Tickets created: ~6'),
  bullet('PP-5049 - Monitor for queue latency/size using dynamic Sidekiq queue metrics.'),
  bullet('PP-5052 - Monitor ensuring data is processed on all clusters.'),
  bullet('PP-5053 - Monitor for catalog import/historical backfill completion.'),

  h3('Cohort Import (PP-5416, PP-5438, PP-5308) -- ~12% of cycle'),
  bullet('Tickets closed: ~15  |  Tickets created: ~10'),
  bullet('PP-5309 - Create Amperity partner page (backend + frontend + API integration).'),
  bullet('PP-5439 - Create Airbridge cohort import partner page (delivered to external partner same day, Apr 2, 2026).'),
  bullet('PP-5215 - Investigate cohort queue delays (>2hr latency investigation).'),

  h3('Shopify Product Tags (PP-4463) -- ~4% of cycle'),
  para([bold('OKR: '), normal('FY27Q1 - Support additional Shopify product data for enterprise: release Shopify tags')]),
  bullet('PP-5347 - Allow updating tags selection for active catalogs.'),
  bullet('PP-5359 - Create Segment Extension Templates for Tags.'),

  h3('eCommerce Events Work -- ~8% of cycle'),
  para([bold('OKR: '), normal('FY27Q1 - eCommerce events feature parity')]),
  bullet('PP-5483 - Update historical backfill to include cancellations/refunds (7 subtasks executed).'),
  bullet('PP-5458 - Add order_placed_revenue and order_placed_exit FFs to recommended events clients.'),
  bullet('PP-5293 - Handle Products without Variants (bug fix shipped Apr 15).'),

  h3('Oncall & Bug Fixes -- ~6% of cycle'),
  bullet('PP-5042 - Fix issue in Shopify Web Pixel impacting Content Cards (Dec 2025).'),
  bullet('PP-5131 - Do not raise 500 error when connecting already-connected Shopify bridge.'),
  bullet('PP-5199 - Gracefully fail jobs if bridge gets disconnected.'),

  h3('FF Cleanup -- ~2% of cycle'),
  bullet('PP-5611 - Batch of 13 PRs to remove stale FFs (Apr 13, 2026).'),

  h2('From GitHub'),
  bullet('PRs merged: 188, across 10 repositories'),
  bullet('PRs reviewed: 487+'),
  bullet('Key repos: Appboy/platform (126 PRs), shopify-browser-automation-scripts (28), braze-shopify-app (10), braze-deployments (7), terraform-product-monitoring (7)'),
  bullet('Apr 13: Batch-opened 13 separate PRs (one per stale FF) -- high-throughput, methodical cleanup approach.'),
  bullet('PP-5664 (Snowflake query for eCommerce backfill) spanned platform, terraform-snowflake, braze-deployments, and partner-service -- cross-repo delivery.'),
  bullet('Contributed fix to braze-inc/beacon (Beacon Select component label truncation) and coordinated with FIX team to land in platform.'),

  h2('From Slack'),
  para([bold('Channels searched: '), normal('#_product-partner-team, #_product-partner-team-eng, #pde-product-partnerships-team, #proj-integration-bridge-refactor, #product-partners-team-alerts, #temp-new-cohort-import-partners-q1, #devops-core-platforms, #pde-frontend-ix-team, #irt-1061-04_14_2026-shopify_event_validation_issue')]),
  bullet('Mar 30: Authored formal outreach in #proj-integration-bridge-refactor to WhatsApp, Chat Apps, and Email teams -- coordinating migration timelines, LOE assessment, and process alignment.'),
  bullet('Apr 14 IRT: Provided Datadog log queries, identified scope of order_placed validation errors (124k events in ~7 days), diagnosed schema mismatch, had a fix with tests merged same day.'),
  bullet('Mar 19: Explained new TechnologyPartnerIntegration architecture in depth to WhatsApp engineer asking about multi-integration-per-app-group support.'),
  bullet('Dec 23: Proactively flagged Chat Apps team inquiry about migration state and volunteered path forward including Mongo collection status.'),
  bullet('Apr 8: Organized mini-kickoff with team and Raghav (Intel) to align on AI partner migration design before execution began.'),
  bullet('Apr 22: Independently reviewed Tae\'s ticket work, flagged structural risks, and proactively raised concerns to Dekel.'),
  bullet('Apr 2: Coordinated Airbridge API key rollout to external partner, communicated deployment timing, fielded follow-up questions during release freeze (Apr 8).'),

  h2('From 1:1 Notes'),
  bullet('Nov 2025: Explicitly stated he wants to lead the Integration Bridge Refactor -- and followed through as technical lead for the full cycle.'),
  bullet('Dec 2025: Shared challenge juggling planning, coding, and pairing simultaneously. Mentored Anubhav on frontend testing and Beacon styling beyond expected scope.'),
  bullet('Jan 2026: E2E test failures mostly resolved. Raised concern about team decision-making speed -- noted clearer ownership tends to resolve consensus bottlenecks.'),
  bullet('Feb 2026: Expressed preference to transition from refactor-heavy to product-forward work; raised interest in Shopify metadata work as a product-oriented initiative.'),
  bullet('Feb 2026: Led structured thinking on cohort import vs. Shopify migration risk, rollback ease, customer impact scope, and cluster-by-cluster release sequencing.'),
  bullet('Mar 2026: Task description completeness flagged -- preference for problem-statement framing is healthy but teammates sometimes need more explicit guidance.'),
  bullet('Apr 2026: Proactively raised concerns about bridge refactor complexity for audience sync (OAuth, state management). Thinking clearly about long-term architectural dependencies.'),

  h2('Ladder Signals -- Senior SE I'),

  h3('Strengths vs. Senior SE I bar'),
  bullet('Large project/epic ownership -- fully met: Technical lead on the Integration Bridge Refactor (FY26Q4 OKR). Scoped the backlog, defined the architecture, executed the majority of implementation, drove migration across 15+ partner types including cross-team coordination with WhatsApp, Chat Apps, Email, and Intel.'),
  bullet('Driving the technical area forward -- strong signal: Authored Confluence migration guide, reusable Cursor skill for partner migration, and FF release plan. Refactor explicitly designed to enable self-service by other teams -- force-multiplier contribution extending beyond his own ticket output.'),
  bullet('High output -- clear: 188 PRs merged across 10 repos, 487+ PRs reviewed, ~124 closed JIRA tickets in a single 6-month cycle. Volume is well above expectations at this level.'),

  h3('Gaps vs. Senior SE I bar'),
  bullet('Product-facing leadership still developing: Cycle was heavily skewed toward technical infrastructure. The Senior SE I bar calls for driving the product areas forward alongside technical work.'),
  bullet('Influence on team process still maturing: Flagged team decision-making concerns in Jan 2026 but has not yet fully driven process improvements assertively. Senior SE I bar calls for being a driving force in pushing team process forward.'),
  bullet('Completeness/ticket-level communication gap: Some tasks delivered without every sub-detail clearly articulated. At Senior SE I, others should be able to execute from your framing without constant check-ins.'),

  divider(),

  // WRITTEN REVIEW
  h1('Written Review'),

  h2('Accomplishments'),

  para([
    bold('Uriel led the team\'s most consequential technical initiative this half by taking full ownership of the Integration Bridge Refactor from scoping through delivery.'),
    normal(' He authored the complete work breakdown in November, defined the new TechnologyPartnerIntegration architecture, and executed migrations for 15+ partner types -- including Shopify, Segment, DataDog, and all Attribution and Cohort Import partners. He also extended the refactor\'s reach beyond the PP team by coordinating migration timelines and approaches with WhatsApp, Chat Apps, Email, and Intel teams, and authored a Confluence migration guide and a reusable Cursor skill that enabled those teams to self-execute. '),
    bold('Because Uriel drove this initiative end-to-end, the team delivered its FY26Q4 Refactor OKR while simultaneously laying the foundation for faster, self-service partner integrations across PDE.'),
  ]),

  para([
    bold('Uriel strengthened the team\'s reliability by building infrastructure improvements that reduced risk and improved system visibility.'),
    normal(' He delivered the Buildkite CI gate that blocks merges on E2E test failures -- the critical milestone for the team\'s E2E Testing OKR -- and followed up by resolving race conditions that had caused intermittent failures. He also implemented Datadog monitors for queue latency, cross-cluster data processing, and backfill job completion, directly fulfilling the System Monitoring OKR. When an incident surfaced order_placed validation errors affecting 124k events, he identified the scope of impact, diagnosed the schema mismatch, and had a fix with tests merged the same day. '),
    bold('Because of these contributions, the team entered Q1 FY27 with a more automated, observable, and resilient system.'),
  ]),

  para([
    bold('Uriel consistently elevated the people and knowledge around him through technical mentorship and proactive cross-team collaboration.'),
    normal(' He paired with Anubhav on frontend testing paradigms and Beacon component work, going beyond what the onboarding context required of him. He reviewed a teammate\'s ticket design, identified structural risks, and proactively flagged them before execution began. In cross-team channels, he fielded in-depth architecture questions from engineers outside PP and served as the external-facing owner of the refactor framework during outreach to multiple PDE teams. '),
    bold('Because Uriel invested in his teammates and cross-functional partners this way, the team moved faster and with greater confidence across multiple initiatives.'),
  ]),

  h2('Areas for Growth'),

  para([
    bold('Uriel can increase his impact by more actively driving product-facing initiatives alongside his technical work.'),
    normal(' This half, the large majority of his output was concentrated on infrastructure and refactor work. The Senior SE I bar calls for driving both the technical and product areas forward -- leading novel product initiatives, shaping roadmap direction, and collaborating with PM and PD on what to build, not just how. Concretely, he can pursue this by taking full ownership of an upcoming product initiative -- from requirements alignment through delivery -- and actively participating in the early shaping conversations with product and design. '),
    bold('By bringing the same ownership and execution quality he showed on the refactor to a product-facing initiative, Uriel can significantly broaden the scope of his impact on the team and its customers.'),
  ]),

  para([
    bold('Uriel can further increase his leverage on the team by more assertively driving process and protocol improvements.'),
    normal(' He has the technical credibility and visibility into team dynamics to identify where processes are breaking down -- and he demonstrated this awareness when he flagged decision-making inefficiencies in January 2026. However, flagging an issue is the starting point, not the outcome. The Senior SE I bar explicitly calls for being a driving force in pushing team process forward. Uriel can act on this by proposing concrete changes, following through on their adoption, and holding the team accountable to improved practices -- similar to how he successfully championed frontend testing in the prior half. '),
    bold('By moving from observing process gaps to owning their resolution, Uriel can make the team meaningfully more effective and demonstrate the kind of team-level impact that defines the Senior SE I level.'),
  ]),

  para([
    bold('Uriel can improve the clarity and completeness of how he communicates task-level context to teammates.'),
    normal(' When framing tickets or work items, his preference for problem-statement-oriented descriptions is directionally right, but there were instances this half where teammates needed more explicit guidance to execute independently. At the Senior SE I level, others should be able to pick up work Uriel has framed without requiring follow-up check-ins. Concretely, Uriel can focus on ensuring that tickets he creates or owns include enough detail on expected outcomes, edge cases, and any assumptions that need validation -- particularly for work that will be handed off or reviewed by others. '),
    bold('By raising the bar on task clarity, Uriel can multiply the team\'s execution speed and reduce the coordination overhead that slows delivery.'),
  ]),
];

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '\u2022',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 32, bold: true, font: 'Arial', color: '1F3864' },
        paragraph: { spacing: { before: 360, after: 120 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '2E75B6' },
        paragraph: { spacing: { before: 280, after: 80 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '404040' },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    children,
  }],
});

const outPath = '/Users/dekel.albocher/Documents/Claude/Projects/Performance manager/cycles/summer-2026/output/Uriel_Silva_2025-11-01_2026-04-30.docx';
Packer.toBuffer(doc).then(buf => {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buf);
  console.log('Written:', outPath);
});
