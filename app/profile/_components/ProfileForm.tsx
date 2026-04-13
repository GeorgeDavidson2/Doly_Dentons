"use client";

import { useState, useMemo } from "react";
import { Plus, X, Check } from "lucide-react";
import type { Lawyer, LawyerJurisdiction, LawyerAvailability } from "@/types";

const LANGUAGES = [
  "Arabic", "Dutch", "English", "French", "German", "Hindi",
  "Italian", "Japanese", "Korean", "Malay", "Mandarin",
  "Portuguese", "Russian", "Spanish", "Turkish",
];

const MATTER_TYPES = [
  "Banking", "Competition", "Corporate", "Data Privacy", "Employment",
  "Fintech", "IP", "Litigation", "M&A", "Real Estate", "Regulatory",
  "Restructuring", "Tax", "Tech",
];

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type JurRow = {
  jurisdiction_code: string;
  jurisdiction_name: string;
  expertise_level: 1 | 2 | 3 | 4 | 5;
  matter_types: string[];
  years_experience: number;
};

type AvailDay = {
  day_of_week: number;
  day_name: string;
  enabled: boolean;
  work_start_hour: number;
  work_end_hour: number;
};

type Props = {
  lawyer: Lawyer;
  jurisdictions: LawyerJurisdiction[];
  availability: LawyerAvailability[];
};

