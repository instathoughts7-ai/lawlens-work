# LawLens Work

**AI for Legal Assistance & Access: Understand. Compare. Navigate.**

LawLens Work empowers employees, consumers, tenants, and families in India to understand complex legal documents, compare competing directives, identify hidden legal liabilities, and prepare professionally for consultations with legal experts or HR teams.

The application pioneers a **hybrid deterministic-grounded AI architecture**:
1. **Deterministic Legal Engine**: The client-side analysis engine uses rigorous regular expressions and specialized legal comparison handlers to model how an experienced Indian advocate reviews contracts. Every finding is anchored verbatim in the user's document text (`exactQuote`) or explicitly flagged when statutory terms are missing (`missing`). The deterministic engine runs entirely locally in the browser runtime.
2. **Responsible Gemini AI Synthesis**: To bridge the gap between technical legal findings and real-world negotiation, LawLens Work provides an optional, privacy-preserving AI Negotiation Memorandum powered by **Gemini 2.5 Flash**. The AI is strictly constrained to synthesize verified deterministic findings—never inventing legal conclusions, hallucinating unmentioned statutes, or receiving raw contract documents.

> "Information only, not legal advice. Check important decisions with a qualified professional."
> *(Rendered prominently on every analysis screen via `src/components/DisclaimerBanner.tsx`)*

