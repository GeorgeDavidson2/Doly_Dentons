import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import MattersDirectory, { type MatterSummary } from "./_components/MattersDirectory";

export default async function MattersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const service = createServiceClient();

  const { data: lawyer, error: lawyerError } = await service
    .from("lawyers")
    .select("id")
    .eq("email", user.email!)
    .maybeSingle();

  if (lawyerError) throw new Error(`Failed to load profile: ${lawyerError.message}`);
  if (!lawyer) redirect("/dashboard");

  const { data: teamRows, error: teamError } = await service
    .from("matter_team")
    .select("matter_id")
    .eq("lawyer_id", lawyer.id);

  if (teamError) throw new Error(`Failed to load matters: ${teamError.message}`);

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
    
      <main className="flex-1 p-8">
        <MattersDirectory matters={matters} />
      </main>

  );
}
