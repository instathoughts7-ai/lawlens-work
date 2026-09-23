# Architecture & Technical Design

## Overview

LawLens Work is an entirely client-side, zero-telemetry legal-access tool tailored for Indian employment, consumer, family, and housing agreements. Rather than making live AI or cloud model API calls, the system operates as a deterministic, rule-based analysis engine (regex pattern matching + arithmetic/cross-document handlers) built to model how a legal-document reviewer reads for specific issues, risks, and omissions. All document parsing, check evaluations, and export workflows execute locally in the user's browser with zero network transmission of document content.

The architecture cleanly decouples:

1. **Taxonomic Configuration & Knowledge Base**: `/scenarios.json` (root) and `/src/data/scenarios.json`
2. **Analysis & Computational Rule Engine**: `/src/engine/engine.ts` and `/src/engine/handlers.ts`
3. **Data Redaction & Export Utilities**: `/src/utils/redaction.ts`
4. **Hierarchical UI Component Presentation Tree**: `/src/components/`

---

## 1. Taxonomic Domain Flow

The application navigates through a four-tiered hierarchy before entering document evaluation:

```
┌────────────────────────────────────────────────────────┐
│                   Domain Selection                     │
│   (e.g., Employee, Consumer, Family, Housing)          │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Section Selection                    │
│   (e.g., Leaving your job, Return to office, etc.)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                    Topic Selection                     │
│   (e.g., Notice period, Non-compete, Payslip check)    │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Document Analysis                    │
│   (Input Textarea(s) -> analyze() -> Findings/Export)  │
└────────────────────────────────────────────────────────┘
```

### Hierarchy Definitions (`src/types.ts`)

- **Domain (`Domain`)**: Top-level legal category (`employee`, `consumer`, `family`, `housing`). A domain is dynamically marked **active** if and only if:
  `domain.sections && domain.sections.length > 0 && domain.sections.some(s => s.topics && s.topics.length > 0)`.
  Inactive domains render with a visual `(soon)` badge and are disabled.
- **Section (`Section`)**: Thematic grouping of contractual situations within an active domain (e.g., _Leaving your job_, _Return to office_, _Online purchases & e-commerce_, _Rental and lease agreements_).
- **Topic (`Topic`)**: Specific transactional or contractual clause focus (e.g., _Notice period_, _Non-compete clause_, _RTO location change_, _Deductions & payslip verification_). Each topic defines:
  - An array of `checks` (strings corresponding to `check_id` entries in `checks_catalog`).
  - Optional domain/topic contextual guidance: `privacy_note` and `safety_note`.

---

## 2. Scenarios Configuration (`scenarios.json`)

The legal taxonomy, check catalog, and verification pointers reside in:

- **`/src/data/scenarios.json`**: Primary module imported directly by Vite into the client application bundle (`import scenariosDataRaw from '../data/scenarios.json'`).
- **`/scenarios.json`**: Canonical configuration file at the repository root maintaining identical structured JSON schema for external tooling, schemas, and audits.

### Structure of `scenarios.json`

```json
{
  "domains": [
    {
      "id": "employee",
      "label": "Employee",
      "description": "...",
      "verify_pointers": ["..."],
      "sections": [
        {
          "id": "leaving_job",
          "label": "Leaving your job",
          "topics": [
            {
              "id": "notice_period",
              "label": "Notice period",
              "checks": ["NP1", "NP2", "NP3", "NP4"]
            }
          ]
        }
      ]
    }
  ],
  "checks_catalog": {
    "NP1": {
      "type": "asymmetric_notice",
      "severity": "high",
      "kind": "handler",
      "title": "Asymmetric Notice Period",
      "plain_summary": "...",
      "why_it_matters": "...",
      "question_to_ask": "..."
    },
    "NP2": {
      "type": "notice_period_length",
      "severity": "medium",
      "kind": "pattern",
      "pattern": "(?:notice\\s+period|notice\\s+of)\\s+(?:is\\s+)?(?:90|ninety|three\\s+months|3\\s+months)",
      "title": "Long Notice Period (90 Days)",
      "plain_summary": "...",
      "why_it_matters": "...",
      "question_to_ask": "..."
    },
    "NP4": {
      "type": "missing_buyout",
      "severity": "low",
      "kind": "missing",
      "pattern": "buyout|pay\\s+in\\s+lieu|payment\\s+in\\s+lieu",
      "title": "Missing Notice Buyout Option",
      "plain_summary": "...",
      "why_it_matters": "...",
      "question_to_ask": "..."
    }
  }
}
```

---

## 3. Analysis Engine & Check Resolution (`src/engine/engine.ts`)

