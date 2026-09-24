import { Finding, CheckDefinition } from "../types.ts";
import scenariosData from "../data/scenarios.json";

const checks = scenariosData.checks as Record<string, CheckDefinition>;

// Static patterns hoisted to module level to eliminate per-call regex instantiation
const EMPLOYEE_PATTERN =
  /\b(employee|executive|consultant|you|staff|resign|resignation)\b/i;
const COMPANY_PATTERN =
  /\b(company|employer|management|organization|terminate|termination|discharge|pay in lieu)\b/i;
const NOTICE_DAYS_REGEX = /(\d+)\s*(?:days?'?|days|day's|day)\b/i;
const NOTICE_MONTHS_REGEX = /(\d+)\s*months?\b/i;
const NOTICE_WORD_REGEX = /notice/i;

const LOCATION_HEADER_REGEX =
  /(?:Base\s+)?Location:?\s*([A-Za-z\s]+?)(?:\r?\n|$|\.)/i;
const STATIONED_LOCATION_REGEX =
  /(?:stationed at|located in|office in|report to the)\s+(?:the\s+)?(?:Company's\s+)?(?:principal\s+)?(?:office\s+in\s+)?([A-Za-z]+)(?:\s+office)?/i;

const MAJOR_CITIES = [
  "Bengaluru",
  "Bangalore",
  "Mumbai",
  "Bombay",
  "Delhi",
  "New Delhi",
  "Gurugram",
  "Gurgaon",
  "Noida",
  "Hyderabad",
  "Chennai",
  "Madras",
  "Pune",
  "Kolkata",
  "Calcutta",
  "Ahmedabad",
  "Kochi",
  "Cochin",
  "Chandigarh",
  "Jaipur",
  "Coimbatore",
];

const MAJOR_CITIES_CANONICAL_MAP = new Map<string, string>();
for (const city of MAJOR_CITIES) {
  MAJOR_CITIES_CANONICAL_MAP.set(city.toLowerCase(), city);
}
// Sort by descending length so multi-word names like "New Delhi" match before "Delhi"
const SORTED_MAJOR_CITIES = [...MAJOR_CITIES].sort((a, b) => b.length - a.length);
const MAJOR_CITIES_REGEX = new RegExp(`\\b(${SORTED_MAJOR_CITIES.join("|")})\\b`, "i");

const FREQ_DOC_A_PATTERN = /\b(?:occasionally|as required|as needed)\b/i;
const FREQ_DOC_B_PATTERN =
  /\b(?:(?:\d+|one|two|three|four|five|six|seven)\s+days?\s+(?:a|per)\s+week)\b/i;

const LINE_ITEM_REGEX =
  /^(.*?)(?::|-|\s+)\s*(?:INR|Rs\.?|₹)?\s*([\d,]+(?:\.\d+)?)\s*$/i;

const GROSS_SALARY_REGEX =
  /\bGross(?:\s+Salary|\s+Pay)?\b[:\s\-]*([0-9,]+(?:\.[0-9]+)?)/i;
const NET_PAY_REGEX = /\bNet\s+Pay\b[:\s\-]*([0-9,]+(?:\.[0-9]+)?)/i;

const LEAVE_DOC_A_REGEX_1 =
  /(\d+)\s*(?:days?(?:\s+of)?(?:\s+(?:paid|annual|earned|privilege))?\s+leave|days\s+leave)/i;
const LEAVE_DOC_A_HEADER_REGEX =
  /(?:leave\s+entitlement|annual\s+leave|paid\s+leave)[:\s\-]+(\d+)\s*days?/i;
const LEAVE_DOC_B_PAT1 = /([A-Za-z\s]+leave)[:\s\-]+(\d+)\s*days?/i;
const LEAVE_DOC_B_PAT2 = /(\d+)\s*days?(?:\s+of)?\s+([A-Za-z\s]+leave)/i;

/**
 * Extracts notice days stated for a specific entity from text.
 * Matches explicit digits associated with days/months.
 * Returns null if no numeric notice period is found.
 */
function extractNoticeDays(
  text: string,
  entityPattern: RegExp
): { days: number; span: string } | null {
  // First, look for sentences or clauses referencing notice
  const sentenceRegex = /[^.!?\n]+[.!?\n]+/g;
  let match: RegExpExecArray | null;

  while ((match = sentenceRegex.exec(text)) !== null) {
    const sentence = match[0];
    if (entityPattern.test(sentence) && NOTICE_WORD_REGEX.test(sentence)) {
      // Look for day numbers: "90 days' written notice", "30 days' notice", "60 days", etc.
      const daysMatch = sentence.match(NOTICE_DAYS_REGEX);
      if (daysMatch) {
        const days = parseInt(daysMatch[1], 10);
        if (!isNaN(days) && days > 0) {
          return { days, span: sentence.trim() };
        }
      }

      // Look for months: "3 months notice", "1 month notice"
      const monthsMatch = sentence.match(NOTICE_MONTHS_REGEX);
      if (monthsMatch) {
        const months = parseInt(monthsMatch[1], 10);
        if (!isNaN(months) && months > 0) {
          return { days: months * 30, span: sentence.trim() };
        }
      }
    }
  }

  return null;
}

/**
 * Handler for NP1: Notice Period Asymmetry
 * Compares employee resignation notice vs employer termination notice.
 * If neither states a number (e.g., "reasonable notice"), returns NO finding.
 * If employee days > employer days, returns a high severity finding.
 * exactQuote is the verbatim sentence pair or sentence from input.
 */
export function handleNoticeAsymmetry(texts: string[]): Finding[] {
  const rawText = texts[0] || "";
  if (!rawText.trim()) {
    return [];
  }

  const empResult = extractNoticeDays(rawText, EMPLOYEE_PATTERN);
  const compResult = extractNoticeDays(rawText, COMPANY_PATTERN);

  // If neither or only one side states a number, return NO finding (never guess a number)
  if (!empResult || !compResult) {
    return [];
  }

  // If employee notice is strictly greater than company notice, this is asymmetry
  if (empResult.days > compResult.days) {
    const checkDef = checks.NP1;
    if (!checkDef) return [];

    // Find the verbatim substring from input containing both clauses/sentences
    let exactQuote: string | null = null;
    const startIdx1 = rawText.indexOf(empResult.span);
    const startIdx2 = rawText.indexOf(compResult.span);

    if (startIdx1 !== -1 && startIdx2 !== -1) {
      const minStart = Math.min(startIdx1, startIdx2);
      const maxEnd = Math.max(
        startIdx1 + empResult.span.length,
        startIdx2 + compResult.span.length
      );
      exactQuote = rawText.slice(minStart, maxEnd).trim();
    } else if (startIdx1 !== -1) {
      exactQuote = rawText
        .slice(startIdx1, startIdx1 + empResult.span.length)
        .trim();
    }

    // Ensure exactQuote is a verbatim substring of input
    if (exactQuote && !rawText.includes(exactQuote)) {
      exactQuote = null;
    }

    return [
      {
        checkId: checkDef.id,
        title: checkDef.title,
        type: checkDef.type,
        severity: checkDef.severity,
        plainSummary: `You are required to provide ${empResult.days} days' written notice to resign, whereas the company can terminate your employment with only ${compResult.days} days' notice.`,
        exactQuote: exactQuote || `${empResult.span} ${compResult.span}`.trim(),
        whyItMatters: checkDef.whyItMatters,
        questionToAsk: checkDef.questionToAsk,
      },
    ];
  }

  return [];
}

/**
 * Extracts workplace location from a document.
 */
function extractLocation(
  text: string
): { location: string; rawSpan: string } | null {
  if (!text) return null;

  // Pattern: "Base Location: Bengaluru" or "Location: Mumbai"
  const locationHeaderMatch = text.match(LOCATION_HEADER_REGEX);
  if (locationHeaderMatch) {
    const loc = locationHeaderMatch[1].trim();
    if (loc && loc.length > 2) {
      return { location: loc, rawSpan: locationHeaderMatch[0].trim() };
    }
  }

  // Pattern: "stationed at ... [City]" or "report to the [City] office"
  const stationedMatch = text.match(STATIONED_LOCATION_REGEX);
  if (stationedMatch) {
    const loc = stationedMatch[1].trim();
    if (loc && loc.length > 2) {
      return { location: loc, rawSpan: stationedMatch[0].trim() };
    }
  }

  // Known Indian metropolitan employment hubs checked in a single compiled pass
  const cityMatch = text.match(MAJOR_CITIES_REGEX);
  if (cityMatch) {
    const matchedCity = cityMatch[1];
    const canonical =
      MAJOR_CITIES_CANONICAL_MAP.get(matchedCity.toLowerCase()) || matchedCity;
    const match = text.match(
      new RegExp(`(?:[^.\\n]*?\\b${matchedCity}\\b[^.\\n]*)`, "i")
    );
    return { location: canonical, rawSpan: match ? match[0].trim() : canonical };
  }

  return null;
}

/**
 * Normalizes city names that have historical or regional synonyms in India.
 */
function normalizeCity(city: string): string {
  const lower = city.toLowerCase().trim();
  if (lower === "bengaluru" || lower === "bangalore") return "bengaluru";
  if (lower === "mumbai" || lower === "bombay") return "mumbai";
  if (lower === "gurugram" || lower === "gurgaon") return "gurugram";
  if (lower === "chennai" || lower === "madras") return "chennai";
  if (lower === "kolkata" || lower === "calcutta") return "kolkata";
  if (lower === "kochi" || lower === "cochin") return "kochi";
  return lower;
}

/**
 * Handler for RTO1: Workplace Location Conflict
 * Compares Document A (original offer/contract) vs Document B (new directive/RTO).
 */
export function handleLocationConflict(texts: string[]): Finding[] {
  const docA = texts[0] || "";
  const docB = texts[1] || "";

  if (!docA.trim() || !docB.trim()) {
    return [];
  }

  const locA = extractLocation(docA);
  const locB = extractLocation(docB);

  if (
    locA &&
    locB &&
    normalizeCity(locA.location) !== normalizeCity(locB.location)
  ) {
    const checkDef = checks.RTO1;
    if (!checkDef) return [];

    const quoteA = locA.rawSpan;
    const quoteB = locB.rawSpan;
    const exactQuote = `${quoteA} vs ${quoteB}`;

    return [
      {
        checkId: checkDef.id,
        title: checkDef.title,
        type: checkDef.type,
        severity: checkDef.severity,
        plainSummary: `Document A specifies base location as ${locA.location}, but Document B requires working from ${locB.location}.`,
        exactQuote: exactQuote,
        whyItMatters: checkDef.whyItMatters,
        questionToAsk: checkDef.questionToAsk,
      },
    ];
  }

  return [];
}

/**
 * Extracts the first sentence from text matching a regex pattern.
 */
function extractFirstMatchingSentence(
  text: string,
  pattern: RegExp
): string | null {
  const sentences = text.match(/[^.!?\n]+(?:[.!?\n]+|$)/g);
  if (sentences) {
    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (sentence && pattern.test(sentence)) {
        return sentence;
      }
    }
  }

  const match = pattern.exec(text);
  if (match) {
    const matchIdx = match.index;
    const prevNewline = Math.max(0, text.lastIndexOf("\n", matchIdx));
    const nextNewline = text.indexOf("\n", matchIdx + match[0].length);
    const lineEnd = nextNewline === -1 ? text.length : nextNewline;
    return text.slice(prevNewline, lineEnd).trim();
  }

  return null;
}

