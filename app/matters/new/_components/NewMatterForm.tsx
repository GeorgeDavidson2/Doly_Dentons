"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronDown, Loader2 } from "lucide-react";
import { JURISDICTIONS, type Jurisdiction } from "@/lib/jurisdictions";

const MATTER_TYPES = [
  "Corporate Expansion",
  "M&A",
  "Tech Regulation",
  "Employment",
  "IP",
  "Compliance",
  "Litigation",
];

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const MIN_DATE = tomorrow.toISOString().split("T")[0];

type FieldErrors = Partial<Record<"title" | "client_name" | "matter_type" | "jurisdictions" | "deadline", string>>;

export default function NewMatterForm() {
  const router = useRouter();

  // Form fields
  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [matterType, setMatterType] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Jurisdiction[]>([]);

  // Jurisdiction combobox
  const [query, setQuery] = useState("");
  const [comboOpen, setComboOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return JURISDICTIONS.filter(
      (j) =>
        !selected.find((s) => s.code === j.code) &&
        (j.name.toLowerCase().includes(q) || j.code.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [query, selected]);

  // Close combobox on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setComboOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function addJurisdiction(j: Jurisdiction) {
    if (selected.length >= 8) return;
    setSelected((prev) => [...prev, j]);
    setQuery("");
    inputRef.current?.focus();
  }

  function removeJurisdiction(code: string) {
    setSelected((prev) => prev.filter((j) => j.code !== code));
  }

  function validate(): FieldErrors {
    const errs: FieldErrors = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!clientName.trim()) errs.client_name = "Client name is required";
    if (!matterType) errs.matter_type = "Select a matter type";
    if (selected.length === 0) errs.jurisdictions = "Select at least one jurisdiction";
    if (deadline && new Date(deadline) <= new Date()) errs.deadline = "Deadline must be in the future";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch("/api/matters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          client_name: clientName.trim(),
          matter_type: matterType,
          deadline: deadline || undefined,
          description: description.trim(),
          jurisdiction_codes: selected.map((j) => j.code),
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error("Unexpected server response");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create matter");
      }

      router.push(`/matters/${data.id}/context`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Matter</h1>
        <p className="text-sm text-gray-500 mt-1">
          Submitting will generate jurisdiction briefs and surface matched lawyers automatically.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-white border border-brand-grey rounded-xl p-6 space-y-5">

          {/* Title + Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Matter title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: undefined })); }}
                placeholder="TechCorp Global Expansion"
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors ${
                  errors.title ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-brand-grey focus:border-brand-purple focus:ring-brand-purple"
                }`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Client name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); setErrors((p) => ({ ...p, client_name: undefined })); }}
                placeholder="TechCorp Inc."
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 transition-colors ${
                  errors.client_name ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-brand-grey focus:border-brand-purple focus:ring-brand-purple"
                }`}
              />
              {errors.client_name && <p className="text-xs text-red-500 mt-1">{errors.client_name}</p>}
            </div>
          </div>

          {/* Matter type + Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Matter type <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={matterType}
                  onChange={(e) => { setMatterType(e.target.value); setErrors((p) => ({ ...p, matter_type: undefined })); }}
                  className={`w-full px-3 py-2 rounded-lg border text-sm appearance-none bg-white focus:outline-none focus:ring-1 transition-colors ${
                    errors.matter_type ? "border-red-400 focus:border-red-400 focus:ring-red-400 text-gray-900" : "border-brand-grey focus:border-brand-purple focus:ring-brand-purple"
                  } ${!matterType ? "text-gray-400" : "text-gray-900"}`}
                >
                  <option value="" disabled>Select type...</option>
                  {MATTER_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {errors.matter_type && <p className="text-xs text-red-500 mt-1">{errors.matter_type}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Deadline</label>
              <input
                type="date"
                value={deadline}
                min={MIN_DATE}
                onChange={(e) => { setDeadline(e.target.value); setErrors((p) => ({ ...p, deadline: undefined })); }}
                className={`w-full px-3 py-2 rounded-lg border text-sm text-gray-900 focus:outline-none focus:ring-1 transition-colors ${
                  errors.deadline ? "border-red-400 focus:border-red-400 focus:ring-red-400" : "border-brand-grey focus:border-brand-purple focus:ring-brand-purple"
                }`}
              />
              {errors.deadline && <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>}
            </div>
          </div>

          {/* Jurisdiction combobox */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Jurisdictions <span className="text-red-400">*</span>
              <span className="text-gray-400 font-normal ml-1">({selected.length}/8)</span>
            </label>

            <div ref={comboRef} className="relative">
              <div
                className={`min-h-[42px] flex flex-wrap gap-1.5 px-3 py-2 rounded-lg border bg-white cursor-text transition-colors ${
                  errors.jurisdictions ? "border-red-400" : comboOpen ? "border-brand-purple ring-1 ring-brand-purple" : "border-brand-grey"
                }`}
                onClick={() => { setComboOpen(true); inputRef.current?.focus(); }}
              >
                {selected.map((j) => (
                  <span
                    key={j.code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-purple/10 text-brand-purple text-xs rounded-full border border-brand-purple/20"
                  >
                    {j.flag} {j.code}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeJurisdiction(j.code); }}
                      className="hover:text-brand-purple-dark ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setComboOpen(true); setErrors((p) => ({ ...p, jurisdictions: undefined })); }}
                  onFocus={() => setComboOpen(true)}
                  placeholder={selected.length === 0 ? "Search jurisdictions..." : ""}
                  className="flex-1 min-w-[120px] text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                  disabled={selected.length >= 8}
                />
              </div>

              {comboOpen && filtered.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full bg-white border border-brand-grey rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {filtered.map((j) => (
                    <li key={j.code}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); addJurisdiction(j); setComboOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-brand-purple/5 hover:text-brand-purple transition-colors text-left"
                      >
                        <span>{j.flag}</span>
                        <span>{j.name}</span>
                        <span className="text-gray-400 text-xs ml-auto">{j.code}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {errors.jurisdictions && <p className="text-xs text-red-500 mt-1">{errors.jurisdictions}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Description <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief overview of the matter, key objectives, or context for matched lawyers..."
              className="w-full px-3 py-2 rounded-lg border border-brand-grey text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
            />
          </div>

          {/* Server error */}
          {serverError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.push("/matters")}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Creating matter..." : "Create matter"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
