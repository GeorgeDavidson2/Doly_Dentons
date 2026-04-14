"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Users, Calendar, Clock } from "lucide-react";

type MatterJurisdiction = {
  jurisdiction_code: string;
  jurisdiction_name: string;
};

type MatterTeamMember = {
  lawyer_id: string;
};

export type MatterSummary = {
  id: string;
  title: string;
  client_name: string;
  matter_type: string;
  status: "active" | "completed" | "archived";
  deadline: string | null;
  created_at: string;
  matter_jurisdictions: MatterJurisdiction[];
  matter_team: MatterTeamMember[];
};

const STATUS_LABELS: Record<MatterSummary["status"], string> = {
  active: "Active",
  completed: "Completed",
  archived: "Archived",
};

const STATUS_STYLES: Record<MatterSummary["status"], string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function MatterCard({ matter }: { matter: MatterSummary }) {
  const visibleJurisdictions = matter.matter_jurisdictions.slice(0, 4);
  const overflow = matter.matter_jurisdictions.length - visibleJurisdictions.length;

  return (
    <Link
      href={`/matters/${matter.id}`}
      className="block bg-white border border-brand-grey rounded-xl p-5 hover:border-brand-purple hover:shadow-sm transition-all group"
    >
      {/* Title + status */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h2 className="text-sm font-semibold text-gray-900 group-hover:text-brand-purple transition-colors line-clamp-2">
          {matter.title}
        </h2>
        <span
          className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLES[matter.status]}`}
        >
          {STATUS_LABELS[matter.status]}
        </span>
      </div>

      {/* Client + type */}
      <p className="text-xs text-gray-500 mb-3">
        {matter.client_name}
        <span className="mx-1.5 text-gray-300">·</span>
        {matter.matter_type}
      </p>

      {/* Jurisdiction chips */}
      {matter.matter_jurisdictions.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {visibleJurisdictions.map((j) => (
            <span
              key={j.jurisdiction_code}
              className="text-[11px] px-2 py-0.5 bg-brand-purple/8 text-brand-purple rounded-full border border-brand-purple/15"
            >
              {j.jurisdiction_code}
            </span>
          ))}
          {overflow > 0 && (
            <span className="text-[11px] px-2 py-0.5 text-gray-400 rounded-full border border-gray-200">
              +{overflow} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-4 text-[11px] text-gray-400">
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {matter.matter_team.length} member{matter.matter_team.length !== 1 ? "s" : ""}
        </span>
        {matter.deadline ? (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due {formatDate(matter.deadline)}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(matter.created_at)}
          </span>
        )}
      </div>
    </Link>
  );
}

type Status = MatterSummary["status"] | "all";

const TABS: { value: Status; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export default function MattersDirectory({ matters }: { matters: MatterSummary[] }) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Status>("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return matters.filter((m) => {
      const matchesStatus = activeTab === "all" || m.status === activeTab;
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.client_name.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [matters, activeTab, search]);

  const countByStatus = useMemo(() => {
    const counts: Record<Status, number> = { all: matters.length, active: 0, completed: 0, archived: 0 };
    matters.forEach((m) => counts[m.status]++);
    return counts;
  }, [matters]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matters</h1>
          <p className="text-sm text-gray-500 mt-1">{matters.length} matter{matters.length !== 1 ? "s" : ""} across your portfolio</p>
        </div>
        <Link
          href="/matters/new"
          className="flex items-center gap-2 px-4 py-2 bg-brand-purple text-white text-sm font-medium rounded-lg hover:bg-brand-purple-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          New matter
        </Link>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 ${activeTab === tab.value ? "text-brand-purple" : "text-gray-400"}`}>
                {countByStatus[tab.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            aria-label="Search matters by title or client"
            placeholder="Search by title or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-brand-grey bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-purple focus:ring-1 focus:ring-brand-purple transition-colors"
          />
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          {matters.length === 0 ? (
            <>
              <p className="text-gray-400 text-sm">No matters yet.</p>
              <Link href="/matters/new" className="mt-2 inline-block text-brand-purple text-sm hover:underline">
                Create your first matter
              </Link>
            </>
          ) : search.trim() ? (
            <p className="text-gray-400 text-sm">No matters match your search.</p>
          ) : (
            <p className="text-gray-400 text-sm">No {activeTab} matters.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((matter) => (
            <MatterCard key={matter.id} matter={matter} />
          ))}
        </div>
      )}
    </div>
  );
}
