import { describe, it, expect } from "vitest";
import {
  handleNoticeAsymmetry,
  handleLocationConflict,
  handleFrequencyConflict,
  handlePayslipCheck,
  handleLeaveDaysConflict,
} from "../engine/handlers.ts";

describe("Engine Handler Tests (6 Handlers)", () => {
  // 1. notice_asymmetry
  describe("Handler: notice_asymmetry (NP1)", () => {
    it("firing case: employee notice period strictly exceeds company termination notice", () => {
      const input = [
        "The Employee must serve 90 days written notice to resign. The Company reserves the right to terminate employment with 30 days notice.",
      ];
      const findings = handleNoticeAsymmetry(input);
      expect(findings).toHaveLength(1);
      expect(findings[0].checkId).toBe("NP1");
      expect(findings[0].severity).toBe("high");
      expect(findings[0].exactQuote).toContain("90 days");
    });

    it("silent / no-data case: returns empty when text is empty or lacks numeric notice days", () => {
      expect(handleNoticeAsymmetry([""])).toHaveLength(0);
      expect(
        handleNoticeAsymmetry([
          "Either party may terminate the employment relationship by providing reasonable notice to the other.",
        ])
      ).toHaveLength(0);
    });

    it("edge case: reciprocal notice or company notice exceeding employee notice must not fire", () => {
      // Reciprocal 60 days
      const reciprocal = [
        "The Employee shall give 60 days notice of resignation. The Company may terminate employment by giving 60 days notice.",
      ];
      expect(handleNoticeAsymmetry(reciprocal)).toHaveLength(0);

      // Company gives longer notice (90 days vs 30 days)
      const companyLonger = [
        "The Employee must provide 30 days notice. The Company will provide 90 days notice prior to termination.",
      ];
      expect(handleNoticeAsymmetry(companyLonger)).toHaveLength(0);
    });
  });

  // 2. location_conflict
  describe("Handler: location_conflict (RTO1)", () => {
    it("firing case: Document A specifies one city and Document B requires a different city", () => {
      const docA =
        "Your primary base location will be Bengaluru at the tech campus.";
      const docB =
        "All engineering team members are required to report in-person to the Mumbai office.";
      const findings = handleLocationConflict([docA, docB]);
      expect(findings).toHaveLength(1);
      expect(findings[0].checkId).toBe("RTO1");
      expect(findings[0].exactQuote).toContain("Bengaluru");
      expect(findings[0].exactQuote).toContain("Mumbai");
    });

    it("silent / no-data case: returns empty when only one document or empty texts are provided", () => {
      expect(handleLocationConflict([""])).toHaveLength(0);
      expect(
        handleLocationConflict(["Base location is Bengaluru", ""])
      ).toHaveLength(0);
      expect(
        handleLocationConflict([
          "No cities mentioned here",
          "Still no locations mentioned",
        ])
      ).toHaveLength(0);
    });

    it("edge case: normalized equivalent cities (e.g. Bangalore and Bengaluru) must not fire", () => {
      const docA = "Base location: Bangalore, Karnataka.";
      const docB = "You are directed to report to the Bengaluru facility.";
      const findings = handleLocationConflict([docA, docB]);
      expect(findings).toHaveLength(0);
    });
  });

  // 3. frequency_conflict
  describe("Handler: frequency_conflict (RTO2)", () => {
    it("firing case: Document A allows occasional/flexible attendance while Document B mandates fixed days per week", () => {
      const docA =
        "The employee may work remotely and visit the premises occasionally as required by business.";
      const docB =
        "Effective next month, all staff must attend office 5 days a week.";
      const findings = handleFrequencyConflict([docA, docB]);
      expect(findings).toHaveLength(1);
      expect(findings[0].checkId).toBe("RTO2");
      expect(findings[0].exactQuote).toContain("occasionally as required");
      expect(findings[0].exactQuote).toContain("5 days a week");
    });

    it("silent / no-data case: returns empty on missing inputs or empty strings", () => {
      expect(handleFrequencyConflict([""])).toHaveLength(0);
      expect(
        handleFrequencyConflict(["Work from home allowed.", ""])
      ).toHaveLength(0);
    });

    it("edge case: silence in Document A (no attendance wording) must not trigger a conflict", () => {
      const docA =
        "Rahul is hired as Lead Architect with compensation INR 24,00,000 per annum.";
      const docB = "Employees are required to attend office 3 days per week.";
      const findings = handleFrequencyConflict([docA, docB]);
      expect(findings).toHaveLength(0);
    });
  });

  // 4. unexplained_deductions
  describe("Handler: unexplained_deductions (via handlePayslipCheck)", () => {
    it("firing case: payslip contains deductions not authorized in compensation annexure", () => {
      const docAAnnexure = `
        Basic Salary: 60000
        HRA: 24000
        Provident Fund: 7200
        Professional Tax: 200
      `;
      const docBPayslip = `
        Gross Salary: 84000
        Provident Fund: 7200
        Professional Tax: 200
        Special Asset Recovery: 5000
        Late Mark Penalty: 1500
        Net Pay: 70100
      `;
      const findings = handlePayslipCheck([docAAnnexure, docBPayslip]);
      const unexplained = findings.find(
        (f) => f.title === "Unexplained Salary Deductions"
      );
      expect(unexplained).toBeDefined();
      expect(unexplained?.plainSummary).toContain("Special Asset Recovery");
      expect(unexplained?.plainSummary).toContain("Late Mark Penalty");
    });

    it("silent / no-data case: returns empty when no payslip or annexure is provided", () => {
      expect(handlePayslipCheck([""])).toHaveLength(0);
      expect(handlePayslipCheck(["Basic Salary: 50000", ""])).toHaveLength(0);
    });

    it("edge case: all payslip deductions exist in compensation annexure must not fire unexplained deductions", () => {
      const docAAnnexure = `
        Basic Salary: 50000
        Provident Fund: 6000
        Professional Tax: 200
      `;
      const docBPayslip = `
        Gross Salary: 50000
        Provident Fund: 6000
        Professional Tax: 200
        Net Pay: 43800
      `;
      const findings = handlePayslipCheck([docAAnnexure, docBPayslip]);
      const unexplained = findings.find(
        (f) => f.title === "Unexplained Salary Deductions"
      );
      expect(unexplained).toBeUndefined();
    });
  });

  // 5. net_check
  describe("Handler: net_check (via handlePayslipCheck)", () => {
    it("firing case: Gross - Total Deductions does not equal Net Pay", () => {
      const payslip = `
        Gross Salary: 100000
        Provident Fund: 10000
        Income Tax: 10000
        Net Pay: 72000
      `;
      // 100000 - 20000 = 80000, but stated Net Pay is 72000 -> discrepancy of 8000
      const findings = handlePayslipCheck([payslip]);
      const netFinding = findings.find(
        (f) => f.title === "Net Pay Calculation Discrepancy"
      );
      expect(netFinding).toBeDefined();
      expect(netFinding?.plainSummary).toContain(
        "equals 80000, but stated Net Pay is 72000"
      );
    });

    it("silent / no-data case: returns empty when payslip text lacks Gross/Net numbers", () => {
      expect(
        handlePayslipCheck(["This document does not contain salary figures."])
      ).toHaveLength(0);
    });

    it("edge case: correct payslip arithmetic must stay silent", () => {
      const correctPayslip = `
        Gross Salary: 100000
        Provident Fund: 10000
        Income Tax: 10000
        Net Pay: 80000
      `;
      const findings = handlePayslipCheck([correctPayslip]);
      const netFinding = findings.find(
        (f) => f.title === "Net Pay Calculation Discrepancy"
      );
      expect(netFinding).toBeUndefined();
    });
  });

  // 6. leave_days_conflict
  describe("Handler: leave_days_conflict (LV1)", () => {
    it("firing case: Document A leave days total differs from Document B policy leave sum", () => {
      const docA =
        "The employee is entitled to 24 days of paid leave per calendar year.";
      const docB = `
        Leave Policy Summary:
        Casual leave: 10 days
        Sick leave: 6 days
      `;
      // 24 vs 16 days
      const findings = handleLeaveDaysConflict([docA, docB]);
      expect(findings).toHaveLength(1);
      expect(findings[0].checkId).toBe("LV1");
      expect(findings[0].plainSummary).toContain(
        "Document A specifies 24 days of leave, but Document B policy totals 16 days"
      );
    });

    it("silent / no-data case: returns empty when only one document or no numbers are present", () => {
      expect(handleLeaveDaysConflict([""])).toHaveLength(0);
      expect(
        handleLeaveDaysConflict(["You are entitled to paid leave.", ""])
      ).toHaveLength(0);
      expect(
        handleLeaveDaysConflict([
          "General leave rules apply.",
          "Standard office policies.",
        ])
      ).toHaveLength(0);
    });

    it("edge case: matching total leave sums must stay silent", () => {
      const docA = "Leave Entitlement: 21 days leave per annum.";
      const docB = `
        Privilege leave: 12 days
        Casual leave: 6 days
        Sick leave: 3 days
      `;
      // 12 + 6 + 3 = 21 == 21
      const findings = handleLeaveDaysConflict([docA, docB]);
      expect(findings).toHaveLength(0);
    });
  });
});
