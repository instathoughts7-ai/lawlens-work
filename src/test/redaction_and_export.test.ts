import { describe, it, expect } from "vitest";
import {
  redactSensitiveData,
  generateDraftEmail,
  generateLawyerBrief,
  prepareRedactedFindingsForMemo,
} from "../utils/redaction.ts";

describe("Redaction & Export Utilities", () => {
  it("redacts email addresses, phone numbers, PAN, Aadhaar, and bank accounts", () => {
    const rawText = `
      Contact HR at hr.director@techcorp.in or call +91-9876543210.
      Employee PAN is ABCDE1234F and Aadhaar is 1234 5678 9012.
      Salary account number is 9876543210123456.
    `;

    const redacted = redactSensitiveData(rawText);

    expect(redacted).not.toContain("hr.director@techcorp.in");
    expect(redacted).toContain("[REDACTED EMAIL]");

    expect(redacted).not.toContain("+91-9876543210");
    expect(redacted).toContain("[REDACTED PHONE]");

    expect(redacted).not.toContain("ABCDE1234F");
    expect(redacted).toContain("[REDACTED PAN]");

    expect(redacted).not.toContain("1234 5678 9012");
    expect(redacted).toContain("[REDACTED AADHAAR]");

    expect(redacted).not.toContain("9876543210123456");
    expect(redacted).toContain("[REDACTED NUMBER]");
  });

  it("generateDraftEmail includes findings and questions, and respects redaction flag", () => {
    const findings = [
      {
        title: "Asymmetric Notice Period",
        plainSummary: "Notice is 90 days for employee vs 30 days for employer.",
        exactQuote: "Notice: 90 days. Contact hr@corp.com or 9876543210.",
      },
    ];
    const questions = ["Can the employer match the 30-day notice period?"];

    const emailRedacted = generateDraftEmail(
      "Employee",
      "Notice Period",
      findings,
      questions,
      true
    );

    expect(emailRedacted).toContain(
      "Subject: Clarification Request: Notice Period Clauses"
    );
    expect(emailRedacted).toContain("Asymmetric Notice Period");
    expect(emailRedacted).toContain(
      "Can the employer match the 30-day notice period?"
    );
    expect(emailRedacted).not.toContain("hr@corp.com");
    expect(emailRedacted).toContain("[REDACTED EMAIL]");
    expect(emailRedacted).not.toContain("9876543210");
    expect(emailRedacted).toContain("[REDACTED PHONE]");

    const emailRaw = generateDraftEmail(
      "Employee",
      "Notice Period",
      findings,
      questions,
      false
    );
    expect(emailRaw).toContain("hr@corp.com");
    expect(emailRaw).toContain("9876543210");
  });

  it("generateLawyerBrief formats matter overview, findings, statutory pointers, and respects redaction", () => {
    const findings = [
      {
        checkId: "NP1",
        title: "Asymmetric Notice Period",
        severity: "high",
        plainSummary: "Employee must give 90 days; employer gives 30 days.",
        exactQuote: "Employee notice: 90 days. Send to legal@firm.in.",
        whyItMatters: "Unbalanced notice periods burden employees.",
        questionToAsk: "Can the notice period be made reciprocal at 30 days?",
      },
    ];
    const pointers = [
      "Check state Shops and Establishments Act maximum notice limits.",
    ];

    const briefRedacted = generateLawyerBrief(
      "Employee",
      "Notice Period",
      findings,
      pointers,
      true
    );

    expect(briefRedacted).toContain(
      "LAWYER CONSULTATION BRIEF: EMPLOYEE - NOTICE PERIOD"
    );
    expect(briefRedacted).toContain("Asymmetric Notice Period");
    expect(briefRedacted).toContain("Check state Shops and Establishments Act");
    expect(briefRedacted).not.toContain("legal@firm.in");
    expect(briefRedacted).toContain("[REDACTED EMAIL]");

    const briefRaw = generateLawyerBrief(
      "Employee",
      "Notice Period",
      findings,
      pointers,
      false
    );
    expect(briefRaw).toContain("legal@firm.in");
  });

  it("prepareRedactedFindingsForMemo strips raw context and redacts sensitive PII in excerpts", () => {
    const findings = [
      {
        checkId: "NP1",
        title: "Asymmetric Notice Period",
        severity: "high",
        plainSummary: "90-day employee notice vs 30-day employer notice.",
        exactQuote:
          "For inquiries, email hr@company.com or phone +91-9988776655. Notice required: 90 days.",
        whyItMatters: "Burdensome notice obligation.",
        questionToAsk: "Can notice be mutual at 30 days?",
      },
      {
        checkId: "SC1",
        title: "Missing Relieving Letter Clause",
        severity: "medium",
        plainSummary: "Offer omits unconditional exit documentation commitment.",
        exactQuote: null,
        whyItMatters: "Essential for next employment.",
        questionToAsk: "Will an experience and relieving letter be issued?",
      },
    ];

    const prepared = prepareRedactedFindingsForMemo(findings);

    expect(prepared).toHaveLength(2);
    expect(prepared[0].checkId).toBe("NP1");
    expect(prepared[0].exactQuote).not.toContain("hr@company.com");
    expect(prepared[0].exactQuote).toContain("[REDACTED EMAIL]");
    expect(prepared[0].exactQuote).not.toContain("+91-9988776655");
    expect(prepared[0].exactQuote).toContain("[REDACTED PHONE]");
    expect(prepared[0].exactQuote).toContain("Notice required: 90 days.");
    expect(prepared[1].exactQuote).toBeNull();
  });
});
