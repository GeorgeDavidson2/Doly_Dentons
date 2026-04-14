import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function getAuthenticatedLawyer() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const { data: lawyer } = await service
    .from("lawyers")
    .select("id, email")
    .eq("email", user.email)
    .single();

  return lawyer;
}

export async function GET(
  _req: Request,
  { params }: { params: { briefId: string } }
) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // Fetch the brief (need matter_id to check membership)
  const { data: brief, error: briefError } = await service
    .from("context_briefs")
    .select("id, matter_id, jurisdiction_code, jurisdiction_name, status, legal_landscape, cultural_intelligence, regulatory_notes, created_at")
    .eq("id", params.briefId)
    .single();

  if (briefError || !brief) {
    return NextResponse.json({ error: "Brief not found" }, { status: 404 });
  }

  // Verify the requesting lawyer is on the matter team
  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", brief.matter_id)
    .eq("lawyer_id", lawyer.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(brief, {
    headers: {
      // Polling endpoint — never serve stale data from cache
      "Cache-Control": "no-store",
    },
  });
}
