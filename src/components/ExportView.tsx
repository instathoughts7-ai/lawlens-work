import React, { useState, useRef, useEffect } from "react";
import { Finding, Domain, Topic, NegotiationMemo } from "../types.ts";
import {
  generateDraftEmail,
  generateLawyerBrief,
  prepareRedactedFindingsForMemo,
  computeAnalysisCacheKey,
} from "../utils/redaction.ts";
import {
  Mail,
  Briefcase,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCw,
  FileSpreadsheet,
} from "lucide-react";

interface ExportViewProps {
  findings: Finding[];
  domain: Domain;
  topic: Topic;
}

export const ExportView = React.memo<ExportViewProps>(({
  findings,
  domain,
  topic,
}) => {
  const [activeTab, setActiveTab] = useState<"email" | "brief" | "memo">("email");
  const [redactDetails, setRedactDetails] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [emailCopied, setEmailCopied] = useState<boolean>(false);

  // Negotiation Memo State & Cache
  const [memoCache, setMemoCache] = useState<Record<string, NegotiationMemo>>({});
  const [memoLoading, setMemoLoading] = useState<boolean>(false);
  const [memoError, setMemoError] = useState<string | null>(null);

  // Efficiency & Concurrency protection refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const questions = React.useMemo(
    () => Array.from(new Set(findings.map((f) => f.questionToAsk).filter(Boolean))),
    [findings]
  );

  // Deterministic, collision-free cache key for current findings state
  const currentCacheKey = React.useMemo(
    () => computeAnalysisCacheKey(domain.id, topic.id, findings),
    [domain.id, topic.id, findings]
  );
  const currentMemo = memoCache[currentCacheKey];

  const formatMemoAsText = (memo: NegotiationMemo): string => {
    let text = `NEGOTIATION MEMORANDUM & STRATEGY\n`;
    text += `Matter: ${domain.label} - ${topic.label}\n`;
    text += `Source: LawLens Work Verified Findings\n`;
    text += `${"=".repeat(60)}\n\n`;

    text += `1. EXECUTIVE RISK SUMMARY\n`;
    text += `${memo.executiveSummary}\n\n`;

    text += `2. PRIORITIZED CLAUSE RATIONALE\n`;
    memo.clauseRationales.forEach((cr, i) => {
      text += `[${i + 1}] ${cr.title} (${cr.severity.toUpperCase()})\n`;
      text += `Rationale: ${cr.rationale}\n`;
      text += `Negotiation Goal: ${cr.negotiationGoal}\n\n`;
    });

    text += `3. PROFESSIONAL NEGOTIATION EMAIL DRAFT\n`;
    text += `Subject: ${memo.negotiationEmail.subject}\n\n`;
    text += `${memo.negotiationEmail.body}\n`;

    return text;
  };

  const exportText = React.useMemo(() => {
    if (activeTab === "email") {
      return generateDraftEmail(
        domain.label,
        topic.label,
        findings,
        questions,
        redactDetails
      );
    }
    if (activeTab === "brief") {
      return generateLawyerBrief(
        domain.label,
        topic.label,
        findings,
        domain.verify_pointers,
        redactDetails
      );
    }
    return currentMemo ? formatMemoAsText(currentMemo) : "";
  }, [
    activeTab,
    domain.label,
    topic.label,
    domain.verify_pointers,
    findings,
    questions,
    redactDetails,
    currentMemo,
  ]);

  const handleCopy = async () => {
    if (!exportText) return;
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleCopyEmailOnly = async () => {
    if (!currentMemo) return;
    try {
      const emailContent = `Subject: ${currentMemo.negotiationEmail.subject}\n\n${currentMemo.negotiationEmail.body}`;
      await navigator.clipboard.writeText(emailContent);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2500);
    } catch {
      setEmailCopied(false);
    }
  };

  const handleGenerateMemo = async (force: boolean = false) => {
    // 1. Efficiency: Re-use cached result immediately if present; avoid network call unless forced
    if (!force && memoCache[currentCacheKey]) {
      setMemoError(null);
      return;
    }

    // 2. Efficiency: Prevent duplicate concurrent requests from repeated clicks
    if (memoLoading || inFlightKeyRef.current === currentCacheKey) {
      return;
    }

    // 3. Efficiency: Abort previous pending request if state changed
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const requestedKey = currentCacheKey;
    inFlightKeyRef.current = requestedKey;
    setMemoLoading(true);
    setMemoError(null);

    try {
      // Send ONLY client-redacted excerpts and finding metadata
      const redactedPayload = prepareRedactedFindingsForMemo(findings);

      const response = await fetch("/api/summarize-findings", {
        method: "POST",
        signal: abortController.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domainLabel: domain.label,
          topicLabel: topic.label,
          findings: redactedPayload,
        }),
      });

      if (!response.ok) {
        let errMessage = "Unable to generate negotiation memo.";
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errMessage = errData.error;
          }
        } catch {
          // Keep generic message
        }
        if (isMountedRef.current && inFlightKeyRef.current === requestedKey) {
          setMemoError(errMessage);
        }
        return;
      }

      const data = await response.json();
      // 4. Stale-request prevention: safely prevent stale results from replacing current result
      if (isMountedRef.current && inFlightKeyRef.current === requestedKey) {
        if (data && data.memo) {
          setMemoCache((prev) => {
            const next = { ...prev, [requestedKey]: data.memo };
            const keys = Object.keys(next);
            // Memory bound: keep maximum 50 entries in client memo cache
            if (keys.length > 50) {
              delete next[keys[0]];
            }
            return next;
          });
        } else {
          setMemoError("Model response was missing required memo structure.");
        }
      }
    } catch (err: unknown) {
      // If aborted because the user changed state, silently exit without setting error
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      if (isMountedRef.current && inFlightKeyRef.current === requestedKey) {
        setMemoError(
          "Network connection error while contacting server. Please check your connection and try again."
        );
      }
    } finally {
      if (inFlightKeyRef.current === requestedKey) {
        inFlightKeyRef.current = null;
        if (isMountedRef.current) {
          setMemoLoading(false);
        }
      }
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
            Options & Next Steps: Export Drafts & Negotiation Memo
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Export structured legal briefs, draft emails, or generate an AI-assisted negotiation memo.
          </p>
        </div>

        {/* Redaction Toggle - On by default */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-md border border-slate-200 shadow-2xs">
          <input
            type="checkbox"
            id="redact-contact-details-toggle"
            checked={redactDetails}
            onChange={(e) => setRedactDetails(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none cursor-pointer"
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          role="tablist"
          aria-label="Export options"
          className="flex flex-wrap items-center gap-1 bg-slate-200/80 p-1 rounded-md"
        >
          <button
            type="button"
            role="tab"
            id="tab-draft-email"
            tabIndex={activeTab === "email" ? 0 : -1}
            aria-selected={activeTab === "email"}
            aria-controls="panel-draft-email"
            onClick={() => setActiveTab("email")}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                setActiveTab("brief");
                document.getElementById("tab-lawyer-brief")?.focus();
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setActiveTab("memo");
                document.getElementById("tab-negotiation-memo")?.focus();
              }
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
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
            role="tab"
            id="tab-lawyer-brief"
            tabIndex={activeTab === "brief" ? 0 : -1}
            aria-selected={activeTab === "brief"}
            aria-controls="panel-lawyer-brief"
            onClick={() => setActiveTab("brief")}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                setActiveTab("memo");
                document.getElementById("tab-negotiation-memo")?.focus();
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setActiveTab("email");
                document.getElementById("tab-draft-email")?.focus();
              }
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activeTab === "brief"
                ? "bg-white text-indigo-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
            Lawyer Consultation Brief
          </button>
          <button
            type="button"
            role="tab"
            id="tab-negotiation-memo"
            tabIndex={activeTab === "memo" ? 0 : -1}
            aria-selected={activeTab === "memo"}
            aria-controls="panel-negotiation-memo"
            onClick={() => setActiveTab("memo")}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") {
                e.preventDefault();
                setActiveTab("email");
                document.getElementById("tab-draft-email")?.focus();
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setActiveTab("brief");
                document.getElementById("tab-lawyer-brief")?.focus();
              }
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
              activeTab === "memo"
                ? "bg-white text-indigo-900 shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
            Negotiation Memo (Gemini 2.5)
          </button>
        </div>

        {activeTab !== "memo" || currentMemo ? (
          <button
            type="button"
            id="copy-export-button"
            onClick={handleCopy}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
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
        ) : null}
      </div>

      {/* Tab Panels */}
      {activeTab !== "memo" ? (
        <div
          id={activeTab === "email" ? "panel-draft-email" : "panel-lawyer-brief"}
          role="tabpanel"
          className="relative"
        >
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
      ) : (
        /* Negotiation Memo Tab Panel */
        <div
          id="panel-negotiation-memo"
          role="tabpanel"
          aria-labelledby="tab-negotiation-memo"
          className="space-y-4"
        >
          {!currentMemo ? (
            /* Memo Generation Prompt / CTA Card */
            <div className="p-5 bg-white border border-indigo-100 rounded-lg shadow-xs space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-slate-900">
                    One-Click Negotiation Strategy Memo
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Uses <strong>Gemini 2.5 Flash</strong> to synthesize your {findings.length} verified deterministic
                    findings into a structured 3-part memorandum:
                  </p>
                  <ul className="text-xs text-slate-600 list-disc list-inside pt-1 space-y-0.5">
                    <li>
                      <strong className="text-slate-800">1. Executive Risk Summary</strong>: Plain-English breakdown of flagged issues.
                    </li>
                    <li>
                      <strong className="text-slate-800">2. Prioritized Clause Rationale</strong>: Practical rationale and specific negotiation goals.
                    </li>
                    <li>
                      <strong className="text-slate-800">3. Professional Negotiation Email</strong>: Diplomatic draft ready to send to HR or management.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Privacy Notice Card */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  <strong>Zero Full-Text Transmission:</strong> Your full raw contract never leaves your browser.
                  Only pre-redacted clause excerpts and verified finding metadata are sent to the Gemini API.
                </p>
              </div>

              {/* Error Message */}
              {memoError && (
                <div
                  role="alert"
                  className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-1 flex-1">
                    <p className="font-semibold">Generation Failed</p>
                    <p>{memoError}</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-1 flex items-center gap-3">
                <button
                  type="button"
                  id="generate-negotiation-memo-button"
                  onClick={() => handleGenerateMemo(false)}
                  disabled={memoLoading || findings.length === 0}
                  aria-busy={memoLoading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-md shadow-xs transition-colors flex items-center gap-2 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                >
                  {memoLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                      <span>Synthesizing with Gemini 2.5 Flash...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" aria-hidden="true" />
                      <span>Generate Negotiation Memo</span>
                    </>
                  )}
                </button>
                {memoLoading && (
                  <span className="text-xs text-slate-500 font-medium" role="status" aria-live="polite">
                    Processing verified findings...
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Rendered Structured Memo Display */
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-50/60 p-3 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 text-xs text-indigo-950 font-medium">
                  <Sparkles className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  <span>
                    Generated via <strong>Gemini 2.5 Flash</strong> from {findings.length} verified deterministic check{findings.length === 1 ? "" : "s"}.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEmailOnly}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded hover:bg-indigo-50 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                  >
                    {emailCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                        <span>Email Copied!</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                        <span>Copy Email Only</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenerateMemo(true)}
                    disabled={memoLoading}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
                    title="Regenerate memo"
                  >
                    <RotateCw className={`w-3 h-3 ${memoLoading ? "animate-spin text-indigo-600" : ""}`} aria-hidden="true" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>

              {/* Section 1: Executive Risk Summary */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-2 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    1. Executive Risk Summary
                  </h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans">
                  {currentMemo.executiveSummary}
                </p>
              </div>

              {/* Section 2: Prioritized Clause Rationale */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-2xs">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Briefcase className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    2. Prioritized Clause Rationale ({currentMemo.clauseRationales.length} Clauses)
                  </h4>
                </div>
                <div className="space-y-2.5">
                  {currentMemo.clauseRationales.map((cr, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md border border-slate-100 bg-slate-50/60 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {idx + 1}. {cr.title}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            cr.severity.toLowerCase() === "high"
                              ? "bg-rose-100 text-rose-800"
                              : cr.severity.toLowerCase() === "medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {cr.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-slate-800">Rationale: </strong>
                        {cr.rationale}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <strong className="text-indigo-800">Negotiation Goal: </strong>
                        {cr.negotiationGoal}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Professional Negotiation Email */}
              <div className="p-4 bg-white border border-slate-200 rounded-lg space-y-3 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-indigo-600" aria-hidden="true" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                      3. Professional Negotiation Email Draft
                    </h4>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-900 bg-slate-100/70 p-2 rounded border border-slate-200">
                    <strong>Subject:</strong> {currentMemo.negotiationEmail.subject}
                  </div>
                  <textarea
                    readOnly
                    rows={8}
                    value={currentMemo.negotiationEmail.body}
                    aria-label="Professional Negotiation Email Body"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-800 leading-relaxed focus:outline-none select-all resize-y"
                  />
                </div>
              </div>

              {/* Privacy Footer */}
              <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>
                  Privacy Verified: Only client-redacted clause excerpts and finding metadata were sent to the Gemini API. Full contract text never leaves your browser.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

ExportView.displayName = "ExportView";

