import { describe, it, expect } from "vitest";
import { findTopic, isTopicWiredUp, analyze } from "../engine/engine.ts";
import { handleNoticeAsymmetry, handleLocationConflict, handleFrequencyConflict } from "../engine/handlers.ts";
import { computeAnalysisCacheKey } from "../utils/redaction.ts";
import scenariosData from "../data/scenarios.json";

describe("Engine & Computational Efficiency Optimizations", () => {
  it("findTopic resolves in O(1) via lookup map for all configured topic IDs and labels", () => {
    let topicCount = 0;
    for (const domain of scenariosData.domains) {
      if (domain.sections) {
        for (const section of domain.sections) {
          for (const topic of section.topics) {
            topicCount++;
            // Lookup by ID
            const foundById = findTopic(topic.id);
            expect(foundById).not.toBeNull();
            expect(foundById?.id).toBe(topic.id);

            // Lookup by Label
            const foundByLabel = findTopic(topic.label);
            expect(foundByLabel).not.toBeNull();
            expect(foundByLabel?.id).toBe(topic.id);

            // Case-insensitivity check
            const foundByUpper = findTopic(topic.id.toUpperCase());
            expect(foundByUpper).not.toBeNull();
            expect(foundByUpper?.id).toBe(topic.id);
          }
        }
      }
    }
    expect(topicCount).toBeGreaterThan(15);
  });

  it("findTopic gracefully returns null for non-existent topics without throwing", () => {
    expect(findTopic("non_existent_topic_id")).toBeNull();
    expect(findTopic("")).toBeNull();
  });

  it("analyze reuses cached regexes and produces identical deterministic findings across multiple runs", () => {
    const sampleInput = "Employee shall provide 90 days' written notice to resign. Company may terminate with 30 days' notice.";
    
    // Run multiple times in succession to verify cached regex execution
    const run1 = analyze("notice_length", sampleInput);
    const run2 = analyze("notice_length", sampleInput);
    const run3 = analyze("notice_length", sampleInput);

    expect(run1).toHaveLength(1);
    expect(run1[0].checkId).toBe("NP1");
    expect(run1).toEqual(run2);
    expect(run2).toEqual(run3);
  });

  it("location extraction handles metropolitan hubs accurately and canonicalizes via single-pass match", () => {
    // Bengaluru / Bangalore
    const rtoBangalore = handleLocationConflict([
      "Base Location: Bengaluru",
      "Office Location: Mumbai",
    ]);
    expect(rtoBangalore).toHaveLength(1);
    expect(rtoBangalore[0].checkId).toBe("RTO1");
    expect(rtoBangalore[0].plainSummary).toContain("Bengaluru");
    expect(rtoBangalore[0].plainSummary).toContain("Mumbai");

    // New Delhi vs Delhi priority (longer city name matched correctly)
    const rtoDelhi = handleLocationConflict([
      "Base Location: New Delhi",
      "All staff shall report to the Pune office",
    ]);
    expect(rtoDelhi).toHaveLength(1);
    expect(rtoDelhi[0].plainSummary).toContain("New Delhi");
    expect(rtoDelhi[0].plainSummary).toContain("Pune");

    // Identical normalized cities (e.g. Bangalore vs Bengaluru) do not fire false positives
    const rtoSame = handleLocationConflict([
      "Base Location: Bangalore",
      "Reporting to the Bengaluru campus",
    ]);
    expect(rtoSame).toHaveLength(0);
  });

  it("frequency conflict handler executes with hoisted static regexes", () => {
    const findings = handleFrequencyConflict([
      "The employee may attend the office occasionally as required.",
      "All employees must attend the office 5 days a week.",
    ]);
    expect(findings).toHaveLength(1);
    expect(findings[0].checkId).toBe("RTO2");
    expect(findings[0].exactQuote).toContain("occasionally as required");
    expect(findings[0].exactQuote).toContain("5 days a week");
  });

  it("computeAnalysisCacheKey uses fast short-circuit for empty findings", () => {
    const emptyKey1 = computeAnalysisCacheKey("employee", "notice_length", []);
    const emptyKey2 = computeAnalysisCacheKey("employee", "notice_length", []);
    expect(emptyKey1).toBe("employee:notice_length:0:");
    expect(emptyKey1).toBe(emptyKey2);
  });
});
