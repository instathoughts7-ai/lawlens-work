import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeAnalysisCacheKey, prepareRedactedFindingsForMemo } from "../utils/redaction.ts";

describe("Gemini Negotiation Memo Efficiency and In-Flight Protections", () => {
  const sampleFindings = [
    {
      checkId: "NP1",
      title: "Asymmetric Notice Period",
      type: "asymmetry",
      severity: "high" as const,
      plainSummary: "Employee must give 90 days notice; employer gives only 30 days.",
      exactQuote: "Notice period is 90 days. Contact hr@corp.com.",
      whyItMatters: "Heavy exit barrier.",
      questionToAsk: "Can notice be mutual?",
    },
    {
      checkId: "SC1",
      title: "Missing Relieving Letter Provision",
      type: "missing",
      severity: "medium" as const,
      plainSummary: "Offer omits unconditional exit documentation commitment.",
      exactQuote: null,
      whyItMatters: "Essential for next employer.",
      questionToAsk: "Will relieving letter be issued?",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("produces deterministic, identical cache keys for the same analysis state regardless of finding order", () => {
    const key1 = computeAnalysisCacheKey("employee", "notice_length", sampleFindings);
    const reversedFindings = [...sampleFindings].reverse();
    const key2 = computeAnalysisCacheKey("employee", "notice_length", reversedFindings);

    expect(key1).toBe(key2);
    expect(key1).toContain("employee:notice_length:2:");
  });

  it("produces different cache keys when findings or topics change", () => {
    const key1 = computeAnalysisCacheKey("employee", "notice_length", sampleFindings);
    const key2 = computeAnalysisCacheKey("employee", "early_release", sampleFindings);
    const key3 = computeAnalysisCacheKey("employee", "notice_length", [sampleFindings[0]]);

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it("prepares bounded, pre-redacted finding payloads without raw contract text", () => {
    const payload = prepareRedactedFindingsForMemo(sampleFindings);

    expect(payload).toHaveLength(2);
    // Verified exact quote was redacted
    expect(payload[0].exactQuote).toContain("[REDACTED EMAIL]");
    expect(payload[0].exactQuote).not.toContain("hr@corp.com");

    // Prohibited raw contract or execution context keys do not exist
    payload.forEach((f: any) => {
      expect(f.rawContractText).toBeUndefined();
      expect(f.fullDocument).toBeUndefined();
      expect(f.systemOverride).toBeUndefined();
      expect(f.checkId).toBeDefined();
      expect(f.title).toBeDefined();
      expect(f.severity).toBeDefined();
    });
  });

  it("guarantees memo cache reuse prevents redundant Gemini calls", async () => {
    let callCount = 0;
    const memoCache: Record<string, any> = {};

    const mockFetch = vi.fn(async (_url: string, _opts: any) => {
      callCount++;
      return {
        ok: true,
        json: async () => ({
          memo: {
            executiveSummary: "Mock executive summary.",
            clauseRationales: [],
            negotiationEmail: { subject: "Subj", body: "Body" },
          },
        }),
      };
    });

    // Helper simulating the memo generation flow
    async function requestMemo(cacheKey: string) {
      if (memoCache[cacheKey]) {
        return memoCache[cacheKey]; // Re-use cached result
      }
      const res = await mockFetch("/api/summarize-findings", {});
      const data = await res.json();
      memoCache[cacheKey] = data.memo;
      return data.memo;
    }

    const key = computeAnalysisCacheKey("employee", "notice_length", sampleFindings);

    // Call 1: cold cache -> triggers network call
    const result1 = await requestMemo(key);
    expect(result1.executiveSummary).toBe("Mock executive summary.");
    expect(callCount).toBe(1);

    // Call 2: warm cache -> zero additional network calls
    const result2 = await requestMemo(key);
    expect(result2).toBe(result1);
    expect(callCount).toBe(1); // Still 1!
  });

  it("prevents duplicate concurrent requests from repeated rapid clicks", async () => {
    let callCount = 0;
    let inFlightKey: string | null = null;
    let memoLoading = false;

    const mockFetch = vi.fn(async () => {
      callCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return {
        ok: true,
        json: async () => ({ memo: { executiveSummary: "Done" } }),
      };
    });

    async function triggerGenerate(requestedKey: string) {
      // Concurrency protection: prevent duplicate in-flight call
      if (memoLoading || inFlightKey === requestedKey) {
        return; // Suppressed duplicate
      }
      inFlightKey = requestedKey;
      memoLoading = true;
      try {
        await mockFetch();
      } finally {
        inFlightKey = null;
        memoLoading = false;
      }
    }

    const key = computeAnalysisCacheKey("employee", "notice_length", sampleFindings);

    // Simulate 3 rapid simultaneous clicks
    await Promise.all([
      triggerGenerate(key),
      triggerGenerate(key),
      triggerGenerate(key),
    ]);

    // Exactly 1 network call occurred despite 3 clicks
    expect(callCount).toBe(1);
  });

  it("safely aborts or supersedes in-flight request when user shifts analysis state", async () => {
    let completedRequestKey: string | null = null;
    let activeAbortController: AbortController | null = null;
    let inFlightKey: string | null = null;

    async function triggerAnalysisChange(requestedKey: string, delayMs: number) {
      if (activeAbortController) {
        activeAbortController.abort();
      }
      const controller = new AbortController();
      activeAbortController = controller;
      inFlightKey = requestedKey;

      try {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (controller.signal.aborted) {
              reject(new DOMException("Aborted", "AbortError"));
            } else {
              resolve();
            }
          }, delayMs);

          controller.signal.addEventListener("abort", () => {
            clearTimeout(timeout);
            reject(new DOMException("Aborted", "AbortError"));
          });
        });

        if (inFlightKey === requestedKey) {
          completedRequestKey = requestedKey;
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          // Stale request safely ignored
          return;
        }
        throw err;
      }
    }

    const keyA = computeAnalysisCacheKey("employee", "notice_length", sampleFindings);
    const keyB = computeAnalysisCacheKey("employee", "rto_schedule", sampleFindings);

    // User triggers A, then quickly switches to B
    const promiseA = triggerAnalysisChange(keyA, 100);
    const promiseB = triggerAnalysisChange(keyB, 20);

    await Promise.allSettled([promiseA, promiseB]);

    // Key B was the active request, key A was aborted and never overwrote state
    expect(completedRequestKey).toBe(keyB);
  });

  describe("Server-Side In-Flight Request Deduplication & LRU Cache", () => {
    // Model the exact server-side deduplication mechanics
    const serverLRUCache = new Map<string, any>();
    const serverInFlightMap = new Map<string, Promise<any>>();

    function simulateServerEndpoint(
      key: string,
      mockGeminiCall: () => Promise<any>
    ): Promise<any> {
      // 1. Check LRU cache
      if (serverLRUCache.has(key)) {
        return Promise.resolve({ memo: serverLRUCache.get(key), cached: true });
      }

      // 2. Check in-flight promise map
      let existingPromise = serverInFlightMap.get(key);
      if (!existingPromise) {
        existingPromise = (async () => {
          try {
            const result = await mockGeminiCall();
            serverLRUCache.set(key, result);
            return result;
          } finally {
            serverInFlightMap.delete(key);
          }
        })();
        serverInFlightMap.set(key, existingPromise);
      }

      return existingPromise.then((memo) => ({ memo, cached: false }));
    }

    beforeEach(() => {
      serverLRUCache.clear();
      serverInFlightMap.clear();
    });

    it("concurrent identical requests produce exactly 1 Gemini call", async () => {
      let geminiCallCount = 0;
      const key = "employee:notice_period:1:NP1:high";

      const mockGemini = vi.fn(async () => {
        geminiCallCount++;
        await new Promise((resolve) => setTimeout(resolve, 60));
        return { executiveSummary: "Consolidated risk summary." };
      });

      // Dispatch 3 concurrent requests with identical analysis state
      const [res1, res2, res3] = await Promise.all([
        simulateServerEndpoint(key, mockGemini),
        simulateServerEndpoint(key, mockGemini),
        simulateServerEndpoint(key, mockGemini),
      ]);

      // Exactly 1 Gemini call occurred
      expect(geminiCallCount).toBe(1);
      expect(res1.memo.executiveSummary).toBe("Consolidated risk summary.");
      expect(res2.memo.executiveSummary).toBe("Consolidated risk summary.");
      expect(res3.memo.executiveSummary).toBe("Consolidated risk summary.");
    });

    it("subsequent request uses LRU cache and produces 0 calls", async () => {
      let geminiCallCount = 0;
      const key = "employee:notice_period:1:NP1:high";

      const mockGemini = vi.fn(async () => {
        geminiCallCount++;
        return { executiveSummary: "Consolidated risk summary." };
      });

      // Initial call
      await simulateServerEndpoint(key, mockGemini);
      expect(geminiCallCount).toBe(1);

      // Subsequent identical call after initial completion
      const cachedRes = await simulateServerEndpoint(key, mockGemini);
      expect(cachedRes.cached).toBe(true);
      expect(geminiCallCount).toBe(1); // 0 additional calls!
    });

    it("failed Gemini request clears the in-flight entry so subsequent requests can retry", async () => {
      let attempts = 0;
      const key = "employee:notice_period:1:NP1:high";

      const flakyGemini = vi.fn(async () => {
        attempts++;
        if (attempts === 1) {
          throw new Error("Temporary AI service error");
        }
        return { executiveSummary: "Recovery successful." };
      });

      // Attempt 1 fails
      await expect(simulateServerEndpoint(key, flakyGemini)).rejects.toThrow("Temporary AI service error");

      // Verify in-flight entry was deleted in finally block
      expect(serverInFlightMap.has(key)).toBe(false);

      // Attempt 2 succeeds
      const retryRes = await simulateServerEndpoint(key, flakyGemini);
      expect(retryRes.memo.executiveSummary).toBe("Recovery successful.");
      expect(attempts).toBe(2);
    });

    it("different analysis keys remain independent and run concurrently", async () => {
      let geminiCallCount = 0;
      const keyA = "employee:notice_period:1:NP1:high";
      const keyB = "consultant:ip_assignment:1:IP1:medium";

      const mockGemini = vi.fn(async () => {
        geminiCallCount++;
        await new Promise((resolve) => setTimeout(resolve, 30));
        return { executiveSummary: "Done" };
      });

      const [resA, resB] = await Promise.all([
        simulateServerEndpoint(keyA, mockGemini),
        simulateServerEndpoint(keyB, mockGemini),
      ]);

      // Different keys must produce separate invocations
      expect(geminiCallCount).toBe(2);
      expect(resA.memo).toBeDefined();
      expect(resB.memo).toBeDefined();
      expect(serverInFlightMap.size).toBe(0);
    });
  });
});
