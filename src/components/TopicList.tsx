import React from "react";
import { Section, Topic } from "../types.ts";
import { isTopicWiredUp } from "../engine/engine.ts";
import { ChevronRight, ArrowLeft, FileCheck2, Clock } from "lucide-react";

interface TopicListProps {
  section: Section;
  onSelectTopic: (topic: Topic) => void;
  onBack: () => void;
}

export const TopicList: React.FC<TopicListProps> = ({
  section,
  onSelectTopic,
  onBack,
}) => {
  return (
    <section
      id="topics-selection-level"
      aria-label="Select Topic"
      className="space-y-5"
    >
      {/* Back Control */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <button
            type="button"
            id="back-to-sections-button"
            onClick={onBack}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer mb-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Back to Sections
          </button>
          <h2 className="text-lg font-bold text-slate-900">{section.label}</h2>
          <p className="text-sm text-slate-600">
            Choose a topic to examine document language and pattern checks.
          </p>
        </div>
      </div>

      {/* Topics List */}
      <div className="grid grid-cols-1 gap-3">
        {section.topics.map((topic) => {
          const isWired = isTopicWiredUp(topic.id);

          return (
            <button
              key={topic.id}
              id={`topic-item-${topic.id}`}
              type="button"
              onClick={() => onSelectTopic(topic)}
              className={`p-4 bg-white border rounded-lg text-left transition-all flex items-center justify-between cursor-pointer group ${
                isWired
                  ? "border-indigo-200 hover:border-indigo-400 hover:shadow-xs ring-1 ring-indigo-50/50"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                    isWired
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isWired ? (
                    <FileCheck2 className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Clock className="w-4 h-4" aria-hidden="true" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {topic.label}
                    </span>
                    {isWired ? (
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                        Wired
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Not wired up yet
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    {topic.id === "notice_length" &&
                      "Check for notice period asymmetry (NP1)"}
                    {topic.id === "rto_location" &&
                      "Compare two documents for work location conflict (RTO1)"}
                    {!isWired && `Checks defined: ${topic.checks.join(", ")}`}
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