/**
 * 1. frequency_conflict (topic: rto_schedule, check: RTO2)
 * Fire if Document A contains wording like "occasionally" / "as required" / "as needed"
 * for office attendance, AND Document B demands a specific number of office days per week
 * (e.g. "5 days a week", "three days per week").
 * exactQuote = the matching sentence from EACH document, joined with " | ".
 * Do not fire if A has no attendance wording at all — that's silence, not a conflict.
 */
export function handleFrequencyConflict(texts: string[]): Finding[] {
  const docA = texts[0] || "";
  const docB = texts[1] || "";

  if (!docA.trim() || !docB.trim()) {
    return [];
  }

  if (FREQ_DOC_A_PATTERN.test(docA) && FREQ_DOC_B_PATTERN.test(docB)) {
    const checkDef = checks.RTO2;
    if (!checkDef) return [];

    const sentenceA = extractFirstMatchingSentence(docA, FREQ_DOC_A_PATTERN) || "";
    const sentenceB = extractFirstMatchingSentence(docB, FREQ_DOC_B_PATTERN) || "";
    const exactQuote =
      sentenceA && sentenceB
        ? `${sentenceA} | ${sentenceB}`
        : sentenceA || sentenceB || null;

    return [
      {
        checkId: checkDef.id,
        title: checkDef.title,
        type: checkDef.type,
        severity: checkDef.severity,
        plainSummary:
          "Document A allows flexible/occasional office attendance, whereas Document B mandates a fixed schedule of in-office working days per week.",
        exactQuote: exactQuote,
        whyItMatters: checkDef.whyItMatters,
        questionToAsk: checkDef.questionToAsk,
      },
    ];
  }

  return [];
}