The primary entry point is `analyze(topicIdOrLabel: string, input: string | string[]): Finding[]`.

### Resolution Flow:

1. **Input Parsing & Normalization**:
   - Accepts either a single string, an array of strings (`[docA, docB]`), or text delimited by `=== DOCUMENT A ===` and `=== DOCUMENT B ===`.
   - Normalizes carriage returns (`\r\n` to `\n`) and trims redundant whitespace.
   - Enforces the 20,000 character input cap defensively.
2. **Topic Identification (`findTopic`)**:
   - Resolves the matching topic definition from `scenarios.json` by comparing topic IDs and labels.
3. **Check Catalog Dispatch**:
   For each `check_id` declared under `topic.checks`, the engine fetches the check definition from `checks_catalog` and dispatches by `kind`:
   - **`kind: "pattern"`**:
     - Compiles the regex from `checkDef.pattern` (case-insensitive).
     - If the regex matches the document text, extracts the exact matching sentence via `extractMatchingSentence`.
     - Validates that `exactQuote` is a verbatim substring of the input document.
     - Emits a `Finding` with the check's severity, title, plain summary, why it matters, and recommended question.
   - **`kind: "missing"`**:
     - Tests the input against `checkDef.pattern`.
     - If the pattern does **not** match anywhere in the document, it flags the omission of an expected protection (e.g. missing buyout clause, missing defect cure period, missing force majeure protection).
     - Emits a `Finding` with `exactQuote: null`.
   - **`kind: "handler"`**:
     - Dispatches execution to a dedicated computational TypeScript function in `src/engine/handlers.ts` based on `checkDef.type` or `check_id`.
     - Computational handlers extract values, compare across dual documents, execute arithmetic checks, and emit structured findings.
4. **Severity Sorting**:
   - Findings are sorted in priority order: `high` (weight 0) → `medium` (weight 1) → `low` (weight 2).

### Specialized Handlers (`src/engine/handlers.ts`):

- `notice_asymmetry` (`NP1`): Extracts employee notice duration vs. employer notice duration; flags unfair disparity (e.g., 90 days employee vs 30 days employer).
- `location_conflict` (`RTO1`): Compares designated base location in employment contract against mandatory reporting location in RTO notice, normalizing Indian city aliases (e.g., Bangalore ↔ Bengaluru, Bombay ↔ Mumbai).
- `frequency_conflict` (`RTO2`): Detects contradictions between discretionary/flexible remote language ("occasionally as required", "hybrid at manager discretion") and strict fixed in-office quotas ("5 days a week").
- `unexplained_deductions` (`PS1`): Compares itemized deductions in a payslip against pre-agreed deduction schedules in the compensation annexure, flagging unauthorized line items.
- `net_check` (`PS1`): Calculates `Gross Salary - Sum(Deductions)` and compares against stated `Net Pay` with a 1-unit rounding tolerance.
- `leave_days_conflict` (`LV1`): Compares annual leave entitlement declared in an offer letter against the itemized total in the employee handbook/policy.

---

## 4. UI Component Architecture Tree

The visual presentation adheres to a single-view, state-driven breadcrumb navigation pattern:

```
App.tsx
│
├── Header & BreadcrumbsBar
│     └── Renders current level path: Domains > [Domain] > [Section] > [Topic]
│
├── <main> View Router (Single active screen level)
│     │
│     ├── Level 1: DomainList.tsx
│     │     └── Renders active and soon-badged domain cards
│     │
│     ├── Level 2: SectionList.tsx
│     │     └── Displays thematic sections for the selected domain
│     │
│     ├── Level 3: TopicList.tsx
│     │     └── Displays topics with check counts and navigation chevrons
│     │
│     └── Level 4: AnalysisView.tsx
│           │
│           ├── DisclaimerBanner.tsx (Unconditionally rendered on every render)
│           ├── Privacy / Safety Notice Banners (When defined in scenarios.json)
│           ├── Sample Insertion Button (Loads curated realistic sample documents)
│           ├── Document Textarea Inputs (Single or dual with 20,000-char limits)
│           │
│           ├── FindingsList.tsx (Rendered when analysis results exist)
│           │     ├── Severity-ordered finding cards with exactQuote blockquotes
│           │     ├── Questions to ask section (grouped and deduped)
│           │     └── Statutory checklist ("What to verify")
│           │
│           └── ExportView.tsx (Rendered alongside findings)
│                 ├── Redact contact details toggle (enabled by default)
│                 ├── Draft Clarification Email view
│                 ├── Lawyer Consultation Brief view
│                 └── Copy to clipboard button
│
└── Footer
      └── Static legal disclaimer and client-side processing guarantee
```
