import React from "react";
import { Domain, Section } from "../types.ts";
import { isTopicWiredUp } from "../engine/engine.ts";
import { ChevronRight, FolderOpen, ArrowLeft, CheckCircle } from "lucide-react";

interface SectionListProps {
  domain: Domain;
  onSelectSection: (section: Section) => void;
  onBack: () => void;
}

export const SectionList: React.FC<SectionListProps> = ({
  domain,
  onSelectSection,
  onBack,
}) => {
  return (
    <section
      id="sections-selection-level"
      aria-label="Select Document Section"
      className="space-y-5"
    >
      {/* Back Control */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <button
            type="button"
            id="back-to-domains-button"
            onClick={onBack}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer mb-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none rounded px-1 -mx-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Domains
          </button>
          <h2 className="text-lg font-bold text-slate-900">
            {domain.label} Sections
          </h2>
          <p className="text-sm text-slate-600">
            Select a contract section to inspect specific clauses.
          </p>
        </div>
      </div>

      {/* Sections List */}
      <div className="grid grid-cols-1 gap-3">
        {domain.sections.map((section) => {
          const hasWiredTopic = section.topics.some((t) =>
            isTopicWiredUp(t.id)
          );

          return (
            <button
              key={section.id}
              id={`section-item-${section.id}`}
              type="button"
              onClick={() => onSelectSection(section)}
              className="p-4 bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-xs rounded-lg text-left transition-all flex items-center justify-between cursor-pointer group focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                  <FolderOpen className="w-4 h-4" aria-hidden="true" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {section.label}
                    </span>
                    {hasWiredTopic && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        Analysis Ready
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {section.topics.length}{" "}
                    {section.topics.length === 1 ? "topic" : "topics"}:{" "}
                    {section.topics.map((t) => t.label).join(", ")}
                  </span>
                </div>
              </div>

              <div className="text-slate-400 group-hover:text-indigo-600 transition-colors pl-2 shrink-0">
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