/**
 * Parses lines into label and numeric amount pairs.
 * E.g. "Basic Salary 50000", "Provident Fund: 5000", "Late Mark Penalty 1000", "Gross 90000"
 */
function parseLineItems(
  text: string
): { label: string; amount: number; rawLine: string }[] {
  const lines = text.split(/\r?\n/);
  const items: { label: string; amount: number; rawLine: string }[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    const match = trimmed.match(LINE_ITEM_REGEX);
    if (match) {
      const label = match[1].replace(/[:\-]$/, "").trim();
      const numStr = match[2].replace(/,/g, "");
      const amount = parseFloat(numStr);
      if (label && !isNaN(amount)) {
        items.push({ label, amount, rawLine: trimmed });
      }
    }
  }

  return items;
}

/**
 * 2. unexplained_deductions (topic: payslip_check, check: PS1)
 * Input is two documents: annexure (A) and payslip (B).
 * For each payslip deduction line whose label has no reasonably matching label in the annexure
 * (case-insensitive substring match), report it as unexplained.
 * One finding listing all unexplained items and their total, not one finding per item.
 *
 * 3. net_check (also topic: payslip_check, runs alongside #2)
 * From the payslip only, find "Gross NUMBER", sum of deduction lines, and "Net Pay NUMBER".
 * Fire ONLY if gross - total_deductions != net_pay (allow a rounding tolerance of 1).
 * If they match, return no finding — this must stay silent on a correct payslip.
 */
