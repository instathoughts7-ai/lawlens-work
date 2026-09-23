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
        LawLens Work provides legal information and automated pattern checks for
        self-review purposes in India. It is strictly{" "}
        <strong className="font-semibold text-amber-950">
          not legal advice
        </strong>{" "}
        and does not create an advocate-client relationship. For formal disputes
        or binding legal counsel, consult a licensed Indian advocate.
      </div>
    </div>
  );
};
