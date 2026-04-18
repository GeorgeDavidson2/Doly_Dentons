"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Overview", segment: "overview" },
  { label: "Context", segment: "context" },
  { label: "Connect", segment: "connect" },
  { label: "Flow", segment: "flow" },
];

export default function MatterTabs({ id }: { id: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-0 -mb-px overflow-x-auto">
      {TABS.map((tab) => {
        const href = `/matters/${id}/${tab.segment}`;
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={tab.segment}
            href={href}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "border-brand-purple text-brand-purple"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