export function handlePayslipCheck(texts: string[]): Finding[] {
  const docA = texts[0] || "";
  const docB = texts[1] || "";

  const findings: Finding[] = [];
  const checkDef = checks.PS1;
  if (!checkDef) return [];

  // Parse items from annexure (docA)
  const annexureItems = parseLineItems(docA);

  // Parse lines from payslip (docB if two docs provided, else docA)
  const payslipText = docB.trim() ? docB : docA;
  const _payslipItems = parseLineItems(payslipText);

  // Identify deductions in payslip
  // Lines under a "Deductions" section, or lines explicitly indicating deductions/recovery/tax/pf/penalty
  // Also parse sections in payslipText if structured
  const payslipLines = payslipText.split(/\r?\n/);
  let inDeductionsSection = false;
  const deductionItems: { label: string; amount: number; rawLine: string }[] =
    [];

  for (const line of payslipLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (
      /^(?:deductions?|total deductions?)\b/i.test(trimmed) &&
      !/\d+/.test(trimmed)
    ) {
      inDeductionsSection = true;
      continue;
    }
    if (
      /^(?:earnings?|gross|net pay|summary)\b/i.test(trimmed) &&
      !/\d+/.test(trimmed)
    ) {
      inDeductionsSection = false;
      continue;
    }

    const parsed = parseLineItems(trimmed)[0];
    if (parsed) {
      const lowerLabel = parsed.label.toLowerCase();
      // Skip top-level summary totals like "Total Deductions", "Gross", "Net Pay"
      if (
        lowerLabel.startsWith("total deduction") ||
        lowerLabel.startsWith("gross") ||
        lowerLabel.startsWith("net pay")
      ) {
        continue;
      }

      if (
        inDeductionsSection ||
        /(?:deduction|pf|provident|tax|tds|esi|recovery|penalty|adjustment|late mark|damage)/i.test(
          lowerLabel
        )
      ) {
        deductionItems.push(parsed);
      }
    }
  }

  // 2. unexplained_deductions: only runs if we have an annexure in docA and payslip in docB
  if (docB.trim() && annexureItems.length > 0) {
    const unexplained: { label: string; amount: number; rawLine: string }[] =
      [];

    for (const ded of deductionItems) {
      const dedLabel = ded.label.toLowerCase();
      // Case-insensitive substring match against any annexure label
      const matchedInAnnexure = annexureItems.some((ann) => {
        const annLabel = ann.label.toLowerCase();
        return annLabel.includes(dedLabel) || dedLabel.includes(annLabel);
      });

      if (!matchedInAnnexure) {
        unexplained.push(ded);
      }
    }

    if (unexplained.length > 0) {
      const totalUnexplained = unexplained.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const itemsListStr = unexplained
        .map((u) => `${u.label} (${u.amount})`)
        .join(", ");
      const quoteStr = unexplained.map((u) => u.rawLine).join(" | ");

      findings.push({
        checkId: checkDef.id,
        title: "Unexplained Salary Deductions",
        type: checkDef.type,
        severity: "high",
        plainSummary: `Unexplained deductions not found in the compensation annexure: ${itemsListStr}. Total unexplained: ${totalUnexplained}.`,
        exactQuote: quoteStr,
        whyItMatters:
          "Under Indian wage payment regulations and contract law, an employer cannot make arbitrary or unagreed deductions that were not authorized in your compensation agreement.",
        questionToAsk:
          "Can the payroll department provide an itemized justification and contractual basis for these deductions?",
      });
    }
  }

  // 3. net_check (runs on payslip):
  // Find "Gross NUMBER", sum of deduction lines, and "Net Pay NUMBER".
  // Fire ONLY if gross - total_deductions != net_pay (allow a rounding tolerance of 1).
  const grossMatch = payslipText.match(GROSS_SALARY_REGEX);
  const netMatch = payslipText.match(NET_PAY_REGEX);

  if (grossMatch && netMatch && deductionItems.length > 0) {
    const grossVal = parseFloat(grossMatch[1].replace(/,/g, ""));
    const netVal = parseFloat(netMatch[1].replace(/,/g, ""));
    const totalDeductions = deductionItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const calculatedNet = grossVal - totalDeductions;
    const diff = Math.abs(calculatedNet - netVal);

    if (diff > 1) {
      findings.push({
        checkId: checkDef.id,
        title: "Net Pay Calculation Discrepancy",
        type: checkDef.type,
        severity: "high",
        plainSummary: `Payslip math discrepancy: Gross (${grossVal}) minus Deductions (${totalDeductions}) equals ${calculatedNet}, but stated Net Pay is ${netVal} (difference of ${diff}).`,
        exactQuote: `${grossMatch[0].trim()} | Total Deductions: ${totalDeductions} | ${netMatch[0].trim()}`,
        whyItMatters:
          "Discrepancies between gross earnings, itemized deductions, and stated net salary indicate potential payroll accounting errors or hidden deductions.",
        questionToAsk:
          "Can the payroll team clarify the arithmetic discrepancy between Gross pay, total deductions, and Net pay?",
      });
    }
  }

  return findings;
}

