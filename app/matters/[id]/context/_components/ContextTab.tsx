"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, AlertCircle, Sparkles, XCircle } from "lucide-react";
import BriefCard, { type Brief } from "./BriefCard";
import BriefSkeleton from "./BriefSkeleton";

type Jurisdiction = { jurisdiction_code: string; jurisdiction_name: string };

type Props = {
  matterId: string;
  initialBriefs: Brief[];
  jurisdictions: Jurisdiction[];
};

const POLL_TIMEOUT_MS = 60_000;

export default function ContextTab({ matterId, initialBriefs, jurisdictions }: Props) {
  const [briefs, setBriefs] = useState<Brief[]>(initialBriefs);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);
  const briefsRef = useRef(briefs);
  briefsRef.current = briefs;
  const stopPolling = useRef(false);
  const pollingStartedAt = useRef<number | null>(null);

  // Auto-trigger generation if no briefs yet
  useEffect(() => {
    if (briefs.length === 0 && !autoTriggered.current) {
      autoTriggered.current = true;
      void handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll real generating briefs (handles page-refresh-mid-generation; skip optimistic pending- stubs)
  const hasGenerating = briefs.some(
    (b) => b.status === "generating" && !b.id.startsWith("pending-")
  );
  useEffect(() => {
    if (!hasGenerating) {
      pollingStartedAt.current = null;
      return;
    }

    stopPolling.current = false;
    if (!pollingStartedAt.current) {
      pollingStartedAt.current = Date.now();
    }

    const interval = setInterval(async () => {
      if (stopPolling.current) return;

      // Timeout: if generating for >60 s, mark remaining as error in UI
      if (pollingStartedAt.current && Date.now() - pollingStartedAt.current > POLL_TIMEOUT_MS) {
        setBriefs((prev) =>
          prev.map((b) =>
            b.status === "generating" && !b.id.startsWith("pending-")
              ? { ...b, status: "error" as const }
              : b
          )
        );
        return;
      }

      const generating = briefsRef.current.filter(
        (b) => b.status === "generating" && !b.id.startsWith("pending-")
      );
      if (generating.length === 0) return;

      const updates = await Promise.allSettled(
        generating.map(async (b) => {
          const res = await fetch(`/api/context/${b.id}`, { cache: "no-store" });
          if (res.redirected) {
            stopPolling.current = true;
            setError("Your session expired. Please refresh the page to continue.");
            throw new Error("session-expired");
          }
          const ct = res.headers.get("content-type") ?? "";
          if (!res.ok || !ct.includes("application/json")) {
            throw new Error(`Unexpected response: HTTP ${res.status}`);
          }
          return res.json() as Promise<Brief>;
        })
      );

      setBriefs((prev) => {
        const next = [...prev];
        updates.forEach((result, i) => {
          if (result.status === "fulfilled" && result.value?.id) {
            const idx = next.findIndex((b) => b.id === generating[i].id);
            if (idx !== -1) next[idx] = result.value;
          }
        });
        return next;
      });
    }, 2500);

    return () => {
      stopPolling.current = true;
      clearInterval(interval);
    };
  }, [hasGenerating]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    // Optimistic skeletons for pending jurisdictions (stable order preserved by render logic)
    const readyCodes = new Set(
      briefs.filter((b) => b.status === "ready").map((b) => b.jurisdiction_code)
    );
    const pending = jurisdictions.filter((j) => !readyCodes.has(j.jurisdiction_code));

    if (pending.length > 0) {
      const stubs: Brief[] = pending.map((j) => ({
        id: `pending-${j.jurisdiction_code}`,
        jurisdiction_code: j.jurisdiction_code,
        jurisdiction_name: j.jurisdiction_name,
        status: "generating",
        legal_landscape: null,
        cultural_intelligence: null,
        regulatory_notes: null,
      }));
      setBriefs((prev) => [
        ...prev.filter((b) => b.status === "ready"),
        ...stubs,
      ]);
    }

    try {
      const res = await fetch("/api/context/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matter_id: matterId }),
      });

      if (res.redirected) {
        setError("Your session expired. Please refresh the page to log in.");
        setBriefs((prev) => prev.filter((b) => !b.id.startsWith("pending-")));
        return;
      }

      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("application/json")) {
        throw new Error("Unexpected server response");
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to generate briefs");

      setBriefs(data.briefs as Brief[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBriefs((prev) => prev.filter((b) => !b.id.startsWith("pending-")));
    } finally {
      setIsGenerating(false);
    }
  }

  const briefByCode = new Map(briefs.map((b) => [b.jurisdiction_code, b]));
  const errorBriefs = briefs.filter((b) => b.status === "error");
  const hasErrors = errorBriefs.length > 0;
  const allDone =
    briefs.length > 0 &&
    !briefs.some((b) => b.status === "generating");

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Jurisdiction Intelligence Briefs
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            AI-generated legal landscape, cultural context, and regulatory notes per jurisdiction
          </p>
        </div>
        {allDone && (
          <button
            type="button"
            onClick={() => void handleGenerate()}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-brand-grey rounded-lg hover:border-brand-purple hover:text-brand-purple disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerate
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty / preparing state */}
      {briefs.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="w-8 h-8 text-brand-purple/40 mb-3" />
          <p className="text-sm font-medium text-gray-500">Preparing briefs…</p>
          <p className="text-xs text-gray-400 mt-1">
            Intelligence briefs will generate automatically
          </p>
        </div>
      )}

      {/* Retry banner */}
      {hasErrors && allDone && (
        <div className="flex items-center justify-between px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-700">
            {errorBriefs.length} brief{errorBriefs.length !== 1 ? "s" : ""} failed to generate.
          </p>
          <button
            type="button"
            onClick={() => void handleGenerate()}
            className="text-sm font-medium text-amber-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stable ordered list — each slot rendered in jurisdiction order */}
      {jurisdictions.map((j) => {
        const brief = briefByCode.get(j.jurisdiction_code);

        if (brief?.status === "ready") {
          return <BriefCard key={j.jurisdiction_code} brief={brief} />;
        }

        if (brief?.status === "error") {
          return (
            <div
              key={j.jurisdiction_code}
              className="flex items-center gap-3 bg-white border border-red-200 rounded-xl px-5 py-4"
            >
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="text-sm text-gray-600">
                <span className="font-medium">{j.jurisdiction_name}</span> — brief generation failed
              </p>
            </div>
          );
        }

        // Generating (real or optimistic stub) or no brief yet during active generation
        if (isGenerating || brief?.status === "generating") {
          return (
            <BriefSkeleton key={j.jurisdiction_code} jurisdictionName={j.jurisdiction_name} />
          );
        }

        return null;
      })}
    </div>
  );
}
