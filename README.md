# LawLens Work

## Privacy-First AI-Assisted Legal Document Analysis

**Understand. Compare. Navigate. Communicate.**

LawLens Work is a privacy-first legal document analysis application designed to make complex legal information easier to understand and act upon.

It combines a **deterministic client-side legal analysis engine** with a **strictly bounded Gemini 2.5 Flash synthesis layer**.

The core legal analysis runs locally in the browser using structured rules, patterns, missing-clause detection, and specialized comparison handlers. When the user explicitly requests a Negotiation Memo, only **structured and server-sanitized findings** are sent to Gemini.

> **The original contract text is never transmitted to Gemini.**

LawLens Work is an informational assistance tool and does not provide legal advice or replace a qualified legal professional.

---

## Hackathon Problem Statement

### AI for Legal Assistance & Access

Legal information can often be complex, difficult to understand, and challenging to navigate without professional assistance.

LawLens Work addresses this challenge by helping users:

- Understand complex legal clauses in plain language
- Identify important obligations and risks
- Detect missing or asymmetric provisions
- Compare selected legal documents and policies
- Understand potential inconsistencies
- Generate focused questions for HR or legal professionals
- Prepare structured lawyer consultation briefs
- Draft professional clarification emails
- Generate a grounded negotiation memo using Gemini
- Organize legal information without replacing professional legal advice

---

# Why LawLens Work Is Different

LawLens Work is **not a generic legal chatbot**.

Instead of asking an AI model to independently interpret an entire contract, the application follows a controlled pipeline:

```text
User Document
     │
     ▼
Local Browser Processing
     │
     ▼
Deterministic Legal Analysis Engine
     │
     ├── Pattern Detection
     ├── Missing-Clause Detection
     ├── Specialized Handlers
     ├── Document Comparison
     └── Exact Clause Evidence
     │
     ▼
Structured Findings
     │
     ▼
Local PII Redaction
     │
     ▼
Server-Side Validation + PII Sanitization
     │
     ▼
Gemini 2.5 Flash
     │
     ▼
Grounded Negotiation Memo
