# .docx Generation Patterns — Shared Reference

## Purpose

Both `engineer-perf-review` and `manager-perf-review` generate `.docx` output files using the `docx` npm library. This document captures shared conventions. For complete patterns, consult the `anthropic-skills:docx` skill.

## File naming conventions

### IC review files
```
cycles/<slug>/output/<FirstName>_<LastName>_<cycle.start>_<cycle.end>.docx
cycles/<slug>/output/<FirstName>_<LastName>_<cycle.start>_<cycle.end>_evidence.md
```

### EM review files
```
cycles/<slug>/output/<FirstName>_<LastName>_EM_<cycle.start>_<cycle.end>.docx
cycles/<slug>/output/<FirstName>_<LastName>_EM_<cycle.start>_<cycle.end>_evidence.md
```

Use ISO date format (YYYY-MM-DD). Never use a generic filename like `PerfReviews.docx`.

## Document formatting standards

- **Font:** Arial throughout
- **Margins:** 1 inch on all sides
- **Paper:** US Letter
- **Dates in content:** Use ISO format (YYYY-MM-DD) or spelled-out (e.g. "Nov 1, 2025 – Apr 30, 2026")

## Standard document structure

### Header block (top of every review doc)
```
[Name] — [Level]
Review Period: <cycle.start> – <cycle.end> · <cycle.name>
Teams: [team_key(s)]   ← EM/SEM reviews only
```

### Heading hierarchy
- **Heading 1:** Major sections (Data Digest, Calibration, Achievements, Areas for Improvement)
- **Heading 2:** Sub-sections within Heading 1 (From JIRA, From GitHub, etc.)
- **Normal:** Body text

## Key docx library patterns

### Required imports
```javascript
const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType } = require('docx');
```

### Creating a heading
```javascript
new Paragraph({
  text: "Data Digest",
  heading: HeadingLevel.HEADING_1,
})
```

### Creating a heading 2
```javascript
new Paragraph({
  text: "Team OKR Delivery",
  heading: HeadingLevel.HEADING_2,
})
```

### Bold text inline
```javascript
new Paragraph({
  children: [
    new TextRun({ text: "Score: ", bold: true }),
    new TextRun({ text: "3-4 leaning 4" }),
  ],
})
```

### Bullet list item
```javascript
new Paragraph({
  text: "Delivered CO Source/Sync GA on schedule",
  bullet: { level: 0 },
})
```

### Saving the document
```javascript
const { Packer } = require('docx');
const fs = require('fs');

const doc = new Document({ sections: [{ children: [...paragraphs] }] });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outputPath, buffer);
```

## Evidence file format

Evidence files are markdown (not .docx). They live next to the review file:
```
cycles/<slug>/output/<FirstName>_<LastName>_EM_<start>_<end>_evidence.md
```

Organized by **claim** (not by source). For each bullet that will appear in the review:
```markdown
### [Short label matching the bullet headline]
- Source type: [ticket key / PR / doc date] — [one-line description of what it shows]
```

See `profile_pattern.md` for cache file conventions.
