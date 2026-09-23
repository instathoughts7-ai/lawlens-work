import { describe, it, expect } from "vitest";
import "./setup.ts";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import React from "react";
import scenariosDataRaw from "../data/scenarios.json";
import { ScenariosConfig } from "../types.ts";
import { DomainList } from "../components/DomainList.tsx";
import { SectionList } from "../components/SectionList.tsx";
import { TopicList } from "../components/TopicList.tsx";
import { AnalysisView } from "../components/AnalysisView.tsx";
import { ExportView } from "../components/ExportView.tsx";

const scenariosData = scenariosDataRaw as ScenariosConfig;

describe("Accessibility Audit (vitest-axe) across all 4 screen levels", () => {
  const sampleDomain = scenariosData.domains[0]; // Employee
  const sampleSection = sampleDomain.sections![0]; // Leaving your job
  const sampleTopic = sampleSection.topics[0]; // Notice period

  // Level 1: DomainList
  it("DomainList screen level has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <DomainList domains={scenariosData.domains} onSelectDomain={() => {}} />
      </main>
    );
    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });

  // Level 2: SectionList
  it("SectionList screen level has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <SectionList
          domain={sampleDomain}
          onSelectSection={() => {}}
          onBack={() => {}}
        />
      </main>
    );
    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });

  // Level 3: TopicList
  it("TopicList screen level has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <TopicList
          section={sampleSection}
          onSelectTopic={() => {}}
          onBack={() => {}}
        />
      </main>
    );
    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });

  // Level 4: AnalysisView
  it("AnalysisView screen level has no accessibility violations", async () => {
    const { container } = render(
      <main>
        <AnalysisView
          domain={sampleDomain}
          topic={sampleTopic}
          onBack={() => {}}
        />
      </main>
    );
    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });

  // ExportView Level
  it("ExportView has no accessibility violations", async () => {
    const mockFindings = [
      {
        checkId: "NP1",
        title: "Asymmetric Notice Period",
        type: "asymmetric_notice",
        severity: "high" as const,
        plainSummary: "Notice is 90 days for employee vs 30 days for employer.",
        exactQuote: "Notice: 90 days.",
        whyItMatters: "Unbalanced notice period burdens employees.",
        questionToAsk: "Can notice be made reciprocal?",
      },
    ];

    const { container } = render(
      <main>
        <ExportView
          findings={mockFindings}
          domain={sampleDomain}
          topic={sampleTopic}
        />
      </main>
    );
    const results = await axe(container);
    (expect(results) as any).toHaveNoViolations();
  });
});
