import { Finding, Topic, Severity, CheckDefinition } from "../types.ts";
import scenariosDataRaw from "../data/scenarios.json";
import { checkHandlers } from "./handlers.ts";

const scenariosData = scenariosDataRaw as {
  domains: {
    id: string;
    label: string;
    sections?: {
      id: string;
      label: string;
      topics: Topic[];
    }[];
  }[];
  checks: Record<string, CheckDefinition>;
};

const SEVERITY_WEIGHT: Record<Severity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const IMPLEMENTED_HANDLERS = new Set(["NP1", "RTO1", "RTO2", "PS1", "LV1"]);

/**
 * Extracts a verbatim sentence or clause matching the regex from the text.
 */
function extractMatchingSentence(text: string, regex: RegExp): string | null {
  const sentences = text.match(/[^.!?\n]+(?:[.!?\n]+|$)/g);
  if (sentences) {
    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (sentence && regex.test(sentence)) {
        const startIdx = text.indexOf(sentence);
        if (startIdx !== -1) {
          return text.slice(startIdx, startIdx + sentence.length).trim();
        }
        return sentence;
      }
    }
  }

  const match = regex.exec(text);
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
 * Parses and normalizes input text(s).
 * Handles single string inputs, arrays of strings, and document marker splits
 * like "=== DOCUMENT A ===" and "=== DOCUMENT B ===".
 */
function normalizeInputs(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input;
  }

  const rawText = input || "";

  // If input has document markers, split cleanly into Document A and Document B
  if (/===\s*DOCUMENT\s*B\s*===/i.test(rawText)) {
    const parts = rawText.split(/===\s*DOCUMENT\s*B\s*===/i);
    const docA = parts[0].replace(/===\s*DOCUMENT\s*A\s*===/i, "").trim();
    const docB = parts[1]?.trim() || "";
    return [docA, docB];
  }

  return [rawText];
}

/**
 * Finds a topic definition by ID or Label within scenariosData.
 */
export function findTopic(topicIdOrLabel: string): Topic | null {
  const target = (topicIdOrLabel || "").trim().toLowerCase();
  for (const domain of scenariosData.domains) {
    if (domain.sections) {
      for (const section of domain.sections) {
        const found = section.topics.find(
          (t) =>
            t.id.toLowerCase() === target || t.label.toLowerCase() === target
        );
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * Checks if a topic is wired up.
 * A topic is wired if none of its check_ids has kind "handler",
 * and (for notice_length, rto_location) the two already-implemented handlers.
 */
export function isTopicWiredUp(topicIdOrLabel: string): boolean {
  const topic = findTopic(topicIdOrLabel);
  if (!topic || !topic.checks || topic.checks.length === 0) {
    return false;
  }

  return topic.checks.every((checkId) => {
    const checkDef = scenariosData.checks[checkId];
    if (!checkDef) return false;
    const kind = checkDef.kind || checkDef.type;
    if (kind === "handler") {
      return IMPLEMENTED_HANDLERS.has(checkId);
    }
    return kind === "pattern" || kind === "missing";
  });
}

/**
 * Main analysis engine function.
 * Looks up topic -> check_ids -> executes handlers/pattern/missing checks -> sorts by severity (high -> low).
 */
export function analyze(
  topicIdOrLabel: string,
  input: string | string[]
): Finding[] {
  const topic = findTopic(topicIdOrLabel);
  if (!topic) {
    return [];
  }

  const inputs = normalizeInputs(input);
  const text = inputs.join("\n\n");
  const findings: Finding[] = [];

  for (const checkId of topic.checks) {
    const checkDef = scenariosData.checks[checkId];
    if (!checkDef) continue;

    const kind = checkDef.kind || checkDef.type;

    if (kind === "handler") {
      const handler = checkHandlers[checkId];
      if (handler) {
        const results = handler(inputs);
        if (results && results.length > 0) {
          findings.push(...results);
        }
      }
    } else if (kind === "pattern") {
      if (checkDef.pattern) {
        const regex = new RegExp(checkDef.pattern, "i");
        if (regex.test(text)) {
          const exactQuote = extractMatchingSentence(text, regex);
          findings.push({
            checkId: checkDef.id,
            title: checkDef.title,
            type: checkDef.type || checkDef.kind || "pattern",
            severity: checkDef.severity,
            plainSummary:
              checkDef.plainSummary ||
              `A ${checkDef.title.toLowerCase()} clause was identified in your document.`,
            exactQuote,
            whyItMatters: checkDef.whyItMatters,
            questionToAsk: checkDef.questionToAsk,
          });
        }
      }
    } else if (kind === "missing") {
      if (checkDef.pattern) {
        const regex = new RegExp(checkDef.pattern, "i");
        if (!regex.test(text)) {
          findings.push({
            checkId: checkDef.id,
            title: checkDef.title,
            type: checkDef.type || checkDef.kind || "missing",
            severity: checkDef.severity,
            plainSummary:
              checkDef.plainSummary ||
              `The document is missing standard provisions for ${checkDef.title.toLowerCase()}.`,
            exactQuote: null,
            whyItMatters: checkDef.whyItMatters,
            questionToAsk: checkDef.questionToAsk,
          });
        }
      }
    }
  }

  // Sort findings by severity: high -> medium -> low
  return findings.sort(
    (a, b) => SEVERITY_WEIGHT[a.severity] - SEVERITY_WEIGHT[b.severity]
  );
}
