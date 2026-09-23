import React, { useState, useEffect } from "react";
import { Topic, Domain, Finding } from "../types.ts";
import { analyze, isTopicWiredUp } from "../engine/engine.ts";
import { DisclaimerBanner } from "./DisclaimerBanner.tsx";
import { FindingsList } from "./FindingsList.tsx";
import { ExportView } from "./ExportView.tsx";
import {
  SAMPLE_NOTICE_PERIOD,
  SAMPLE_RTO_DOC_A,
  SAMPLE_RTO_DOC_B,
  SAMPLE_EARLY_RELEASE,
  SAMPLE_BASIC_RIGHTS_OFFER,
  SAMPLE_RTO_SCHEDULE_DOC_A,
  SAMPLE_RTO_SCHEDULE_DOC_B,
  SAMPLE_PAYSLIP_ANNEXURE,
  SAMPLE_PAYSLIP_DOC,
  SAMPLE_LEAVE_DOC_A,
  SAMPLE_LEAVE_DOC_B,
} from "../data/samples.ts";
import {
  Sparkles,
  Trash2,
  ArrowRight,
  Info,
  FileText,
  ShieldAlert,
  AlertTriangle,
} from "lucide-react";

interface AnalysisViewProps {
  topic: Topic;
  domain: Domain;
  onBack: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  topic,
  domain,
}) => {
  const isWired = isTopicWiredUp(topic.id);
  const isTwoDoc =
    topic.id === "rto_location" ||
    topic.id === "rto_schedule" ||
    topic.id === "payslip_check" ||
    topic.id === "leave_entitlement";

  const MAX_INPUT_CHARS = 20000;

  const privacyNote = topic.privacy_note || domain.privacy_note;
  const safetyNote = topic.safety_note || domain.safety_note;

  const [inputA, setInputA] = useState("");
  const [inputB, setInputB] = useState("");
  const [results, setResults] = useState<Finding[] | null>(null);

  // Reset inputs when topic changes
  useEffect(() => {
    setInputA("");
    setInputB("");
    setResults(null);
  }, [topic.id]);

  const handleRunAnalysis = () => {
    if (!isWired) return;
    if (
      inputA.length > MAX_INPUT_CHARS ||
      (isTwoDoc && inputB.length > MAX_INPUT_CHARS)
    )
      return;
    const inputs = isTwoDoc ? [inputA, inputB] : [inputA];
    const findings = analyze(topic.id, inputs);
    setResults(findings);
  };

  const handleClear = () => {
    setInputA("");
    setInputB("");
    setResults(null);
  };

  const handleLoadSample = () => {
    if (topic.id === "notice_length") {
      setInputA(SAMPLE_NOTICE_PERIOD);
      setResults(null);
    } else if (topic.id === "rto_location") {
      setInputA(SAMPLE_RTO_DOC_A);
      setInputB(SAMPLE_RTO_DOC_B);
      setResults(null);
    } else if (topic.id === "rto_schedule") {
      setInputA(SAMPLE_RTO_SCHEDULE_DOC_A);
      setInputB(SAMPLE_RTO_SCHEDULE_DOC_B);
      setResults(null);
    } else if (topic.id === "payslip_check") {
      setInputA(SAMPLE_PAYSLIP_ANNEXURE);
      setInputB(SAMPLE_PAYSLIP_DOC);
      setResults(null);
    } else if (topic.id === "leave_entitlement") {
      setInputA(SAMPLE_LEAVE_DOC_A);
      setInputB(SAMPLE_LEAVE_DOC_B);
      setResults(null);
    } else if (topic.id === "early_release") {
      setInputA(SAMPLE_EARLY_RELEASE);
      setResults(null);
    } else if (topic.id === "standard_clauses") {
      setInputA(SAMPLE_BASIC_RIGHTS_OFFER);
      setResults(null);
    }
  };

  const getSampleButtonLabel = () => {
    if (topic.id === "notice_length")
      return "Load sample notice clause (90 vs 30 days)";
    if (topic.id === "rto_location")
      return "Load sample documents (Bengaluru vs Mumbai)";
    if (topic.id === "rto_schedule")
      return "Load sample schedule (Flexible vs 5 days/week)";
    if (topic.id === "payslip_check") return "Load sample payslip & annexure";
    if (topic.id === "leave_entitlement")
      return "Load sample leave terms (24 vs 18 days)";
    if (topic.id === "early_release")
      return "Load sample buyout clause (ER1, ER3, ER4)";
    if (topic.id === "standard_clauses")
      return "Load sample offer letter (missing clauses)";
    return "Load sample text";
  };

  const getDocALabel = () => {
    if (topic.id === "rto_location")
      return "Document A (Original Letter / Offer)";
    if (topic.id === "rto_schedule")
      return "Document A (Original Policy / Agreement)";
    if (topic.id === "payslip_check")
      return "Document A (Compensation Annexure)";
    if (topic.id === "leave_entitlement")
      return "Document A (Employment Offer / Letter)";
    return "Paste Document Clause or Section";
  };

  const getDocBLabel = () => {
    if (topic.id === "rto_location")
      return "Document B (New Directive / Return-to-Office Notice)";
    if (topic.id === "rto_schedule")
      return "Document B (New RTO Directive / Mandate)";
    if (topic.id === "payslip_check") return "Document B (Monthly Payslip)";
    if (topic.id === "leave_entitlement")
      return "Document B (Company Leave Policy)";
    return "Document B (Comparison Document)";
  };

  const getDocAPlaceholder = () => {
    if (topic.id === "rto_location")
      return "Paste original offer letter or contract text showing base location (e.g. 'Base Location: Bengaluru')...";
    if (topic.id === "rto_schedule")
      return "Paste original agreement or remote policy wording (e.g. 'attend the office occasionally as required')...";
    if (topic.id === "payslip_check")
      return "Paste compensation annexure with agreed components and allowances...";
    if (topic.id === "leave_entitlement")
      return "Paste appointment letter showing total leave days (e.g. '24 days of paid leave')...";
    if (domain.id === "consumer")
      return "Paste seller terms, refund policy clause, warranty statement, or cancellation terms...";
    if (domain.id === "family")
      return "Paste family deed clause, settlement agreement terms, or maintenance provision...";
    if (domain.id === "housing")
      return "Paste lease agreement clause, security deposit section, or builder contract clause...";
    return "Paste the document clause or section...";
  };

  const getDocBPlaceholder = () => {
    if (topic.id === "rto_location")
      return "Paste the new directive or relocation notice text (e.g. 'Base Location: Mumbai')...";
    if (topic.id === "rto_schedule")
      return "Paste the return-to-office directive mandating days (e.g. '5 days a week')...";
    if (topic.id === "payslip_check")
      return "Paste monthly payslip text with Gross Salary, itemized Deductions, and Net Pay...";
    if (topic.id === "leave_entitlement")
      return "Paste leave policy breakdown (e.g. 'Casual leave: 12 days', 'Sick leave: 6 days')...";
    return "Paste the second document for comparison...";
  };

  return (
    <div id="topic-analysis-screen" className="space-y-6">
      {/* 1. Disclaimer Line at top */}
      <DisclaimerBanner id="analysis-top-disclaimer" />

      {/* Topic Title & Context */}
      <div className="border-b border-slate-200 pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
          Document Review Topic
        </span>
        <h2 className="text-xl font-bold text-slate-900 mt-0.5">
          {topic.label}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {topic.id === "notice_length" &&
            "Analyze resignation and termination notice periods for asymmetry and mutual fairness."}
          {topic.id === "rto_location" &&
            "Compare your original employment letter against a new return-to-office directive to detect location conflicts."}
          {topic.id === "rto_schedule" &&
            "Compare contractual working flexibility against mandatory return-to-office day quotas."}
          {topic.id === "payslip_check" &&
            "Verify payslip deductions against compensation annexure and check gross-to-net pay arithmetic."}
          {topic.id === "leave_entitlement" &&
            "Cross-verify total annual paid leave entitlement against company leave handbook policies."}
          {topic.id === "early_release" &&
            "Review buyout recovery terms, sole discretion conditions, and relieving documentation clauses."}
          {topic.id === "standard_clauses" &&
            "Verify presence of essential employee protection clauses in appointment and offer letters."}
          {topic.id !== "notice_length" &&
            topic.id !== "rto_location" &&
            topic.id !== "rto_schedule" &&
            topic.id !== "payslip_check" &&
            topic.id !== "leave_entitlement" &&
            topic.id !== "early_release" &&
            topic.id !== "standard_clauses" &&
            (isWired
              ? `Review your ${domain.label.toLowerCase()} document clauses against Indian statutory standards and regulatory safeguards.`
              : "Specialized calculation handlers for this topic will be available in a future release.")}
        </p>
      </div>

      {/* If topic is NOT wired up */}
      {!isWired ? (
        <div
          id="topic-not-wired-banner"
          role="status"
          className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-3"
        >
          <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
            <Info className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-base">
              Topic Not Wired Up Yet
            </h3>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              "{topic.label}" is currently configured as a future check module.
              Advanced checks for this topic will be available in an upcoming
              release.
            </p>
          </div>
        </div>
      ) : (
        /* Wired Up Topic Input Screen */
        <section
          id="analysis-input-section"
          className="space-y-5"
          aria-label="Document Input"
        >
          {/* Privacy Note / Notice */}
          {privacyNote && (
            <div
              id="topic-privacy-note"
              role="note"
              className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-amber-900"
            >
              <ShieldAlert
                className="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-bold uppercase tracking-wider text-amber-950 block">
                  Privacy Notice
                </span>
                <p className="leading-relaxed font-medium">{privacyNote}</p>
              </div>
            </div>
          )}

          {/* Safety Note / Notice */}
          {safetyNote && (
            <div
              id="topic-safety-note"
              role="note"
              className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-900"
            >
              <AlertTriangle
                className="w-4 h-4 text-rose-600 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="text-xs space-y-0.5">
                <span className="font-bold uppercase tracking-wider text-rose-950 block">
                  Important Safety Notice
                </span>
                <p className="leading-relaxed font-medium">{safetyNote}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={isTwoDoc ? "document-a-input" : "document-single-input"}
              className="text-sm font-bold text-slate-800 flex items-center gap-1.5"
            >
              <FileText
                className="w-4 h-4 text-indigo-600"
                aria-hidden="true"
              />
              {getDocALabel()}
            </label>

            {/* Quick Sample Button */}
            {(topic.id === "notice_length" ||
              topic.id === "rto_location" ||
              topic.id === "rto_schedule" ||
              topic.id === "payslip_check" ||
              topic.id === "leave_entitlement" ||
              topic.id === "early_release" ||
              topic.id === "standard_clauses") && (
              <button
                type="button"
                id="load-sample-button"
                onClick={handleLoadSample}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer py-1 px-2 rounded hover:bg-indigo-50 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                {getSampleButtonLabel()}
              </button>
            )}
          </div>

          {/* Primary Textarea */}
          <div className="space-y-1">
            <textarea
              id={isTwoDoc ? "document-a-input" : "document-single-input"}
              rows={4}
              maxLength={MAX_INPUT_CHARS}
              value={inputA}
              onChange={(e) => setInputA(e.target.value)}
              placeholder={getDocAPlaceholder()}
              aria-describedby="doc-a-char-count"
              className="w-full p-3.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-white resize-y"
            />
            <div className="flex justify-end">
              <span
                id="doc-a-char-count"
                className={`text-[11px] font-mono ${
                  inputA.length >= MAX_INPUT_CHARS
                    ? "text-rose-600 font-bold"
                    : "text-slate-500"
                }`}
              >
                {inputA.length.toLocaleString()} / 20,000 characters
              </span>
            </div>
          </div>

          {/* Secondary Textarea for Two-Input Compare */}
          {isTwoDoc && (
            <div className="space-y-2">
              <label
                htmlFor="document-b-input"
                className="text-sm font-bold text-slate-800 flex items-center gap-1.5"
              >
                <FileText
                  className="w-4 h-4 text-indigo-600"
                  aria-hidden="true"
                />
                {getDocBLabel()}
              </label>
              <textarea
                id="document-b-input"
                rows={4}
                maxLength={MAX_INPUT_CHARS}
                value={inputB}
                onChange={(e) => setInputB(e.target.value)}
                placeholder={getDocBPlaceholder()}
                aria-describedby="doc-b-char-count"
                className="w-full p-3.5 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono bg-white resize-y"
              />
              <div className="flex justify-end">
                <span
                  id="doc-b-char-count"
                  className={`text-[11px] font-mono ${
                    inputB.length >= MAX_INPUT_CHARS
                      ? "text-rose-600 font-bold"
                      : "text-slate-500"
                  }`}
                >
                  {inputB.length.toLocaleString()} / 20,000 characters
                </span>
              </div>
            </div>
          )}

          {/* Actions: Run Analysis and Clear */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              id="analyze-document-button"
              onClick={handleRunAnalysis}
              disabled={
                isTwoDoc ? !inputA.trim() || !inputB.trim() : !inputA.trim()
              }
              className="flex-1 sm:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
            >
              <span>Analyze Document</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>

            {(inputA || inputB || results) && (
              <button
                type="button"
                id="clear-inputs-button"
                onClick={handleClear}
                className="px-4 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
              >
                <Trash2 className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Results Display */}
          {results && (
            <div className="space-y-8">
              <FindingsList findings={results} domain={domain} />
              <ExportView findings={results} domain={domain} topic={topic} />
            </div>
          )}
        </section>
      )}
    </div>
  );
};
