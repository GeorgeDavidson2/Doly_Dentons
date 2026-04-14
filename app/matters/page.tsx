import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import MattersDirectory, { type MatterSummary } from "./_components/MattersDirectory";

export default async function MattersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const { data: lawyer } = await service
    .from("lawyers")
    .select("id")
    .eq("email", user.email)
    .single();

  if (!lawyer) redirect("/dashboard");

  const { data: teamRows } = await service
    .from("matter_team")
    .select("matter_id")
    .eq("lawyer_id", lawyer.id);

  const matterIds = (teamRows ?? []).map((r) => r.matter_id);

  let matters: MatterSummary[] = [];

  if (matterIds.length > 0) {
    const { data, error } = await service
      .from("matters")
      .select(`
        id, title, client_name, matter_type, status, deadline, created_at,
        matter_jurisdictions(jurisdiction_code, jurisdiction_name),
        matter_team(lawyer_id)
      `)
      .in("id", matterIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load matters: ${error.message}`);
    }

    matters = (data ?? []) as unknown as MatterSummary[];
  }

  return (
    <div className="flex min-h-screen bg-brand-grey-bg">
      <Sidebar />
      <main className="flex-1 p-8">
        <MattersDirectory matters={matters} />
      </main>
    </div>
  );
}
