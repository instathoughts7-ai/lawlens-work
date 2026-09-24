import { describe, it, expect } from "vitest";
import { analyze } from "../engine/engine.ts";
import {
  handleNoticeAsymmetry,
  handleLocationConflict,
  handleFrequencyConflict,
  handleLeaveDaysConflict,
  handlePayslipCheck,
} from "../engine/handlers.ts";
import {
  redactSensitiveData,
  prepareRedactedFindingsForMemo,
  computeAnalysisCacheKey,
  generateLawyerBrief,
  generateDraftEmail,
} from "../utils/redaction.ts";
import scenarios from "../data/scenarios.json";

describe("E2E User Journey & Problem Statement Alignment Suite", () => {
  // Journey 1: Employee Legal Analysis (Domain -> Topic -> Input -> Deterministic Analysis -> Findings)
  describe("Journey 1: Employee Legal Analysis Flow", () => {
    it("navigates Employee domain to notice period check and produces verified deterministic findings", () => {
      const employeeDomain = scenarios.domains.find((d) => d.id === "employee");
      expect(employeeDomain).toBeDefined();

      const noticeTopic = employeeDomain?.sections
        ?.flatMap((s) => s.topics)
        .find((t) => t.id === "notice_length");
      expect(noticeTopic).toBeDefined();
      expect(noticeTopic?.checks).toContain("NP1");

      const contractInput = "The Employee must serve 90 days written notice to resign. The Company reserves the right to terminate employment with 30 days notice.";

      const findings = analyze("notice_length", contractInput);
      expect(findings).toHaveLength(1);

      const np1 = findings[0];
      expect(np1.checkId).toBe("NP1");
      expect(np1.severity).toBe("high");
      expect(np1.title).toBe("Notice Period Asymmetry");
      expect(np1.exactQuote).toContain("90 days");
      expect(np1.exactQuote).toContain("30 days");
      expect(np1.plainSummary).toBeDefined();
      expect(np1.whyItMatters).toContain("career");
      expect(np1.questionToAsk).toContain("reciprocal");
    });

    it("evaluates negative contracts cleanly without producing false-positive findings", () => {
      const balancedContract = "The Employee shall give 60 days notice of resignation. The Company may terminate employment by giving 60 days notice.";
      const findings = analyze("notice_length", balancedContract);
      expect(findings).toHaveLength(0);
    });
  });

  // Journey 2: Findings Reliability & Anti-Fabrication Guarantees
  describe("Journey 2: Findings Reliability & Source Anchoring", () => {
    it("missing/empty input yields zero fabricated findings safely", () => {
      expect(analyze("notice_length", "")).toEqual([]);
      expect(analyze("notice_length", "   \n\t  ")).toEqual([]);
    });

    it("verbatim exactQuote guarantee: every pattern finding excerpt matches input text", () => {
      const contractText = "During your employment with the Company and for a duration of 12 months following termination, you shall not engage in any competing business.";
      const findings = analyze("non_compete", contractText);
      expect(findings.length).toBeGreaterThan(0);

      findings.forEach((finding) => {
        if (finding.type === "pattern") {
          expect(finding.exactQuote).not.toBeNull();
          expect(contractText).toContain(finding.exactQuote!);
        } else if (finding.type === "missing") {
          // Missing clauses are explicitly absent and must have null exactQuote
          expect(finding.exactQuote).toBeNull();
        }
      });
    });

    it("statutory references and severity classifications remain consistent", () => {
      const input = "During your employment with the Company and for a duration of 12 months following termination, you shall not engage in any competing business.";
      const findings = analyze("non_compete", input);
      const nc1 = findings.find((f) => f.checkId === "NC1");
      expect(nc1).toBeDefined();
      expect(nc1?.severity).toBe("medium");
      expect(nc1?.whyItMatters).toContain("Section 27 of the Indian Contract Act");
    });
  });

  // Journey 3: Multi-Document Comparison Verification
  describe("Journey 3: Two-Document Comparison Flow", () => {
    it("identifies meaningful conflicts across two documents (RTO location conflict)", () => {
      const offerDoc = "Offer Letter Clause 3: Base Location shall be Bengaluru, Karnataka.";
      const rtoDoc = "Company Circular: In accordance with executive orders, all staff must report to Hyderabad.";
      const findings = handleLocationConflict([offerDoc, rtoDoc]);

      expect(findings).toHaveLength(1);
      expect(findings[0].checkId).toBe("RTO1");
      expect(findings[0].severity).toBe("high");
      expect(findings[0].exactQuote).toContain("Bengaluru");
      expect(findings[0].exactQuote).toContain("Hyderabad");
    });

    it("handles zero difference when documents agree on location and regional synonyms", () => {
      const docA = "Employment Contract: Base Location: Bengaluru.";
      const docB = "Directive: Employees to report to the Bangalore office.";
      const findings = handleLocationConflict([docA, docB]);
      expect(findings).toHaveLength(0);
    });

    it("handles missing second document gracefully without throwing errors", () => {
      const docA = "Office Location: New Delhi.";
      expect(handleLocationConflict([docA, ""])).toHaveLength(0);
      expect(handleLocationConflict([docA])).toHaveLength(0);
      expect(handleFrequencyConflict([docA, ""])).toHaveLength(0);
      expect(handleLeaveDaysConflict([docA, ""])).toHaveLength(0);
      expect(handlePayslipCheck([docA, ""])).toHaveLength(0);
    });

    it("handles malformed/non-numeric inputs in payslip check without NaN or crash", () => {
      const docA = "Gross Salary: not a number\nNet Pay: unavailable";
      const docB = "CTC: unknown";
      const findings = handlePayslipCheck([docA, docB]);
      expect(Array.isArray(findings)).toBe(true);
    });
  });

  // Journey 4: Privacy & Client-Side Redaction
  describe("Journey 4: Privacy & Data Protection Safeguards", () => {
    it("redacts Aadhaar, PAN, emails, and phone numbers before export", () => {
      const rawText = "Contact HR at hr@company.com or call +91-9988776655. PAN: ABCDE1234F Aadhaar: 1234 5678 9012.";
      const redacted = redactSensitiveData(rawText);

      expect(redacted).not.toContain("hr@company.com");
      expect(redacted).not.toContain("9988776655");
      expect(redacted).not.toContain("ABCDE1234F");
      expect(redacted).not.toContain("1234 5678 9012");

      expect(redacted).toContain("[REDACTED EMAIL]");
      expect(redacted).toContain("[REDACTED PHONE]");
      expect(redacted).toContain("[REDACTED PAN]");
      expect(redacted).toContain("[REDACTED AADHAAR]");
    });

    it("prepares bounded finding payloads for Gemini memo without raw contract text", () => {
      const findings = [
        {
          checkId: "NP1",
          title: "Asymmetric Notice",
          type: "handler",
          severity: "high" as const,
          plainSummary: "Notice is 90 days for employee and 30 for employer.",
          exactQuote: "Employee notice: 90 days. Contact support@org.in.",
          whyItMatters: "Exit barrier under Indian labor law.",
          questionToAsk: "Can notice be mutual 30 days?",
        },
      ];

      const payload = prepareRedactedFindingsForMemo(findings);
      expect(payload).toHaveLength(1);
      expect(payload[0].exactQuote).toContain("[REDACTED EMAIL]");
      expect(payload[0].exactQuote).not.toContain("support@org.in");

      // Verify no raw unredacted contract text key exists
      expect((payload[0] as any).rawContractText).toBeUndefined();
      expect((payload[0] as any).rawDocument).toBeUndefined();
    });
  });

  // Journey 5: Gemini Negotiation Memo Cache & Concurrency Key Invariants
  describe("Journey 5: AI Negotiation Memo Key Determinism", () => {
    it("generates stable, deterministic cache keys for identical findings regardless of input ordering", () => {
      const findingA = {
        checkId: "NP1",
        title: "Notice Asymmetry",
        severity: "high" as const,
        plainSummary: "Summary A",
        exactQuote: "Quote A",
        whyItMatters: "Why A",
        questionToAsk: "Question A",
      };
      const findingB = {
        checkId: "ER1",
        title: "Early Release",
        severity: "medium" as const,
        plainSummary: "Summary B",
        exactQuote: "Quote B",
        whyItMatters: "Why B",
        questionToAsk: "Question B",
      };

      const key1 = computeAnalysisCacheKey("employee", "notice_length", [findingA, findingB]);
      const key2 = computeAnalysisCacheKey("employee", "notice_length", [findingB, findingA]);

      expect(key1).toBe(key2);
      expect(key1).toContain("employee:notice_length:2:");
    });

    it("changes cache key when findings change", () => {
      const findingA = {
        checkId: "NP1",
        title: "Notice Asymmetry",
        severity: "high" as const,
        plainSummary: "Summary A",
        exactQuote: "Quote A",
        whyItMatters: "Why A",
        questionToAsk: "Question A",
      };

      const key1 = computeAnalysisCacheKey("employee", "notice_length", [findingA]);
      const key2 = computeAnalysisCacheKey("employee", "notice_length", []);

      expect(key1).not.toBe(key2);
    });
  });

  // Journey 6: Consultation & Export Outputs
  describe("Journey 6: Professional Consultation & Export Artifacts", () => {
    const sampleFindings = [
      {
        checkId: "NP1",
        title: "Asymmetric Notice Period",
        severity: "high" as const,
        plainSummary: "Notice is 90 days for employee and 30 for company.",
        exactQuote: "Employee notice: 90 days vs Company notice: 30 days.",
        whyItMatters: "Imposes unfair career restrictions.",
        questionToAsk: "Can notice be made mutual at 30 days?",
      },
    ];

    it("generates a comprehensive Lawyer Consultation Brief with statutory checklist", () => {
      const brief = generateLawyerBrief(
        "Employee Rights",
        "Notice Period",
        sampleFindings,
        ["Check state Shops and Establishments Act", "Verify appointment letter terms"],
        true
      );

      expect(brief).toContain("LAWYER CONSULTATION BRIEF: EMPLOYEE RIGHTS - NOTICE PERIOD");
      expect(brief).toContain("[Finding 1] Asymmetric Notice Period");
      expect(brief).toContain("Suggested Inquiry: Can notice be made mutual at 30 days?");
      expect(brief).toContain("STATUTORY / COMPLIANCE CHECKLIST");
      expect(brief).toContain("[ ] Check state Shops and Establishments Act");
      expect(brief).toContain("Notice: Prepared for initial legal consultation. Does not constitute legal advice.");
    });

    it("generates a polite, professional Clarification Request Email for HR", () => {
      const email = generateDraftEmail(
        "Employee Rights",
        "Notice Period",
        sampleFindings,
        ["Can notice be made mutual at 30 days?"],
        true
      );

      expect(email).toContain("Subject: Clarification Request: Notice Period Clauses");
      expect(email).toContain("Dear Human Resources / Payroll Team,");
      expect(email).toContain("Specific questions for your clarification:");
      expect(email).toContain("- Can notice be made mutual at 30 days?");
      expect(email).toContain("I am writing to seek clarification regarding specific terms");
    });
  });
});
