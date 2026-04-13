import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import LawyersDirectory from "./_components/LawyersDirectory";
import type { LawyerWithJurisdictions } from "@/components/lawyers/LawyerCard";

export default async function LawyersPage() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("lawyers")
    .select(`
      id, full_name, title, office_city, office_country,
      languages, reputation_score, matters_count, avatar_url,
      lawyer_jurisdictions(jurisdiction_code, jurisdiction_name, expertise_level)
    `)
    .order("reputation_score", { ascending: false });

  if (error) {
    throw new Error(`Failed to load lawyers: ${error.message}`);
  }

  const lawyers = (data ?? []) as unknown as LawyerWithJurisdictions[];

  return (
    <div className="flex min-h-screen bg-brand-grey-bg">
      <Sidebar />
      <main className="flex-1 p-8">
        <LawyersDirectory lawyers={lawyers} />
      </main>
    </div>
  );
}
