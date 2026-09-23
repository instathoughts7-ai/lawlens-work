import React from "react";
import { AlertCircle } from "lucide-react";

interface DisclaimerBannerProps {
  id?: string;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({
  id = "legal-disclaimer",
}) => {
  return (
    <div
      id={id}
      role="note"
      aria-label="Legal Disclaimer"
      className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-md text-sm flex items-start gap-2.5 leading-relaxed"
    >
      <AlertCircle
        className="w-5 h-5 text-amber-700 shrink-0 mt-0.5"
        aria-hidden="true"
      />
      <div>
        <span className="font-semibold text-amber-950">Important Notice: </span>
        Information only, not legal advice. Check important decisions with a qualified professional.
      </div>
    </div>
  );
};