/**
 * 4. leave_days_conflict (topic: leave_entitlement, check: LV1)
 * Document A: find a number before "days of paid leave" or similar.
 * Document B (policy): sum numbers before "leave" mentions (e.g. "Casual leave: 12 days", "Sick leave: 6 days") into a total.
 * Fire only if the two totals differ, showing both numbers in plainSummary.
 */
export function handleLeaveDaysConflict(texts: string[]): Finding[] {
  const docA = texts[0] || "";
  const docB = texts[1] || "";

  if (!docA.trim() || !docB.trim()) {
    return [];
  }

  // Document A: number before "days of paid leave" or similar:
  // e.g. "24 days of paid leave", "24 days of annual leave", "entitled to 24 days leave"
  let totalDocA: number | null = null;
  let matchSpanA = "";

  const docAMatch = docA.match(LEAVE_DOC_A_REGEX_1);
  if (docAMatch) {
    totalDocA = parseInt(docAMatch[1], 10);
    matchSpanA = docAMatch[0];
  } else {
    // Also try: "Leave Entitlement: 24 days"
    const headerMatch = docA.match(LEAVE_DOC_A_HEADER_REGEX);
    if (headerMatch) {
      totalDocA = parseInt(headerMatch[1], 10);
      matchSpanA = headerMatch[0];
    }
  }

  if (totalDocA === null) {
    return [];
  }

  // Document B (policy): sum numbers before or associated with "leave" mentions
  // e.g. "Casual leave: 12 days", "Sick leave: 6 days", "Privilege leave: 15 days"
  // or "12 days casual leave", "6 days sick leave"
  let totalDocB = 0;
  const leaveMentionsB: string[] = [];

  const linesB = docB.split(/\r?\n/);
  for (const line of linesB) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Pattern 1: "Casual leave: 12 days" or "Sick leave: 6 days"
    const m1 = trimmed.match(LEAVE_DOC_B_PAT1);
    if (m1) {
      const num = parseInt(m1[2], 10);
      if (!isNaN(num)) {
        totalDocB += num;
        leaveMentionsB.push(trimmed);
        continue;
      }
    }

    // Pattern 2: "12 days of casual leave" or "12 days casual leave"
    const m2 = trimmed.match(LEAVE_DOC_B_PAT2);
    if (m2) {
      const num = parseInt(m2[1], 10);
      if (!isNaN(num)) {
        totalDocB += num;
        leaveMentionsB.push(trimmed);
      }
    }
  }

  if (totalDocB === 0) {
    return [];
  }

  if (totalDocA !== totalDocB) {
    const checkDef = checks.LV1;
    if (!checkDef) return [];

    const exactQuote = `${matchSpanA} | ${leaveMentionsB.join(", ")}`;

    return [
      {
        checkId: checkDef.id,
        title: checkDef.title,
        type: checkDef.type,
        severity: checkDef.severity,
        plainSummary: `Document A specifies ${totalDocA} days of leave, but Document B policy totals ${totalDocB} days (${leaveMentionsB.join("; ")}).`,
        exactQuote: exactQuote,
        whyItMatters: checkDef.whyItMatters,
        questionToAsk: checkDef.questionToAsk,
      },
    ];
  }

  return [];
}

/**
 * Registry of handlers mapped to Check IDs.
 * NP1, RTO1, RTO2, PS1, LV1 are implemented.
 */
export const checkHandlers: Record<string, (texts: string[]) => Finding[]> = {
  NP1: handleNoticeAsymmetry,
  RTO1: handleLocationConflict,
  RTO2: handleFrequencyConflict,
  PS1: handlePayslipCheck,
  LV1: handleLeaveDaysConflict,
  NC1: () => [],
  RL1: () => [],
  PB1: () => [],
  IP1: () => [],
  CB1: () => [],
};