[![CI Status](https://img.shields.io/github/actions/workflow/status/instathoughts7-ai/lawlens-work/ci.yml?branch=main&label=CI&logo=github)](https://github.com/instathoughts7-ai/lawlens-work/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/Coverage-74.07%25%20lines-brightgreen)](https://github.com/instathoughts7-ai/lawlens-work/actions/workflows/ci.yml)

---

## Alignment with "AI for Legal Assistance & Access"

| Challenge Requirement | LawLens Work Solution | File Reference | Verification Test |
| :--- | :--- | :--- | :--- |
| **Accessibility for Non-Lawyers** | Plain-language translations (`plainSummary`) and "Why this matters in India" contextual legal implications for 26 topics across Employment, Housing, Consumer, and Family matters. | `src/engine/engine.ts`, `src/components/FindingsList.tsx` | `src/test/pattern_missing_topics.test.ts` |
| **Document-Grounded Assistance** | Verbatim clause blockquotes (`exactQuote`) guarantee zero hallucinated evidence. Findings reflect exact contract text, never fabricated terms. | `src/engine/engine.ts`, `src/components/FindingsList.tsx` | `src/test/injection_and_exact_quote.test.ts` |
| **Compare Contracts & Policies** | Deterministic two-document cross-comparison detecting contract vs directive conflicts (e.g. Return-to-Office location, schedule quotas, payslip deductions, leave discrepancies). | `src/engine/handlers.ts`, `src/components/AnalysisView.tsx` | `src/test/handlers.test.ts` |
| **Actionable Checklists & Questions** | Contextual questions to ask counterparties (`questionToAsk`) paired with domain-specific statutory verification checklists (`verify_pointers`). | `scenarios.json`, `src/components/FindingsList.tsx` | `src/test/boundaries_and_comparisons.test.ts` |
| **Responsible AI Boundaries** | Gemini 2.5 Flash operates strictly within a server-side JSON schema to synthesize verified findings into an Executive Summary, Clause Rationales, and Diplomatic Negotiation Email—without predicting judicial outcomes or inventing claims. | `server.ts`, `src/components/ExportView.tsx` | `src/test/memo_api.test.ts`, `src/test/security_boundary.test.ts` |
| **Secure Legal Data Handling** | Raw contract documents never leave the client browser. For AI memos, only pre-redacted clause excerpts and finding metadata are transmitted over a rate-limited, size-bounded API. Client-side PII masking automatically shields emails, PAN, Aadhaar, and phone numbers. | `src/utils/redaction.ts`, `server.ts` | `src/test/redaction_and_export.test.ts`, `src/test/security_boundary.test.ts` |
| **Consultation Preparation** | One-click export of structured Lawyer Consultation Briefs and draft Clarification Emails ready to share with advocates or HR representatives. | `src/components/ExportView.tsx`, `src/utils/redaction.ts` | `src/test/redaction_and_export.test.ts` |

---

## How it works

Users navigate hierarchically through four levels: Domain → Section → Topic → Analysis Screen. The interface connects to a single shared execution engine (`src/engine/engine.ts`) driven by structured definitions in `scenarios.json`. The engine processes three kinds of checks: `pattern` (regular expressions identifying aggressive, ambiguous, or risky clauses), `missing` (identifying absent statutory safeguards, exit terms, or required disclosure items), and `handler` (custom logic for multi-document comparisons, notice asymmetry, and payroll arithmetic). Every reported finding either quotes the document verbatim via an exact excerpt match or is explicitly labeled "not found" for omitted clauses.

---

## Theme alignment

| Theme bullet | Feature | File | Test |
| :--- | :--- | :--- | :--- |
| **simplify documents** | Plain-language summaries (`plainSummary`) explaining complex statutory definitions and legal terms in accessible language | `src/engine/engine.ts`, `src/components/FindingsList.tsx` | `src/test/pattern_missing_topics.test.ts` |
| **compare contracts/policies** | Two-document cross-comparison detecting contract vs directive conflicts. **Scope:** Supported on 4 specific topics: Return-to-Office Location (`rto_location`, handler `RTO1`), RTO Schedule/Mandates (`rto_schedule`, handler `RTO2`), Payslip vs CTC Annexure (`payslip_check`, handler `PS1`), and Leave Entitlement vs Handbook (`leave_entitlement`, handler `LV1`) | `src/engine/handlers.ts`, `src/components/AnalysisView.tsx` | `src/test/handlers.test.ts` |
| **highlight clauses/obligations/risks/inconsistencies** | Severity-ranked risk indicators (`high`, `medium`, `low`) pairing verbatim clause blockquotes (`exactQuote`) with legal obligation alerts | `src/engine/engine.ts`, `src/components/FindingsList.tsx` | `src/test/injection_and_exact_quote.test.ts` |
| **answer questions from provided documents** | Contextual question generation (`questionToAsk`) offering targeted questions for employers, sellers, and landlords based directly on detected clauses | `src/components/FindingsList.tsx`, `scenarios.json` | `src/test/handlers.test.ts` |
| **options and next steps** | Contextual "Why this matters in India" legal analysis paired with one-click export of drafted clarification emails to counterparties | `src/components/FindingsList.tsx`, `src/components/ExportView.tsx` | `src/test/redaction_and_export.test.ts` |
| **summaries/checklists** | Statutory verification checklists (`verify_pointers`) displaying domain-specific legal checks (e.g., Shop & Establishment, RERA, Consumer Protection Act) | `scenarios.json`, `src/components/FindingsList.tsx` | `src/test/accessibility.test.tsx` |
| **prepare for a legal professional** | Formatted Lawyer Consultation Brief export compiling document excerpts, detected issues, relevant Indian law contexts, and advocate questions | `src/components/ExportView.tsx`, `src/utils/redaction.ts` | `src/test/redaction_and_export.test.ts` |

---

## Domains and coverage

| Domain | Sections | Topics | Status |
| :--- | :---: | :---: | :--- |
| **Employee** | 4 | 13 | All 13 topics wired up and active |
| **Consumer** | 2 | 4 | All 4 topics wired up and active |
| **Family matters** | 2 | 4 | All 4 topics wired up and active |
| **Housing** | 2 | 5 | All 5 topics wired up and active |
| **Total** | **10** | **26** | **26 wired (0 unwired)** |

*All 26 topics across 10 sections and 4 domains in `scenarios.json` are fully wired to checks and active in the analysis engine.*

---

## Getting started

```bash
# 1. Clone the repository
git clone https://github.com/instathoughts7-ai/lawlens-work.git
cd lawlens-work

# 2. Install dependencies
npm install

# 3. Start local development server (runs on port 3000)
npm run dev

# 4. Run test suite
npm test

# 5. Build for production
npm run build
```

---

## Testing

The test suite consists of **115 passing tests** across **11 test files** (`vitest run`):

- `src/test/pattern_missing_topics.test.ts` (21 tests): Validates pattern-matching regexes and missing-clause detection across Consumer, Family, Housing, and Employee topics against real fixture samples.
- `src/test/handlers.test.ts` (18 tests): Tests deterministic logic handlers (`NP1` notice asymmetry, `RTO1` location conflicts, `RTO2` schedule quotas, `PS1` payslip deductions, `LV1` leave policy discrepancies).
- `src/test/boundaries_and_comparisons.test.ts` (16 tests): Validates input character limits (20,000 chars), edge-case formatting, and dual-document splitters.
- `src/test/user_journey.test.ts` (15 tests): Tests end-to-end user navigation flows from Domain selection to Findings and Export.
- `src/test/memo_efficiency.test.ts` (10 tests): Validates client and server memo caching, in-flight request deduplication, and cache size bounds.
- `src/test/security_boundary.test.ts` (8 tests): Tests payload whitelisting, rate limiting, and PII protection on API endpoints.
- `src/test/memo_api.test.ts` (7 tests): Tests Gemini memo API schema validation, error handling, and status code propagation.
- `src/test/engine_efficiency.test.ts` (6 tests): Validates O(1) topic lookups, regex compilation caching, and single-pass location extraction.
- `src/test/accessibility.test.tsx` (6 tests): Performs automated DOM accessibility audits across all 4 navigation levels (DomainList, SectionList, TopicList, AnalysisView) using `vitest-axe`.
- `src/test/injection_and_exact_quote.test.ts` (4 tests): Verifies prompt-injection resistance, verbatim excerpt substring extraction, and whitespace/empty input handling.
- `src/test/redaction_and_export.test.ts` (4 tests): Tests client-side PII redaction (email, PAN, Aadhaar, phone numbers, long digits) and structured consultation export generation.

Testing uses a fixture-based approach with realistic sample documents located in `samples/` (e.g., `basic_rights_offer.txt`, `consumer_contracts.txt`, `early_release.txt`, `employee_clauses.txt`, `family_deeds.txt`, `housing_contracts.txt`, `notice_period.txt`, `rto_documents.txt`) verified against expected findings.

---

## Security and privacy

LawLens Work is built on a privacy-first hybrid architecture:

1. **Client-Side Document Sandbox**: All primary document parsing, regex pattern matching, cross-document comparison, and arithmetic checks run exclusively inside the user's browser runtime. Raw contract documents pasted into the application remain in ephemeral React state, are never stored in databases or local storage, and never leave the client browser.
2. **Strict Privacy Boundary for AI Synthesis**: When generating the optional Negotiation Memo via **Gemini 2.5 Flash**, raw contracts remain strictly on the client. Only pre-redacted clause excerpts (capped at 400 characters) and finding metadata are sent to `/api/summarize-findings`. Client-side redaction automatically masks emails, phone numbers, PAN, Aadhaar, and bank accounts prior to transmission.
3. **Defensive API Guardrails**: The server enforces a strict JSON schema whitelist (`ALLOWED_TOP_LEVEL_KEYS`, `ALLOWED_FINDING_KEYS`, `ALLOWED_SEVERITIES`), an in-memory sliding window rate limiter (30 requests/minute per IP), server-side PII sanitization as defense-in-depth, hardened HTTP response headers (`nosniff`, `DENY`), and in-memory LRU caching to eliminate redundant upstream AI calls. For full technical details, refer to [SECURITY.md](SECURITY.md).

---

## Accessibility

Automated testing using `vitest-axe` (`axe-core`) confirms zero automated violations across DOM landmarks, form labels, ARIA roles, and keyboard-focusable elements across all four navigation levels. However, automated audits cover only 30–40% of accessibility requirements and cannot compute browser-rendered CSS styling or assistive technology voice output. As detailed in [ACCESSIBILITY.md](ACCESSIBILITY.md), the following four areas require manual verification:
1. **Computed Color Contrast**: Validating rendered text against background colors (e.g., severity badges and warning banners) under real CSS cascade.
2. **Screen Reader Experience**: Verifying speech announcement order and dynamic updates using NVDA, JAWS, VoiceOver, or TalkBack.
3. **200% Text Zoom**: Ensuring layout reflow without clipping, overlapping, or horizontal scrolling at 200% zoom.
4. **Keyboard-Only Walkthrough**: Completing an entire end-to-end document review flow using only `Tab`, `Shift+Tab`, `Space`, and `Enter`.

---

## Deployment

LawLens Work supports flexible deployment models depending on environment requirements:

- **Static Deployment (Firebase Hosting / CDN)**: For purely deterministic, offline-capable client analysis, the frontend compiles to static assets (`dist/`) requiring no server runtime. A pre-configured `firebase.json` and `.firebaserc` are included for deploying to Firebase Hosting (`npm run build && firebase deploy --only hosting`).
- **Full-Stack Deployment (Cloud Run / Node.js Container)**: To enable the optional Gemini 2.5 Flash Negotiation Memo synthesis (`/api/summarize-findings`), the application runs via `server.ts` (`npm start`), serving the compiled static frontend with the secure backend API proxy.

### Deploying to Firebase Hosting

A pre-configured `firebase.json` and `.firebaserc` template are included in the repository. To deploy:

1. **Initialize Hosting** (first time only):
   ```bash
   firebase init hosting
   ```
   - Select **Use an existing project** (or create a new project ID).
   - Set public directory to: `dist`
   - Configure as a single-page app (rewrite all urls to `/index.html`): `Yes`
   - Set up automatic builds and deploys with GitHub: `No` (or as desired)
   - Overwrite `dist/index.html` if prompted: `No`

2. **Build and Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

> **Privacy Guarantee**: Regardless of deployment target, all contract parsing, rule evaluation, and PII redaction execute 100% client-side in the user's browser, maintaining the zero-telemetry and offline privacy model documented in [ARCHITECTURE.md](ARCHITECTURE.md) and [SECURITY.md](SECURITY.md).

---

## Limitations and roadmap

The application grounds all factual findings in deterministic, rule-based checks to eliminate hallucinations and protect document privacy. Contractual and statutory standards (such as notice buyout rules, overtime provisions, and RTO mandates) vary across Indian state amendments and specific collective bargaining agreements; findings are informational checks and not formal legal advice. Future roadmap items include expanded vernacular language translations (e.g., Hindi, Tamil, Telugu), additional state-specific labor code amendments, and client-side optical character recognition (OCR) for scanned physical documents.

---

## License & contributions

- **License**: Released under the [MIT License](LICENSE).
- **Contributions**: Open for improvements to document pattern matching, statutory checks, and accessibility enhancements via GitHub pull requests.
