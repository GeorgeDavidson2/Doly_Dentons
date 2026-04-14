"use client";

import { useState, useEffect, useRef } from "react";
import { RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import BriefCard, { type Brief } from "./BriefCard";
import BriefSkeleton from "./BriefSkeleton";

type Jurisdiction = { jurisdiction_code: string; jurisdiction_name: string };

type Props = {
  matterId: string;
  initialBriefs: Brief[];
  jurisdictions: Jurisdiction[];
};

export default function ContextTab({ matterId, initialBriefs, jurisdictions }: Props) {
  const [briefs, setBriefs] = useState<Brief[]>(initialBriefs);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);
  const briefsRef = useRef(briefs);
  briefsRef.current = briefs;

  // Auto-trigger generation if no briefs yet
  useEffect(() => {
    if (briefs.length === 0 && !autoTriggered.current) {
      autoTriggered.current = true;
      void handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll generating briefs (handles page-refresh-mid-generation case)
  const hasGenerating = briefs.some((b) => b.status === "generating");
  useEffect(() => {
    if (!hasGenerating) return;

    const interval = setInterval(async () => {
      const generating = briefsRef.current.filter((b) => b.status === "generating");
      if (generating.length === 0) return;

      const updates = await Promise.allSettled(
        generating.map((b) =>
          fetch(`/api/context/${b.id}`, { cache: "no-store" }).then((r) => r.json())
        )
      );

      setBriefs((prev) => {
        const next = [...prev];
        updates.forEach((result, i) => {
          if (result.status === "fulfilled" && result.value?.id) {
            const idx = next.findIndex((b) => b.id === generating[i].id);
            if (idx !== -1) next[idx] = result.value as Brief;
          }
        });
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [hasGenerating]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);

    // Show skeletons immediately for any jurisdiction that doesn't have a ready brief
    const readyCodes = new Set(
      briefs.filter((b) => b.status === "ready").map((b) => b.jurisdiction_code)
    );
    const pending = jurisdictions.filter((j) => !readyCodes.has(j.jurisdiction_code));

    if (pending.length > 0) {
      const skeletonPlaceholders: Brief[] = pending.map((j) => ({
        id: `pending-${j.jurisdiction_code}`,
        jurisdiction_code: j.jurisdiction_code,
        jurisdiction_name: j.jurisdiction_name,
        status: "generating",
        legal_landscape: null,
        cultural_intelligence: null,
        regulatory_notes: null,
      }));
      setBriefs((prev) => {
        const existing = prev.filter((b) => b.status === "ready");
        return [...existing, ...skeletonPlaceholders];
      });
    }

    try {
      const res = await fetch("/api/context/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matter_id: matterId }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error("Unexpected server response");
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate briefs");
      }

      setBriefs(data.briefs as Brief[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      // Remove skeleton placeholders on error
      setBriefs((prev) => prev.filter((b) => !b.id.startsWith("pending-")));
    } finally {
      setIsGenerating(false);
    }
  }

  const readyBriefs = briefs.filter((b) => b.status === "ready");
  const generatingBriefs = briefs.filter((b) => b.status === "generating");
  const errorBriefs = briefs.filter((b) => b.status === "error");
  const hasErrors = errorBriefs.length > 0;
  const allDone = briefs.length > 0 && generatingBriefs.length === 0;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header row */}
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

      {/* Server / network error */}
      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty state (before auto-trigger fires) */}
      {briefs.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Sparkles className="w-8 h-8 text-brand-purple/40 mb-3" />
          <p className="text-sm font-medium text-gray-500">Preparing briefs…</p>
          <p className="text-xs text-gray-400 mt-1">
            Intelligence briefs will generate automatically
          </p>
        </div>
      )}

      {/* Error retries banner */}
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

      {/* Generating skeletons */}
      {generatingBriefs.map((b) => (
        <BriefSkeleton key={b.id} jurisdictionName={b.jurisdiction_name} />
      ))}

      {/* Ready briefs */}
      {readyBriefs.map((b) => (
        <BriefCard key={b.id} brief={b} />
      ))}
    </div>
  );
}
