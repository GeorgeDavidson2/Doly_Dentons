"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import LawyerCard, { type LawyerWithJurisdictions } from "@/components/lawyers/LawyerCard";

export default function LawyersDirectory({ lawyers }: { lawyers: LawyerWithJurisdictions[] }) {
  const [search, setSearch] = useState("");
  const [selectedJurisdiction, setSelectedJurisdiction] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");

  const allJurisdictions = useMemo(() => {
    const codes = new Set<string>();
    lawyers.forEach((l) => l.lawyer_jurisdictions.forEach((j) => codes.add(j.jurisdiction_code)));
    return Array.from(codes).sort();
  }, [lawyers]);

  const allLanguages = useMemo(() => {
    const langs = new Set<string>();
    lawyers.forEach((l) => l.languages.forEach((lang) => langs.add(lang)));
    return Array.from(langs).sort();
  }, [lawyers]);

  const filtered = useMemo(() => {
    return lawyers.filter((l) => {
      const matchesSearch =
        !search ||
        l.full_name.toLowerCase().includes(search.toLowerCase()) ||
        l.office_city.toLowerCase().includes(search.toLowerCase()) ||
        l.office_country.toLowerCase().includes(search.toLowerCase());

      const matchesJurisdiction =
        !selectedJurisdiction ||
        l.lawyer_jurisdictions.some((j) => j.jurisdiction_code === selectedJurisdiction);

      const matchesLanguage =
        !selectedLanguage ||
        l.languages.some((lang) => lang.toLowerCase() === selectedLanguage.toLowerCase());

      return matchesSearch && matchesJurisdiction && matchesLanguage;
    });
  }, [lawyers, search, selectedJurisdiction, selectedLanguage]);

  const hasFilters = search || selectedJurisdiction || selectedLanguage;

  function clearFilters() {
    setSearch("");
    setSelectedJurisdiction("");
    setSelectedLanguage("");
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lawyer Directory</h1>
        <p className="text-sm text-gray-500 mt-1">{lawyers.length} lawyers across the firm</p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or office..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-brand-grey bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
          />
        </div>

        <select
          value={selectedJurisdiction}
          onChange={(e) => setSelectedJurisdiction(e.target.value)}
          className="px-3 py-2 rounded-lg border border-brand-grey bg-white text-sm text-gray-700 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
        >
          <option value="">All jurisdictions</option>
          {allJurisdictions.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>

        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="px-3 py-2 rounded-lg border border-brand-grey bg-white text-sm text-gray-700 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
        >
          <option value="">All languages</option>
          {allLanguages.map((lang) => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No lawyers match your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-brand-purple text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {hasFilters && (
            <p className="text-sm text-gray-400 mb-4">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((lawyer) => (
              <LawyerCard key={lawyer.id} lawyer={lawyer} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
