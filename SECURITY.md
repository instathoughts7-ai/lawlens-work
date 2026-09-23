# Security Policy & Architecture

## What this app does

LawLens Work is an **entirely client-side web application** engineered for self-review of legal documents (employment agreements, payslips, consumer contracts, family settlement deeds, and tenancy agreements) within an Indian legal context. It functions as an AI-assisted legal-access tool built on a deterministic, rule-based analysis engine (regex pattern matching + arithmetic/cross-document handlers) that models how an experienced legal-document reviewer reads for specific risks, discrepancies, and statutory omissions.

Key characteristics:

- **Client-Only Architecture**: All document parsing, regex pattern matching, cross-document comparison, and arithmetic checks run exclusively inside the user's browser sandbox (V8 JavaScript engine).
- **No Backend Server**: There is no custom backend API, microservice, or proxy server receiving user document inputs.
- **No Stored Data**: The application does not store documents, findings, or user inputs in any persistent database, cookies, `localStorage`, or `sessionStorage`. All state lives in transient React component memory and is instantly erased when the user navigates away or clears inputs.
- **No External Calls**: Document text pasted into the application is never transmitted over the network. Zero network requests containing document payload are made to third-party services, analytical telemetry, or cloud vendors.

---

## Why this reduces risk

The client-only, zero-transmission architecture substantially eliminates the most common attack vectors and data liability concerns:

- **No PII Transmission**: Sensitive personally identifiable information (PII)—including employee compensation packages, PAN numbers, Aadhaar numbers, residential addresses, and family dispute terms—remains strictly on the user's local machine.
- **No API Keys to Leak**: Because the analysis engine is entirely deterministic and rule-based, no external AI API keys or service secrets are embedded in the client bundle or browser memory. There is zero risk of client-side secret exfiltration.
- **Nothing to Rate-Limit**: Because computations occur on the client's local CPU, the application cannot be subjected to server-side resource exhaustion, denial-of-service, or API quota exhaustion.
- **Immunity to Prompt Hijacking**: The evaluation pipeline is deterministic rather than an unconstrained LLM. Natural language instructions injected inside documents (e.g. _"Ignore all previous instructions"_) cannot hijack check rules or suppress findings.

---

## What is still validated

Despite operating purely client-side, the application enforces defensive operational boundaries:

- **Input Length Cap (20,000 Character Limit)**: Both single-document and dual-comparison document inputs enforce a strict **20,000 character maximum limit** (`maxLength={20000}`). The interface features live character counters (`{current} / 20,000 characters`) and programmatically aborts analysis execution if any pasted input exceeds this boundary, preventing browser thread hanging or memory bloat from maliciously oversized payloads.
- **Type-Safe Input Normalization**: Input normalization routines safely sanitize line endings (`\r\n` to `\n`), normalize duplicate spaces, and validate array structures before regex execution.
- **Anti-Hallucination Substring Verification**: All pattern and handler findings verify that `exactQuote` is a verbatim substring of the input document, or strictly `null` for missing-clause checks.

---

## Redaction on export

When users prepare outputs to share externally, LawLens Work provides dedicated client-side export capabilities with built-in data masking:

- **Export Targets**: Users can generate a **Draft Clarification Email** (for communicating with HR, landlords, sellers, or counterparties) or a **Lawyer Consultation Brief** (for preparing an initial consultation with a licensed Indian advocate).
- **Redaction Toggle**: The export view includes a **"Redact contact details"** toggle, enabled (**ON**) by default.
- **Masked Data Classes**:
  - **Email Addresses**: Replaced with `[REDACTED EMAIL]`.
  - **Phone Numbers**: Indian mobile numbers (`+91` / `[6-9]XXXXXXXXX`) and international numbers replaced with `[REDACTED PHONE]`.
  - **Indian Permanent Account Numbers (PAN)**: Replaced with `[REDACTED PAN]`.
  - **Aadhaar Numbers**: 12-digit grouped sequences replaced with `[REDACTED AADHAAR]`.
  - **Long Digit Sequences & Identifiers**: 10 to 18-digit bank account, policy, or provident fund numbers replaced with `[REDACTED NUMBER]`.
- This ensures that users do not inadvertently expose sensitive personal contact information or identification numbers when copying drafts to their clipboard.

---

## npm audit in CI

Software supply chain integrity is continuously enforced in the continuous integration pipeline:

- **Automated Audit**: The `.github/workflows/ci.yml` GitHub Actions workflow executes `npm audit` on every push and pull request.
- **Lockfile Enforcement**: A clean `package-lock.json` lockfile is maintained, ensuring reproducible dependency trees with zero known high or critical vulnerabilities.

---

## Limitations and future work

If a server-side AI model or LLM augmentation layer is added later to complement the deterministic rule engine, calls must move server-side, enforce rate limiting, and redact sensitive terms before transmission. This is documented below as the planned architectural roadmap, not a current gap:

1. **Server-Side API Proxying**: Any future model calls must transition strictly to a secure backend endpoint (`/api/*`). Secrets (such as API keys) must never be exposed to the client bundle.
2. **Pre-Transmission Client Redaction**: Client-side redaction (masking PAN, Aadhaar, bank accounts, and contact details) must execute _prior_ to transmitting document text to any backend AI service.
3. **Strict Rate Limiting & Auth**: The server endpoint must enforce rate-limiting, IP throttling, and session validation to prevent abuse.
4. **Zero-Data Retention Policy**: Any future backend AI proxy must enforce explicit zero-retention parameters, ensuring user text is processed ephemerally and never logged to persistent disks or model training sets.
