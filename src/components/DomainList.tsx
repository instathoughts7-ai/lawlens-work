import React from "react";
import { Domain } from "../types.ts";
import {
  Briefcase,
  ShoppingBag,
  Users,
  Home,
  ChevronRight,
  Lock,
} from "lucide-react";

interface DomainListProps {
  domains: Domain[];
  onSelectDomain: (domain: Domain) => void;
}

export const DomainList: React.FC<DomainListProps> = ({
  domains,
  onSelectDomain,
}) => {
  const getDomainIcon = (id: string, active: boolean) => {
    const iconClass = `w-5 h-5 ${active ? "text-indigo-600" : "text-slate-400"}`;
    switch (id) {
      case "employee":
        return <Briefcase className={iconClass} aria-hidden="true" />;
      case "consumer":
        return <ShoppingBag className={iconClass} aria-hidden="true" />;
      case "family":
        return <Users className={iconClass} aria-hidden="true" />;
      case "housing":
        return <Home className={iconClass} aria-hidden="true" />;
      default:
        return <Briefcase className={iconClass} aria-hidden="true" />;
    }
  };

  const getDomainDesc = (id: string) => {
    switch (id) {
      case "employee":
        return "Analyze appointment letters, notice periods, relocation directives, and employment contracts in India.";
      case "consumer":
        return "Contracts for e-commerce, warranty fine print, service agreements, and consumer grievances.";
      case "family":
        return "Family settlements, succession guidelines, affidavits, and domestic agreements.";
      case "housing":
        return "Tenant-landlord rental deeds, maintenance covenants, and property purchase agreements.";
      default:
        return "";
    }
  };

  return (
    <section
      id="domains-selection-level"
      aria-label="Select Legal Domain"
      className="space-y-5"
    >
      <div className="border-b border-slate-200 pb-3">
        <h2 className="text-lg font-bold text-slate-900">
          Select Legal Domain
        </h2>
        <p className="text-sm text-slate-600 mt-0.5">
          Choose a category to review relevant clauses and potential contract
          pitfalls.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {domains.map((domain) => {
          const hasTopics = Boolean(
            domain.sections &&
            domain.sections.length > 0 &&
            domain.sections.some((s) => s.topics && s.topics.length > 0)
          );
          const isDisabled = !hasTopics;

          return (
            <button
              key={domain.id}
              id={`domain-card-${domain.id}`}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  onSelectDomain(domain);
                }
              }}
              aria-disabled={isDisabled}
              className={`p-5 text-left border rounded-lg transition-all relative flex flex-col justify-between ${
                !isDisabled
                  ? "bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-xs cursor-pointer ring-1 ring-indigo-50"
                  : "bg-slate-50/70 border-slate-200 opacity-65 cursor-not-allowed select-none"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                        !isDisabled ? "bg-indigo-50" : "bg-slate-100"
                      }`}
                    >
                      {getDomainIcon(domain.id, !isDisabled)}
                    </div>
                    <span className="font-bold text-base text-slate-900">
                      {domain.label}
                    </span>
                  </div>

                  {isDisabled ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-slate-200 text-slate-600">
                      <Lock className="w-3 h-3" aria-hidden="true" />
                      Coming soon
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {getDomainDesc(domain.id)}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-semibold">
                {!isDisabled ? (
                  <>
                    <span className="text-indigo-600">
                      {domain.sections?.length || 0} Sections Available
                    </span>
                    <span className="text-indigo-600 flex items-center gap-0.5">
                      Explore{" "}
                      <ChevronRight
                        className="w-3.5 h-3.5"
                        aria-hidden="true"
                      />
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400">Under development</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