export default function ProfileForm({ lawyer, jurisdictions: initialJur, availability: initialAvail }: Props) {
  const [bio, setBio] = useState(lawyer.bio ?? "");
  const [title, setTitle] = useState(lawyer.title ?? "");
  const [fullName, setFullName] = useState(lawyer.full_name ?? "");
  const [languages, setLanguages] = useState<string[]>(lawyer.languages ?? []);

  const [jurisdictions, setJurisdictions] = useState<JurRow[]>(
    initialJur.map(({ jurisdiction_code, jurisdiction_name, expertise_level, matter_types, years_experience }) => ({
      jurisdiction_code, jurisdiction_name, expertise_level, matter_types, years_experience,
    }))
  );
  const [addingJuris, setAddingJuris] = useState(false);
  const [newJuris, setNewJuris] = useState<JurRow>({
    jurisdiction_code: "", jurisdiction_name: "", expertise_level: 3, matter_types: [], years_experience: 1,
  });

  const [availability, setAvailability] = useState<AvailDay[]>(
    DAYS.map((day_name, day_of_week) => {
      const existing = initialAvail.find((a) => a.day_of_week === day_of_week);
      return {
        day_of_week, day_name,
        enabled: !!existing,
        work_start_hour: existing?.work_start_hour ?? 9,
        work_end_hour: existing?.work_end_hour ?? 18,
      };
    })
  );

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeness = useMemo(() => {
    let score = 0;
    if (bio.trim().length > 20) score += 25;
    if (languages.length >= 2) score += 25;
    if (jurisdictions.length >= 1) score += 25;
    if (availability.some((a) => a.enabled)) score += 25;
    return score;
  }, [bio, languages, jurisdictions, availability]);

  function toggleLanguage(lang: string) {
    setLanguages((prev) => prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]);
  }

  function toggleNewMatterType(type: string) {
    setNewJuris((prev) => ({
      ...prev,
      matter_types: prev.matter_types.includes(type)
        ? prev.matter_types.filter((t) => t !== type)
        : [...prev.matter_types, type],
    }));
  }

  function addJurisdiction() {
    if (!newJuris.jurisdiction_code || !newJuris.jurisdiction_name) return;
    if (jurisdictions.some((j) => j.jurisdiction_code === newJuris.jurisdiction_code)) return;
    setJurisdictions((prev) => [...prev, { ...newJuris }]);
    setNewJuris({ jurisdiction_code: "", jurisdiction_name: "", expertise_level: 3, matter_types: [], years_experience: 1 });
    setAddingJuris(false);
  }

  function updateAvailability(day_of_week: number, field: "enabled" | "work_start_hour" | "work_end_hour", value: boolean | number) {
    setAvailability((prev) => prev.map((a) => a.day_of_week === day_of_week ? { ...a, [field]: value } : a));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/lawyers/${lawyer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio, title, full_name: fullName, languages, jurisdictions,
          availability: availability
            .filter((a) => a.enabled)
            .map(({ day_of_week, work_start_hour, work_end_hour }) => ({ day_of_week, work_start_hour, work_end_hour })),
        }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Keep your expertise up to date to improve match quality</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
              <Check className="w-4 h-4" /> Profile updated
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Completeness */}
      <div className="bg-white border border-brand-grey rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profile completeness</span>
          <span className="text-sm font-semibold text-brand-purple">{completeness}%</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-purple rounded-full transition-all duration-500"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <p className="text-xs text-gray-400 mt-2">
            Complete your profile to unlock{" "}
            <span className="font-semibold text-brand-purple">+60 reputation points</span>
          </p>
        )}
      </div>

      {/* Basic Info */}
      <div className="bg-white border border-brand-grey rounded-xl p-6 mb-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Basic Info</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-grey text-sm text-gray-900 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-brand-grey text-sm text-gray-900 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Describe your expertise, experience, and focus areas..."
            className="w-full px-3 py-2 rounded-lg border border-brand-grey text-sm text-gray-900 placeholder-gray-400 resize-none focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Languages</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  languages.includes(lang)
                    ? "bg-brand-purple text-white border-brand-purple"
                    : "bg-white text-gray-500 border-brand-grey hover:border-brand-purple hover:text-brand-purple"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Jurisdictions */}
      <div className="bg-white border border-brand-grey rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Jurisdiction Expertise
          </h2>
          {!addingJuris && (
            <button
              type="button"
              onClick={() => setAddingJuris(true)}
              className="flex items-center gap-1 text-xs text-brand-purple hover:text-brand-purple-dark font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add jurisdiction
            </button>
          )}
        </div>

        {jurisdictions.length === 0 && !addingJuris && (
          <p className="text-sm text-gray-400">No jurisdictions added yet.</p>
        )}

        {jurisdictions.length > 0 && (
          <div className="space-y-2 mb-3">
            {jurisdictions.map((j) => (
              <div key={j.jurisdiction_code} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-semibold px-2 py-0.5 bg-brand-purple/10 text-brand-purple rounded border border-brand-purple/20 w-10 text-center flex-shrink-0">
                  {j.jurisdiction_code}
                </span>
                <span className="text-sm text-gray-700 flex-1 truncate">{j.jurisdiction_name}</span>
                <span className="text-xs text-amber-500 flex-shrink-0 tracking-tighter">
                  {"★".repeat(j.expertise_level)}
                  <span className="text-gray-200">{"★".repeat(5 - j.expertise_level)}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setJurisdictions((prev) => prev.filter((x) => x.jurisdiction_code !== j.jurisdiction_code))}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {addingJuris && (
          <div className="border border-brand-purple/30 rounded-lg p-4 mt-2 space-y-3 bg-brand-purple/5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Code (e.g. BR)</label>
                <input
                  type="text"
                  maxLength={5}
                  value={newJuris.jurisdiction_code}
                  onChange={(e) => setNewJuris((p) => ({ ...p, jurisdiction_code: e.target.value.toUpperCase() }))}
                  placeholder="BR"
                  className="w-full px-3 py-2 rounded-lg border border-brand-grey text-sm focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  value={newJuris.jurisdiction_name}
                  onChange={(e) => setNewJuris((p) => ({ ...p, jurisdiction_name: e.target.value }))}
                  placeholder="Brazil"
                  className="w-full px-3 py-2 rounded-lg border border-brand-grey text-sm focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Expertise — {newJuris.expertise_level}/5
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={newJuris.expertise_level}
                  onChange={(e) => setNewJuris((p) => ({ ...p, expertise_level: Number(e.target.value) as 1|2|3|4|5 }))}
                  className="w-full accent-brand-purple"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Years experience</label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={newJuris.years_experience}
                  onChange={(e) => setNewJuris((p) => ({ ...p, years_experience: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-brand-grey text-sm focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Matter types</label>
              <div className="flex flex-wrap gap-1.5">
                {MATTER_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleNewMatterType(type)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      newJuris.matter_types.includes(type)
                        ? "bg-brand-purple text-white border-brand-purple"
                        : "bg-white text-gray-500 border-brand-grey hover:border-brand-purple"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={addJurisdiction}
                disabled={!newJuris.jurisdiction_code || !newJuris.jurisdiction_name}
                className="px-3 py-1.5 bg-brand-purple text-white text-xs font-medium rounded-lg hover:bg-brand-purple-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingJuris(false)}
                className="px-3 py-1.5 text-gray-500 text-xs hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="bg-white border border-brand-grey rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Availability
        </h2>
        <div className="space-y-3">
          {availability.map((day) => (
            <div key={day.day_of_week} className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => updateAvailability(day.day_of_week, "enabled", !day.enabled)}
                className={`w-10 text-left text-sm font-medium transition-colors flex-shrink-0 ${
                  day.enabled ? "text-gray-700" : "text-gray-300"
                }`}
              >
                {day.day_name.slice(0, 3)}
              </button>
              {day.enabled ? (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <select
                    value={day.work_start_hour}
                    onChange={(e) => updateAvailability(day.day_of_week, "work_start_hour", Number(e.target.value))}
                    className="px-2 py-1 rounded border border-brand-grey text-xs focus:outline-none focus:border-brand-purple transition-colors"
                  >
                    {Array.from({ length: 13 }, (_, i) => i + 6).map((h) => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                  </select>
                  <span className="text-gray-400 text-xs">to</span>
                  <select
                    value={day.work_end_hour}
                    onChange={(e) => updateAvailability(day.day_of_week, "work_end_hour", Number(e.target.value))}
                    className="px-2 py-1 rounded border border-brand-grey text-xs focus:outline-none focus:border-brand-purple transition-colors"
                  >
                    {Array.from({ length: 13 }, (_, i) => i + 12).map((h) => (
                      <option key={h} value={h}>{h}:00</option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="text-xs text-gray-300">Off</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
