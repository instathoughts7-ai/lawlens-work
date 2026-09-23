import React from "react";
import { Finding, Domain } from "../types.ts";
import {
  AlertTriangle,
  HelpCircle,
  CheckCircle2,
  ShieldCheck,
  Quote,
} from "lucide-react";

interface FindingsListProps {
  findings: Finding[];
  domain: Domain;
}

export const FindingsList: React.FC<FindingsListProps> = ({
  findings,
  domain,
}) => {
  // Deduped "Questions to ask" list
  const dedupedQuestions = Array.from(
    new Set(findings.map((f) => f.questionToAsk).filter(Boolean))
  );

  return (
    <div
      id="analysis-findings-container"
      className="space-y-8 mt-8 border-t border-slate-200 pt-8"
    >
      {findings.length === 0 ? (
        <div
          id="no-issues-found"
          role="status"
          className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-start gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-emerald-950 text-base">
              No specific risk patterns detected
            </h3>
            <p className="text-sm text-emerald-800 mt-1 leading-relaxed">
              Based on the provided text, no asymmetric notice periods or
              workplace location conflicts were identified. Always review the
              verification pointers below to cross-check key contract terms.
            </p>
          </div>
        </div>
      ) : (
        /* Findings sorted by severity (high -> low) */
        <section
          id="findings-section"
          aria-labelledby="findings-heading"
          className="space-y-6"
        >
          <div className="flex items-center justify-between">
            <h3
              id="findings-heading"
              className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-2"
            >
              <AlertTriangle
                className="w-5 h-5 text-red-600"
                aria-hidden="true"
              />
              Findings ({findings.length})
            </h3>
            <span className="text-xs font-medium text-slate-500">
              Ordered by severity
            </span>
          </div>

          <div className="space-y-5">
            {findings.map((finding, idx) => (
              <article
                key={`${finding.checkId}-${idx}`}
                id={`finding-${finding.checkId}`}
                className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
              >
                {/* Header with Severity Badge and Title */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        finding.severity === "high"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : finding.severity === "medium"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-800 border border-slate-200"
                      }`}
                    >
                      {finding.severity} severity
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-400">
                      Check {finding.checkId}
                    </span>
                  </div>
                  <h4 className="text-base font-semibold text-slate-900 w-full sm:w-auto">
                    {finding.title}
                  </h4>
                </div>

                {/* Exact Verbatim Quote */}
                {finding.exactQuote && (
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Quote className="w-3.5 h-3.5" aria-hidden="true" />
                      Verbatim excerpt from document
                    </span>
                    <blockquote
                      id={`quote-${finding.checkId}`}
                      className="border-l-3 border-indigo-500 pl-3.5 py-1.5 bg-slate-50 text-slate-700 italic text-sm rounded-r leading-relaxed font-serif"
                    >
                      "{finding.exactQuote}"
                    </blockquote>
                  </div>
                )}

                {/* Plain Summary */}
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Summary
                  </span>
                  <p className="text-sm font-medium text-slate-900 leading-relaxed">
                    {finding.plainSummary}
                  </p>
                </div>

                {/* Why It Matters */}
                <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-md space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Why this matters in India
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {finding.whyItMatters}
                  </p>
                </div>

                {/* Question to Ask */}
                <div className="bg-indigo-50/60 border border-indigo-100 p-3.5 rounded-md flex items-start gap-2.5">
                  <HelpCircle
                    className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                      Recommended Question to Ask
                    </span>
                    <p className="text-sm text-indigo-950 font-medium leading-relaxed">
                      {finding.questionToAsk}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Deduped "Questions to ask" list */}
      {dedupedQuestions.length > 0 && (
        <section
          id="questions-to-ask-section"
          aria-labelledby="questions-to-ask-heading"
          className="bg-indigo-50/80 border border-indigo-200 rounded-lg p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <HelpCircle
              className="w-5 h-5 text-indigo-700"
              aria-hidden="true"
            />
            <h3
              id="questions-to-ask-heading"
              className="text-base font-bold text-indigo-950"
            >
              {domain.id === "employee"
                ? "Questions to ask your employer / HR"
                : domain.id === "housing"
                  ? "Questions to ask the landlord / broker"
                  : domain.id === "consumer"
                    ? "Questions to ask the seller / service provider"
                    : "Questions to ask the other party / family members"}
            </h3>
          </div>
          <p className="text-xs text-indigo-800">
            Use these specific, calm questions during negotiations or
            clarification emails:
          </p>
          <ul className="space-y-2.5 pt-1">
            {dedupedQuestions.map((question, i) => (
              <li
                key={i}
                id={`question-item-${i}`}
                className="text-sm text-indigo-950 flex items-start gap-2.5 bg-white/70 border border-indigo-100 p-3 rounded"
              >
                <span className="font-bold text-indigo-600 select-none">•</span>
                <span className="font-medium leading-relaxed">{question}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Domain verify_pointers under "What to verify" (separate, once) */}
      {domain.verify_pointers && domain.verify_pointers.length > 0 && (
        <section
          id="what-to-verify-section"
          aria-labelledby="what-to-verify-heading"
          className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck
              className="w-5 h-5 text-slate-700"
              aria-hidden="true"
            />
            <h3
              id="what-to-verify-heading"
              className="text-sm font-bold uppercase tracking-wider text-slate-800"
            >
              What to verify ({domain.label} Checklist)
            </h3>
          </div>
          <p className="text-xs text-slate-600">
            General verification safeguards applicable to Indian{" "}
            {domain.label.toLowerCase()} documents:
          </p>
          <ul className="space-y-2 pt-1">
            {domain.verify_pointers.map((pointer, i) => (
              <li
                key={i}
                id={`verify-pointer-${i}`}
                className="text-sm text-slate-700 flex items-start gap-2.5 leading-relaxed"
              >
                <CheckCircle2
                  className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{pointer}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
