"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const JURISDICTIONS = [
  { code: "BR", name: "Brazil" },
  { code: "CO", name: "Colombia" },
  { code: "DE", name: "Germany" },
  { code: "EU", name: "European Union" },
  { code: "MX", name: "Mexico" },
  { code: "US", name: "United States" },
];

const MATTER_TYPES = [
  "M&A",
  "Regulatory",
  "Litigation",
  "Employment",
  "IP",
  "Data Privacy",
  "Finance",
  "Real Estate",
];

export default function NewFieldNotePage() {
  const router = useRouter();

  const [jurisdiction, setJurisdiction] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [matterType, setMatterType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jurisdiction || !title.trim() || !content.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/field-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jurisdiction_code: jurisdiction,
          title: title.trim(),
          content: content.trim(),
          matter_type: matterType || null,
          visibility: "firm",
        }),
      });

      if (res.status === 401) { router.push("/login"); return; }

      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? "Failed to create note");
        return;
      }

      router.push("/field-notes");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back */}
      <Link
        href="/field-notes"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Field Notes
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Contribute a Field Note</h1>
        <p className="text-sm text-gray-500 mb-6">
          Share practical jurisdiction intelligence with the firm. Earns 40 reputation points.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Jurisdiction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Jurisdiction <span className="text-red-500">*</span>
            </label>
            <select
              value={jurisdiction}
              onChange={(e) => setJurisdiction(e.target.value)}
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 bg-white"
            >
              <option value="">Select a jurisdiction</option>
              {JURISDICTIONS.map((j) => (
                <option key={j.code} value={j.code}>{j.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Colombia FDI restrictions for foreign investors"
              required
              maxLength={200}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple/40"
            />
          </div>

          {/* Matter type (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Matter type <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              value={matterType}
              onChange={(e) => setMatterType(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 bg-white"
            >
              <option value="">Any</option>
              {MATTER_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share what you know — regulations, cultural norms, practical tips for working in this jurisdiction..."
              required
              rows={8}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-purple/40 resize-y"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !jurisdiction || !title.trim() || !content.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish note
            </button>
            <Link
              href="/field-notes"
              className="px-5 py-2.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
