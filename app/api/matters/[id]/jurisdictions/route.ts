import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

// Lightweight endpoint: just the jurisdictions for a matter.
// Used by the Flow tab's task-creation form to populate the jurisdiction
// dropdown without pulling the full matter payload (team, briefs, etc.).
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  const { data: lawyer } = await service
    .from("lawyers")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  if (!lawyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", params.id)
    .eq("lawyer_id", lawyer.id)
    .eq("status", "accepted")
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await service
    .from("matter_jurisdictions")
    .select("jurisdiction_code, jurisdiction_name")
    .eq("matter_id", params.id)
    .order("jurisdiction_code");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
