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

The test suite consists of **51 passing tests** across **5 test files** with **74.07% line coverage** and **72.16% statement coverage** (`vitest run --coverage`):

- `src/test/pattern_missing_topics.test.ts` (21 tests): Validates pattern-matching regexes and missing-clause detection across Consumer, Family, Housing, and Employee topics against real fixture samples.
- `src/test/handlers.test.ts` (18 tests): Tests deterministic logic handlers (`NP1` notice asymmetry, `RTO1` location conflicts, `RTO2` schedule quotas, `PS1` payslip deductions, `LV1` leave policy discrepancies).
- `src/test/accessibility.test.tsx` (5 tests): Performs automated DOM accessibility audits across all 4 navigation levels (DomainList, SectionList, TopicList, AnalysisView) using `vitest-axe`.
- `src/test/injection_and_exact_quote.test.ts` (4 tests): Verifies prompt-injection resistance, verbatim excerpt substring extraction, and whitespace/empty input handling.
- `src/test/redaction_and_export.test.ts` (3 tests): Tests client-side PII redaction (email, PAN, Aadhaar, phone numbers, long digits) and structured consultation export generation.

Testing uses a fixture-based approach with realistic sample documents located in `samples/` (e.g., `basic_rights_offer.txt`, `consumer_contracts.txt`, `early_release.txt`, `employee_clauses.txt`, `family_deeds.txt`, `housing_contracts.txt`, `notice_period.txt`, `rto_documents.txt`) verified against expected findings.

---

## Security and privacy

LawLens Work operates entirely client-side with zero backend server, zero database persistence, and zero outbound network calls with document data. Text pasted into the application remains in ephemeral React component state and is discarded upon navigation or clearing inputs. A strict 20,000-character input boundary prevents browser thread exhaustion, while client-side export features automatically mask sensitive identifiers (emails, phone numbers, PAN, Aadhaar, and bank account numbers) before copying. For full technical details, refer to [SECURITY.md](SECURITY.md).

---

## Accessibility

Automated testing using `vitest-axe` (`axe-core`) confirms zero automated violations across DOM landmarks, form labels, ARIA roles, and keyboard-focusable elements across all four navigation levels. However, automated audits cover only 30–40% of accessibility requirements and cannot compute browser-rendered CSS styling or assistive technology voice output. As detailed in [ACCESSIBILITY.md](ACCESSIBILITY.md), the following four areas require manual verification:
1. **Computed Color Contrast**: Validating rendered text against background colors (e.g., severity badges and warning banners) under real CSS cascade.
2. **Screen Reader Experience**: Verifying speech announcement order and dynamic updates using NVDA, JAWS, VoiceOver, or TalkBack.
3. **200% Text Zoom**: Ensuring layout reflow without clipping, overlapping, or horizontal scrolling at 200% zoom.
4. **Keyboard-Only Walkthrough**: Completing an entire end-to-end document review flow using only `Tab`, `Shift+Tab`, `Space`, and `Enter`.

---

## Deployment

LawLens Work compiles to a fully static web application (`dist/`) requiring no dynamic backend server, containerized runtime, or server-side process. Any static web host or CDN can serve the output.

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

> **Static Hosting Only**: This setup uses Firebase Hosting strictly for static CDN asset hosting. No Firebase cloud services (Firestore database, Firebase Authentication, Cloud Functions, or Firebase Analytics/telemetry) are used or included in the application bundle. All analysis, rule evaluation, and PII redaction execute 100% client-side in the user's browser, maintaining the zero-telemetry and offline privacy model documented in [ARCHITECTURE.md](ARCHITECTURE.md) and [SECURITY.md](SECURITY.md).

---

## Limitations and roadmap

The application intentionally uses a deterministic, rule-based engine rather than a live generative AI model to guarantee predictable execution, avoid prompt injection vulnerabilities, prevent hallucinations, and ensure complete user data privacy. Contractual and statutory standards (such as notice buyout rules, overtime provisions, and RTO mandates) vary across Indian state amendments and specific collective bargaining agreements; findings are informational checks and not formal legal advice. Future roadmap items include an optional, privacy-preserving server-side AI plain-language layer that performs pre-transmission client redaction, strict rate limiting, and zero-retention processing.

---

## License & contributions

- **License**: Released under the [MIT License](LICENSE).
- **Contributions**: Open for improvements to document pattern matching, statutory checks, and accessibility enhancements via GitHub pull requests.
