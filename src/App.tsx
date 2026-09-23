import { useState } from "react";
import scenariosDataRaw from "./data/scenarios.json";
import { Domain, Section, Topic, NavLevel, ScenariosConfig } from "./types.ts";
import { DomainList } from "./components/DomainList.tsx";
import { SectionList } from "./components/SectionList.tsx";
import { TopicList } from "./components/TopicList.tsx";
import { AnalysisView } from "./components/AnalysisView.tsx";
import { Scale, ChevronRight } from "lucide-react";

const scenariosData = scenariosDataRaw as ScenariosConfig;

const isDomainActive = (domain: Domain): boolean =>
  Boolean(
    domain.sections &&
    domain.sections.length > 0 &&
    domain.sections.some((s) => s.topics && s.topics.length > 0)
  );

export default function App() {
  const [viewLevel, setViewLevel] = useState<NavLevel>("domains");
  const [selectedDomain, setSelectedDomain] = useState<Domain>(
    scenariosData.domains[0]
  );
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Navigation handlers
  const handleSelectDomain = (domain: Domain) => {
    if (!isDomainActive(domain)) return;
    setSelectedDomain(domain);
    setSelectedSection(null);
    setSelectedTopic(null);
    setViewLevel("sections");
  };

  const handleSelectSection = (section: Section) => {
    setSelectedSection(section);
    setSelectedTopic(null);
    setViewLevel("topics");
  };

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setViewLevel("analysis");
  };

  const handleBackToDomains = () => {
    setSelectedSection(null);
    setSelectedTopic(null);
    setViewLevel("domains");
  };

  const handleBackToSections = () => {
    setSelectedTopic(null);
    setViewLevel("sections");
  };

  const handleBackToTopics = () => {
    setViewLevel("topics");
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Primary Header landmark with single h1 */}
      <header
        role="banner"
        className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToDomains}
              aria-label="LawLens Work Home"
              className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <Scale className="w-5 h-5" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                LawLens Work
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Helps people in India read their own legal documents • Info
                only, never legal advice
              </p>
            </div>
          </div>

          {/* Quick Domain Tab Switcher */}
          <nav
            aria-label="Domain quick tabs"
            className="flex items-center gap-1 overflow-x-auto py-1"
          >
            {scenariosData.domains.map((dom) => {
              const isActiveDomain = selectedDomain.id === dom.id;
              const isDomActive = isDomainActive(dom);
              const isDisabled = !isDomActive;

              return (
                <button
                  key={dom.id}
                  id={`domain-tab-${dom.id}`}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleSelectDomain(dom)}
                  aria-disabled={isDisabled}
                  className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isActiveDomain && !isDisabled
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold"
                      : isDisabled
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent"
                        : "text-slate-600 hover:bg-slate-100 cursor-pointer border border-transparent"
                  }`}
                >
                  <span>{dom.label}</span>
                  {isDisabled && (
                    <span className="text-[10px] font-normal text-slate-400">
                      (soon)
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Breadcrumb Navigation trail */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-2">
          <nav
            aria-label="Breadcrumb"
            className="max-w-4xl mx-auto flex items-center gap-1.5 text-xs text-slate-600 overflow-x-auto whitespace-nowrap"
          >
            <button
              type="button"
              onClick={handleBackToDomains}
              className={`hover:text-indigo-600 font-medium ${
                viewLevel === "domains"
                  ? "text-indigo-600 font-bold"
                  : "cursor-pointer"
              }`}
            >
              Domains
            </button>

            {viewLevel !== "domains" && (
              <>
                <ChevronRight
                  className="w-3.5 h-3.5 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={handleBackToSections}
                  className={`hover:text-indigo-600 font-medium ${
                    viewLevel === "sections"
                      ? "text-indigo-600 font-bold"
                      : "cursor-pointer"
                  }`}
                >
                  {selectedDomain.label}
                </button>
              </>
            )}

            {(viewLevel === "topics" || viewLevel === "analysis") &&
              selectedSection && (
                <>
                  <ChevronRight
                    className="w-3.5 h-3.5 text-slate-400 shrink-0"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={handleBackToTopics}
                    className={`hover:text-indigo-600 font-medium ${
                      viewLevel === "topics"
                        ? "text-indigo-600 font-bold"
                        : "cursor-pointer"
                    }`}
                  >
                    {selectedSection.label}
                  </button>
                </>
              )}

            {viewLevel === "analysis" && selectedTopic && (
              <>
                <ChevronRight
                  className="w-3.5 h-3.5 text-slate-400 shrink-0"
                  aria-hidden="true"
                />
                <span className="text-indigo-600 font-bold" aria-current="page">
                  {selectedTopic.label}
                </span>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Landmark: Strictly ONE level visible at a time */}
      <main
        id="main-content"
        role="main"
        className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6"
      >
        {/* LEVEL 1: Domain tabs / cards */}
        {viewLevel === "domains" && (
          <DomainList
            domains={scenariosData.domains}
            onSelectDomain={handleSelectDomain}
          />
        )}

        {/* LEVEL 2: Sections list */}
        {viewLevel === "sections" && (
          <SectionList
            domain={selectedDomain}
            onSelectSection={handleSelectSection}
            onBack={handleBackToDomains}
          />
        )}

        {/* LEVEL 3: Topics list inside open section */}
        {viewLevel === "topics" && selectedSection && (
          <TopicList
            section={selectedSection}
            onSelectTopic={handleSelectTopic}
            onBack={handleBackToSections}
          />
        )}

        {/* LEVEL 4: Topic analysis screen */}
        {viewLevel === "analysis" && selectedTopic && (
          <AnalysisView
            topic={selectedTopic}
            domain={selectedDomain}
            onBack={handleBackToTopics}
          />
        )}
      </main>

      {/* Footer Landmark */}
      <footer
        role="contentinfo"
        className="bg-white border-t border-slate-200 py-6 mt-12 text-xs text-slate-500"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-700">LawLens Work</span> —
            Educational Legal Analysis for Indian Employment Contracts.
          </div>
          <div className="text-slate-400">
            Client-side only analysis • Strictly no legal advice
          </div>
        </div>
      </footer>
    </div>
  );
}
