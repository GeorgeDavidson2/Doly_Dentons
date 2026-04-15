"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ChevronUp, Plus, Search } from "lucide-react";
import Link from "next/link";
import type { FieldNote, Lawyer } from "@/types";

type NoteWithAuthor = Pick<
  FieldNote,
  "id" | "jurisdiction_code" | "jurisdiction_name" | "title" | "content" | "matter_type" | "upvotes" | "created_at" | "author_id"
> & { author: Pick<Lawyer, "id" | "full_name" | "office_city"> | null };

const JURISDICTIONS = [
  { code: "BR", name: "Brazil" },
  { code: "CO", name: "Colombia" },
  { code: "DE", name: "Germany" },
  { code: "EU", name: "European Union" },
  { code: "MX", name: "Mexico" },
  { code: "US", name: "United States" },
];

const JURISDICTION_COLORS: Record<string, string> = {
  BR: "bg-green-100 text-green-700",
  CO: "bg-yellow-100 text-yellow-700",
  DE: "bg-blue-100 text-blue-700",
  EU: "bg-indigo-100 text-indigo-700",
  MX: "bg-red-100 text-red-700",
  US: "bg-gray-100 text-gray-600",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

export default function FieldNotesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [notes, setNotes] = useState<NoteWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upvoting, setUpvoting] = useState<string | null>(null);

  const jurisdiction = searchParams.get("jurisdiction") || "";
  const q = searchParams.get("q") || "";
  const [search, setSearch] = useState(q);

  const fetchNotes = useCallback(async (jur: string, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (jur) params.set("jurisdiction", jur);
      if (query) params.set("q", query);
      const res = await fetch(`/api/field-notes?${params.toString()}`);
      if (res.status === 401) { router.push("/login"); return; }
      if (!res.ok) throw new Error(`Failed to load notes (${res.status})`);
      setNotes(await res.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchNotes(jurisdiction, q);
  }, [jurisdiction, q, fetchNotes]);

  function applyFilter(newJur: string, newQ: string) {
    const params = new URLSearchParams();
    if (newJur) params.set("jurisdiction", newJur);
    if (newQ) params.set("q", newQ);
    router.push(`/field-notes?${params.toString()}`);
  }

  async function handleUpvote(noteId: string) {
    if (upvoting) return;
    setUpvoting(noteId);
    try {
      const res = await fetch(`/api/field-notes/${noteId}/upvote`, { method: "POST" });
      if (res.status === 400) {
        const body = await res.json();
        alert(body.error);
        return;
      }
      if (!res.ok) return;
      const { upvotes } = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, upvotes } : n))
      );
    } finally {
      setUpvoting(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Field Notes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Jurisdiction intelligence contributed by lawyers across the firm
          </p>
        </div>
        <Link
          href="/field-notes/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Contribute
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyFilter(jurisdiction, search); }}
            onBlur={() => { if (search !== q) applyFilter(jurisdiction, search); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
          />
        </div>
        <select
          value={jurisdiction}
          onChange={(e) => applyFilter(e.target.value, q)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 bg-white"
        >
          <option value="">All jurisdictions</option>
          {JURISDICTIONS.map((j) => (
            <option key={j.code} value={j.code}>{j.name}</option>
          ))}
        </select>
      </div>

      {/* Notes */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-brand-purple" />
        </div>
      ) : error ? (
        <div className="text-center py-16 text-sm text-red-500">{error}</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400">
          {jurisdiction || q ? "No notes match your filters." : "No notes yet — be the first to contribute."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3"
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      JURISDICTION_COLORS[note.jurisdiction_code] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {note.jurisdiction_name}
                  </span>
                  <h3 className="font-semibold text-gray-900 text-sm mt-2 leading-snug">
                    {note.title}
                  </h3>
                </div>
                <button
                  onClick={() => handleUpvote(note.id)}
                  disabled={upvoting === note.id}
                  className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border border-gray-200 hover:border-brand-purple/40 hover:bg-brand-purple/5 transition-colors disabled:opacity-50 flex-shrink-0"
                  aria-label={`Upvote: ${note.upvotes} votes`}
                >
                  {upvoting === note.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-purple" />
                  ) : (
                    <ChevronUp className="w-3.5 h-3.5 text-brand-purple" />
                  )}
                  <span className="text-[11px] font-semibold text-brand-purple">{note.upvotes}</span>
                </button>
              </div>

              {/* Content preview */}
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                {note.content}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-gray-50">
                <span>{note.author?.full_name ?? "Unknown"} · {note.author?.office_city}</span>
                <span>{relativeTime(note.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
