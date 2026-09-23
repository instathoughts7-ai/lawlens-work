import React, { useState } from "react";
import { Finding, Domain, Topic } from "../types.ts";
import { generateDraftEmail, generateLawyerBrief } from "../utils/redaction.ts";
import { Mail, Briefcase, Copy, Check, ShieldCheck } from "lucide-react";

interface ExportViewProps {
  findings: Finding[];
  domain: Domain;
  topic: Topic;
}

export const ExportView: React.FC<ExportViewProps> = ({
  findings,
  domain,
  topic,
}) => {
  const [activeTab, setActiveTab] = useState<"email" | "brief">("email");
  const [redactDetails, setRedactDetails] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const questions = Array.from(
    new Set(findings.map((f) => f.questionToAsk).filter(Boolean))
  );

  const exportText =
    activeTab === "email"
      ? generateDraftEmail(
          domain.label,
          topic.label,
          findings,
          questions,
          redactDetails
        )
      : generateLawyerBrief(
          domain.label,
          topic.label,
          findings,
          domain.verify_pointers,
          redactDetails
        );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <section
      id="export-brief-email-section"
      aria-labelledby="export-heading"
      className="bg-slate-50 border border-slate-200 rounded-lg p-5 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h3
            id="export-heading"
            className="text-base font-bold text-slate-900 flex items-center gap-2"
          >
            <Mail className="w-5 h-5 text-indigo-600" aria-hidden="true" />
            Options & Next Steps: Export Drafts
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Prepare communication for the other party or export a brief for
            legal counsel.
          </p>
        </div>

        {/* Redaction Toggle - On by default */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-2xs">
          <input
            type="checkbox"
            id="redact-contact-details-toggle"
            checked={redactDetails}
            onChange={(e) => setRedactDetails(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <label
            htmlFor="redact-contact-details-toggle"
            className="text-xs font-semibold text-slate-800 cursor-pointer flex items-center gap-1 select-none"
          >
            <ShieldCheck
              className="w-3.5 h-3.5 text-emerald-600"
              aria-hidden="true"
            />
            Redact contact details
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-md">
          <button
            type="button"
            id="tab-draft-email"
            onClick={() => setActiveTab("email")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "email"
                ? "bg-white text-indigo-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            Draft Clarification Email
          </button>
          <button
            type="button"
            id="tab-lawyer-brief"
            onClick={() => setActiveTab("brief")}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "brief"
                ? "bg-white text-indigo-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
            Lawyer Consultation Brief
          </button>
        </div>

        <button
          type="button"
          id="copy-export-button"
          onClick={handleCopy}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check
                className="w-3.5 h-3.5 text-emerald-200"
                aria-hidden="true"
              />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy to Clipboard</span>
            </>
          )}
        </button>
      </div>

      {/* Output Content */}
      <div className="relative">
        <textarea
          id="export-output-text"
          readOnly
          rows={10}
          value={exportText}
          aria-label={
            activeTab === "email"
              ? "Draft Clarification Email"
              : "Lawyer Consultation Brief"
          }
          className="w-full p-3.5 bg-white border border-slate-300 rounded-md text-xs font-mono text-slate-800 leading-relaxed focus:outline-none select-all resize-y"
        />
        {redactDetails && (
          <div className="mt-1 text-[11px] text-emerald-700 font-medium flex items-center gap-1">
            <ShieldCheck
              className="w-3 h-3 text-emerald-600"
              aria-hidden="true"
            />
            Client-side redaction active: emails, phone numbers, and
            identification sequences are masked.
          </div>
        )}
      </div>
    </section>
  );
};
