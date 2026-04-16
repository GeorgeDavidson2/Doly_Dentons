import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import MatterTabs from "./_components/MatterTabs";
import { getMatterDetail } from "./_lib/getMatter";

const STATUS_STYLES: Record<string, string> = {
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

export default async function MatterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const matter = await getMatterDetail(params.id);
  if (!matter) notFound();

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Matter header */}
      <div className="bg-white border-b border-brand-grey px-8 pt-7 pb-0">
        <Link
          href="/matters"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-purple transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          All matters
        </Link>

        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">{matter.title}</h1>
            <span
              className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                STATUS_STYLES[matter.status] ?? STATUS_STYLES.active
              }`}
            >
              {matter.status.charAt(0).toUpperCase() + matter.status.slice(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {matter.client_name}
            <span className="mx-2 text-gray-300">·</span>
            {matter.matter_type}
            {matter.deadline && (
              <>
                <span className="mx-2 text-gray-300">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Due {formatDate(matter.deadline)}
                </span>
              </>
            )}
          </p>
        </div>

        <MatterTabs id={params.id} />
      </div>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
