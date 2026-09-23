# ⚖️ LegalEase AI — Responsible AI for Legal Assistance & Access

> **AI-powered legal document understanding, comparison, evidence-backed review, and professional consultation preparation — designed to make complex legal information easier to understand without replacing a qualified legal professional.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite)]
[![Express](https://img.shields.io/badge/Express-5.x-black?logo=express)]
[![Gemini](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-4285F4?logo=google)]
[![Vitest](https://img.shields.io/badge/Vitest-76%2F76%20Passing-6E9F18?logo=vitest)]
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-success)]
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📌 Overview

LegalEase AI is a responsible AI application built for the **AI for Legal Assistance & Access** challenge.

Legal documents are often difficult for non-lawyers to understand because they contain:

- Complex legal terminology
- Long contractual clauses
- Important deadlines
- Financial conditions
- Employer and employee obligations
- Referenced policies and annexures
- Ambiguous wording
- Potential inconsistencies
- Multiple versions of agreements

LegalEase AI converts a document into a structured, easier-to-understand information model.

Instead of simply providing a generic chatbot interface, LegalEase AI provides dedicated workflows for:

- Document understanding
- Plain-language summaries
- Important clause identification
- Responsibility mapping
- Timeline extraction
- Evidence-backed review areas
- Actionable checklists
- Document-grounded questions
- Document comparison
- Legal-professional consultation preparation
- Executive summaries
- Negotiation memo generation

The system is intentionally designed around a core principle:

> **AI should help users understand and organize legal information — not pretend to be their lawyer.**

---

# 🎯 Problem Statement

Legal information is often inaccessible to ordinary users.

An employee receiving an offer letter, employment agreement, remote-work policy, NDA, or other legal document may struggle to answer basic questions such as:

- What exactly am I agreeing to?
- What are my responsibilities?
- What are the employer's responsibilities?
- Are there important dates or deadlines?
- What compensation or financial conditions are mentioned?
- Are there clauses I should review carefully?
- Is another document or policy referenced but missing?
- What changed between two versions?
- What should I ask a lawyer?
- What information should I prepare before a consultation?

Traditional legal research can be expensive and difficult to navigate.

LegalEase AI addresses this accessibility gap by transforming complex legal documents into structured, evidence-backed information.

---

# 💡 Solution

LegalEase AI follows a **document-grounded and structured AI architecture**.

The primary document analysis produces a structured intelligence model containing multiple sections.

That analysis is then reused throughout the application instead of repeatedly asking the AI model to reinterpret the same document.

This architecture provides:

- Lower AI usage
- Lower latency for derived features
- Better consistency
- Lower hallucination risk
- Easier testing
- Easier auditing
- Better user experience

---

# 🧭 Core User Journey

```text
User
 │
 ▼
Select Legal Matter
 │
 ▼
Provide Document
 │
 ▼
Contextual Matter Selection
 │
 ▼
AI Document Analysis
 │
 ▼
Structured Legal Intelligence
 │
 ├── Document Overview
 ├── Plain-Language Summary
 ├── Parties
 ├── Key Clauses
 ├── Employee Responsibilities
 ├── Employer Responsibilities
 ├── Important Dates
 ├── Financial Information
 ├── Potential Concerns
 ├── Missing Information
 ├── Information Checklist
 ├── Legal Professional Questions
 ├── Executive Summary
 └── Responsible AI Disclaimer
 │
 ▼
Derived Features
 │
 ├── Timeline
 ├── Evidence-backed Concerns
 ├── Information to Review
 ├── Consultation Preparation
 ├── Document Q&A
 └── Document Comparison
 │
 ▼
Optional AI Synthesis
 │
 └── Negotiation Memo
