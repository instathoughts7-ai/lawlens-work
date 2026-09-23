export type Severity = "high" | "medium" | "low";

export interface Finding {
  checkId: string;
  title: string;
  type: string;
  severity: Severity;
  plainSummary: string;
  exactQuote: string | null;
  whyItMatters: string;
  questionToAsk: string;
}

export interface Topic {
  id: string;
  label: string;
  checks: string[];
  privacy_note?: string;
  safety_note?: string;
}

export interface Section {
  id: string;
  label: string;
  topics: Topic[];
}

export interface Domain {
  id: string;
  label: string;
  disabled?: boolean;
  comingSoon?: boolean;
  sections: Section[];
  verify_pointers?: string[];
  privacy_note?: string;
  safety_note?: string;
}

export interface CheckDefinition {
  id: string;
  title: string;
  type: string;
  kind?: string;
  severity: Severity;
  pattern?: string;
  plainSummary?: string;
  whyItMatters: string;
  questionToAsk: string;
}

export interface ScenariosConfig {
  domains: Domain[];
  checks: Record<string, CheckDefinition>;
}

export type NavLevel = "domains" | "sections" | "topics" | "analysis";

export interface ClauseRationale {
  title: string;
  severity: string;
  rationale: string;
  negotiationGoal: string;
}

export interface NegotiationEmail {
  subject: string;
  body: string;
}

export interface NegotiationMemo {
  executiveSummary: string;
  clauseRationales: ClauseRationale[];
  negotiationEmail: NegotiationEmail;
}
