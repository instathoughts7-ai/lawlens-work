import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { analyze } from "../engine/engine.ts";

// Load fixture samples
const sampleEarlyRelease = fs.readFileSync(
  path.resolve(__dirname, "../../samples/early_release.txt"),
  "utf-8"
);
const sampleBasicOffer = fs.readFileSync(
  path.resolve(__dirname, "../../samples/basic_rights_offer.txt"),
  "utf-8"
);
const sampleEmployeeClauses = fs.readFileSync(
  path.resolve(__dirname, "../../samples/employee_clauses.txt"),
  "utf-8"
);
const sampleConsumer = fs.readFileSync(
  path.resolve(__dirname, "../../samples/consumer_contracts.txt"),
  "utf-8"
);
const sampleFamily = fs.readFileSync(
  path.resolve(__dirname, "../../samples/family_deeds.txt"),
  "utf-8"
);
const sampleHousing = fs.readFileSync(
  path.resolve(__dirname, "../../samples/housing_contracts.txt"),
  "utf-8"
);

describe("Pattern and Missing Checks across all 4 domains", () => {
  // EMPLOYEE DOMAIN
  describe("Employee Domain Topics", () => {
    it("Topic: early_release - fires ER1/ER3/ER4 on early release sample and stays silent on clean terms", () => {
      const positiveFindings = analyze("early_release", sampleEarlyRelease);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("ER1");
      expect(checkIds).toContain("ER3");
      expect(checkIds).toContain("ER4");
      // False-positive guard: NP2 should not fire on earlyRelease text
      expect(checkIds).not.toContain("NP2");

      // Negative check
      const cleanText =
        "The employee may request early release in writing, and buyout will be computed on basic pay as agreed by both parties with no retention of certificates.";
      const cleanFindings = analyze("early_release", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });

    it("Topic: non_compete - fires NC1 on post-employment restrictions and stays silent on standard active loyalty", () => {
      const positiveFindings = analyze("non_compete", sampleBasicOffer);
      expect(positiveFindings.some((f) => f.checkId === "NC1")).toBe(true);

      const cleanText =
        "During your active employment, you shall devote full attention to company duties. No post-termination restrictions apply.";
      const cleanFindings = analyze("non_compete", cleanText);
      expect(cleanFindings.some((f) => f.checkId === "NC1")).toBe(false);
    });

    it("Topic: resignation_acceptance - fires RL1 on subjective resignation approval and stays silent on unilateral notice exit", () => {
      const positiveFindings = analyze(
        "resignation_acceptance",
        sampleEmployeeClauses
      );
      expect(positiveFindings.some((f) => f.checkId === "RL1")).toBe(true);

      const cleanText =
        "The employee may resign by giving written notice. Resignation becomes effective upon completion of notice period without requiring discretionary consent.";
      const cleanFindings = analyze("resignation_acceptance", cleanText);
      expect(cleanFindings.some((f) => f.checkId === "RL1")).toBe(false);
    });

    it("Topic: standard_clauses - detects missing standard clauses on minimal text and stays silent on comprehensive offer", () => {
      const minimalOffer =
        "Rahul is appointed as Software Engineer with fixed salary INR 10,00,000.";
      const minimalFindings = analyze("standard_clauses", minimalOffer);
      const missingIds = minimalFindings.map((f) => f.checkId);
      expect(missingIds).toContain("BR2"); // working hours missing
      expect(missingIds).toContain("BR3"); // variable pay missing
      expect(missingIds).toContain("BR4"); // non-compete missing
      expect(missingIds).toContain("BR7"); // governing law missing

      // False positive guard: on comprehensive offer, covered clauses do NOT fire as missing
      const comprehensiveOffer = `
        Duties and responsibilities include software architecture.
        Standard business hours are 9am to 6pm, 40 working hours per week.
        Eligible for performance bonus up to 15% annually.
        Non-compete terms are defined in schedule A.
        Strict confidentiality and intellectual property assignment.
        Either party may terminate with 60 days written notice.
        Subject to jurisdiction of courts of Bengaluru under laws of India.
      `;
      const compFindings = analyze("standard_clauses", comprehensiveOffer);
      expect(compFindings).toHaveLength(0);
    });

    it("Topic: probation - fires PB1 on indefinite probation extension and stays silent on fixed confirmation", () => {
      const positiveFindings = analyze("probation", sampleEmployeeClauses);
      expect(positiveFindings.some((f) => f.checkId === "PB1")).toBe(true);

      const cleanText =
        "The probation period is strictly 3 months, after which confirmation is formal and automatic upon satisfactory performance.";
      const cleanFindings = analyze("probation", cleanText);
      expect(cleanFindings.some((f) => f.checkId === "PB1")).toBe(false);
    });

    it("Topic: ip_assignment - fires IP1 on all prior inventions assignment and stays silent on work-for-hire boundaries", () => {
      const positiveFindings = analyze("ip_assignment", sampleEmployeeClauses);
      expect(positiveFindings.some((f) => f.checkId === "IP1")).toBe(true);

      const cleanText =
        "The Company owns intellectual property created during employment hours directly related to company scope. Pre-existing inventions are excluded.";
      const cleanFindings = analyze("ip_assignment", cleanText);
      expect(cleanFindings.some((f) => f.checkId === "IP1")).toBe(false);
    });

    it("Topic: bonus_clawback - fires CB1 on joining bonus clawback and stays silent on unencumbered bonus", () => {
      const positiveFindings = analyze("bonus_clawback", sampleEmployeeClauses);
      expect(positiveFindings.some((f) => f.checkId === "CB1")).toBe(true);

      const cleanText =
        "The company provides an unconditional joining gift of INR 50,000 paid with the first month salary with no recovery bond.";
      const cleanFindings = analyze("bonus_clawback", cleanText);
      expect(cleanFindings.some((f) => f.checkId === "CB1")).toBe(false);
    });

    it("Topic: deductions - fires DED2/DED4/DED6 on arbitrary deduction clauses and stays silent on statutory deductions", () => {
      const positiveFindings = analyze("deductions", sampleEmployeeClauses);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("DED2");
      expect(checkIds).toContain("DED4");
      expect(checkIds).toContain("DED6");
      expect(checkIds).not.toContain("DED3"); // false-positive check: training bond wasn't matched in deduction section

      const cleanText =
        "All standard payroll deductions including Provident Fund and Income Tax (TDS) shall be deducted in compliance with Indian statutory laws.";
      const cleanFindings = analyze("deductions", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });
  });

  // CONSUMER DOMAIN
  describe("Consumer Domain Topics", () => {
    it("Topic: return_refund_policy - fires CON1/CON2 on non-refundable/tight deadline terms and stays silent on fair return policies", () => {
      const positiveFindings = analyze("return_refund_policy", sampleConsumer);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("CON1");
      expect(checkIds).toContain("CON2");

      const cleanText =
        "Customers may return items within 30 days for a full replacement or refund. You have 7 days to report any shipping damage.";
      const cleanFindings = analyze("return_refund_policy", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });

    it("Topic: warranty_defect_liability - fires CON3/CON4 on as-is disclaimers and missing grievance officer, stays silent when compliant", () => {
      const positiveFindings = analyze(
        "warranty_defect_liability",
        sampleConsumer
      );
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("CON3"); // pattern: as is without warranty
      expect(checkIds).toContain("CON4"); // missing: grievance officer

      const cleanText =
        "Products are covered by a 1-year manufacturer warranty against defects. For disputes, contact our designated Grievance Redressal Officer at grievance@store.in.";
      const cleanFindings = analyze("warranty_defect_liability", cleanText);
      expect(cleanFindings.some((f) => f.checkId === "CON3")).toBe(false);
      expect(cleanFindings.some((f) => f.checkId === "CON4")).toBe(false);
    });

    it("Topic: subscription_cancellation - fires CON5/CON6 on silent auto-renewal and missing cancellation procedure, stays silent on clear opt-out", () => {
      const positiveFindings = analyze(
        "subscription_cancellation",
        sampleConsumer
      );
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("CON5");
      expect(checkIds).toContain("CON6");

      const cleanText =
        "You can cancel at any time from your account dashboard with how to cancel instructions provided. Subscriptions will not renew without affirmative consent.";
      const cleanFindings = analyze("subscription_cancellation", cleanText);
      expect(cleanFindings.some((f) => f.checkId === "CON5")).toBe(false);
      expect(cleanFindings.some((f) => f.checkId === "CON6")).toBe(false);
    });

    it("Topic: unfair_contract_terms - fires CON7/CON8 on unilateral modifications and consumer court waivers, stays silent on mutual notice", () => {
      const positiveFindings = analyze("unfair_contract_terms", sampleConsumer);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("CON7");
      expect(checkIds).toContain("CON8");

      const cleanText =
        "Any change to terms requires 30 days prior written notice. Disputes shall be resolved before the competent civil courts and consumer forums in accordance with Indian consumer protection law.";
      const cleanFindings = analyze("unfair_contract_terms", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });
  });

  // FAMILY DOMAIN
  describe("Family Domain Topics", () => {
    it("Topic: family_settlement_deed - fires FAM1/FAM2/FAM3 on unconditional waivers and missing property schedule, stays silent on demarcated settlement", () => {
      const positiveFindings = analyze("family_settlement_deed", sampleFamily);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("FAM1"); // pattern: unconditionally gives up rights
      expect(checkIds).toContain("FAM2"); // pattern: sole discretion to modify
      expect(checkIds).toContain("FAM3"); // missing: schedule of property

      const cleanText = `
        Each party receives fair distribution of family holdings as mutually settled.
        Schedule of Property: Survey number 204, measuring about 3200 sq ft, bounded on North by Main Road.
        Neither party can amend without written consent of both parties.
      `;
      const cleanFindings = analyze("family_settlement_deed", cleanText);
      expect(cleanFindings.some((f) => f.checkId === "FAM1")).toBe(false);
      expect(cleanFindings.some((f) => f.checkId === "FAM2")).toBe(false);
      expect(cleanFindings.some((f) => f.checkId === "FAM3")).toBe(false);
    });

    it("Topic: partition_deed - fires FAM4/FAM5 on missing registration and witness attestations, stays silent when registered and witnessed", () => {
      const minimalPartition =
        "The parties mutually divide the joint family estate equally between co-parceners.";
      const positiveFindings = analyze("partition_deed", minimalPartition);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("FAM4");
      expect(checkIds).toContain("FAM5");

      const cleanText =
        "This partition deed is duly stamped and registered before the Sub-Registrar of Assurances, attested by witnesses: Witness 1 and Witness 2.";
      const cleanFindings = analyze("partition_deed", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });

    it("Topic: maintenance_agreement - fires FAM6/FAM7 on unilateral maintenance cessation and missing default terms, stays silent on robust agreement", () => {
      const positiveFindings = analyze("maintenance_agreement", sampleFamily);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("FAM6");
      expect(checkIds).toContain("FAM7");

      const cleanText =
        "Monthly maintenance of INR 35,000 shall be paid regularly. In the event of default in payment of monthly maintenance, interest at 10% per annum shall apply. Maintenance cannot be modified without family court order.";
      const cleanFindings = analyze("maintenance_agreement", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });

    it("Topic: gift_deed_terms - fires FAM8 on revocable gift covenants and stays silent on absolute irrevocable gift", () => {
      const positiveFindings = analyze("gift_deed_terms", sampleFamily);
      expect(positiveFindings.some((f) => f.checkId === "FAM8")).toBe(true);

      const cleanText =
        "The donor irrevocably gifts the residential property to the donee out of natural love and affection, with immediate transfer of title and possession.";
      const cleanFindings = analyze("gift_deed_terms", cleanText);
      expect(cleanFindings.some((f) => f.checkId === "FAM8")).toBe(false);
    });
  });

  // HOUSING DOMAIN
  describe("Housing Domain Topics", () => {
    it("Topic: security_deposit_terms - fires HOU1/HOU2 on deposit forfeiture and missing timeline, stays silent on guaranteed refund clauses", () => {
      const positiveFindings = analyze("security_deposit_terms", sampleHousing);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("HOU1");
      expect(checkIds).toContain("HOU2");

      const cleanText =
        "The landlord shall refund the security deposit within 7 days of vacating the premises after joint meter verification and deductions for genuine tenant damages.";
      const cleanFindings = analyze("security_deposit_terms", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });

    it("Topic: lockin_period_notice - fires HOU3/HOU4 on punitive unexpired lock-in rent and missing notice, stays silent on standard bilateral notice", () => {
      const positiveFindings = analyze("lockin_period_notice", sampleHousing);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("HOU3");
      expect(checkIds).toContain("HOU4");

      const cleanText =
        "Either party may terminate by giving 30 days written notice of termination after completion of initial 6 months. No penalty shall apply thereafter.";
      const cleanFindings = analyze("lockin_period_notice", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });

    it("Topic: maintenance_utilities - fires HOU5/HOU6 on structural repair burden and missing inventory, stays silent on landlord structural duty", () => {
      const positiveFindings = analyze("maintenance_utilities", sampleHousing);
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("HOU5");
      expect(checkIds).toContain("HOU6");

      const cleanText =
        "The landlord is responsible for all structural repairs and seepage. A joint inspection was conducted and meter readings at handover are attached in Annexure A.";
      const cleanFindings = analyze("maintenance_utilities", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });

    it("Topic: possession_delay_compensation - fires HOU7/HOU8 on delay immunity and missing RERA registration, stays silent on RERA compliant terms", () => {
      const positiveFindings = analyze(
        "possession_delay_compensation",
        sampleHousing
      );
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("HOU7");
      expect(checkIds).toContain("HOU8");

      const cleanText =
        "Project RERA Registration PR/KN/170824/000123. The promoter agrees to pay interest at SBI MCLR + 2% per annum for every month of delayed possession in accordance with RERA.";
      const cleanFindings = analyze("possession_delay_compensation", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });

    it("Topic: payment_plan_forfeiture - fires HOU9/HOU10 on excessive earnest money forfeiture and missing carpet area, stays silent on standard terms", () => {
      const positiveFindings = analyze(
        "payment_plan_forfeiture",
        sampleHousing
      );
      const checkIds = positiveFindings.map((f) => f.checkId);
      expect(checkIds).toContain("HOU9");
      expect(checkIds).toContain("HOU10");

      const cleanText =
        "The apartment has a RERA carpet area of 1180 square feet. In the event of cancellation, cancellation fee is limited to nominal processing fee.";
      const cleanFindings = analyze("payment_plan_forfeiture", cleanText);
      expect(cleanFindings).toHaveLength(0);
    });
  });
});
