# LawLens Work

[![CI](https://img.shields.io/github/actions/workflow/status/owner/repo/ci.yml?branch=main&label=CI&logo=github)](https://github.com/owner/repo/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/Coverage-74.07%25%20Lines-brightgreen)](https://github.com/owner/repo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Test Coverage**: **74.07% Lines** | **72.16% Statements** (51 tests passing across 5 test suites)

LawLens Work is a client-side, privacy-first legal-access tool tailored for Indian employment, consumer, family, and housing agreements. Rather than making live model API calls, the system operates as an AI-assisted self-review tool powered by a deterministic, rule-based analysis engine (regex pattern matching + arithmetic/cross-document handlers) built to model how an experienced legal-document reviewer reads for specific issues, obligations, and omissions. All document parsing and checks are executed locally in the browser sandbox—no document text is ever transmitted to a server or external service.

---

## Core Capabilities & Test Mapping

The following matrix maps each user theme to its dedicated feature implementation, source file, and automated test suite:

| Theme bullet                                            | Feature                                                                                                                                                             | File                              | Test                                         |
| :------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :-------------------------------- | :------------------------------------------- |
| **simplify documents**                                  | Plain language summaries translating complex contractual phrasing and statutory jargon into accessible terms                                                        | `src/components/FindingsList.tsx` | `src/test/pattern_missing_topics.test.ts`    |
| **compare contracts/policies**                          | Cross-document analysis comparing original agreements against new directives or annexures (location conflicts, schedule rigidity, payslip deductions, leave quotas) | `src/engine/handlers.ts`          | `src/test/handlers.test.ts`                  |
| **highlight clauses/obligations/risks/inconsistencies** | Severity-ordered risk alerts (high/medium/low), verbatim quotation blocks (`exactQuote`), and pattern-matched risk detection                                        | `src/engine/engine.ts`            | `src/test/injection_and_exact_quote.test.ts` |
| **answer questions from provided documents**            | Contextual recommended inquiry questions generated directly from detected findings for negotiations or clarification                                                | `src/components/FindingsList.tsx` | `src/test/pattern_missing_topics.test.ts`    |
| **options and next steps**                              | One-click export of Draft Clarification Emails tailored to counterparties with client-side contact redaction                                                        | `src/components/ExportView.tsx`   | `src/test/redaction_and_export.test.ts`      |
| **summaries/checklists**                                | Indian statutory verification checklists ("What to verify") customized per domain (labour laws, RERA, Consumer Protection Act)                                      | `src/components/FindingsList.tsx` | `src/test/accessibility.test.tsx`            |
| **prepare for a legal professional**                    | Formatted Lawyer Consultation Brief export compiling matter overview, verbatim excerpts, Indian legal context, and advocate inquiries                               | `src/components/ExportView.tsx`   | `src/test/redaction_and_export.test.ts`      |

---

## Mandatory Disclaimer Verification

As confirmed by codebase verification (`src/components/AnalysisView.tsx`), the legal disclaimer banner (`DisclaimerBanner`) is rendered **unconditionally on every `AnalysisView` render**:

```tsx
// src/components/AnalysisView.tsx (line 144)
<DisclaimerBanner id="analysis-top-disclaimer" />
```

This ensures that whenever a user views or evaluates any legal topic, the notice explicitly states that the application provides informational pattern checks and self-review tools, strictly not advocate-client legal advice.

---

## Security & Privacy Controls

- **Client-Side Processing**: 100% of text parsing and regex pattern matching executes locally in browser memory.
- **Input Length Safeguard**: Enforces a strict 20,000 character maximum cap (`maxLength={20000}`) with live character counters.
- **Redaction on Export**: Includes a "Redact contact details" toggle (enabled by default) that automatically masks emails, phone numbers, PAN, Aadhaar, and bank account numbers in exported drafts.
- **Automated CI Security**: Continuous integration workflow runs `npm audit` on every push and pull request.

---

## Development & Verification Scripts

```bash
# Run linting and TypeScript checks
npm run lint

# Format code with Prettier
npm run format

# Run full test suite (Vitest + RTL + vitest-axe)
npm test

# Run test suite with v8 coverage summary
npm run test:coverage
```
