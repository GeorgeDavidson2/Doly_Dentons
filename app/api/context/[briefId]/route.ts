import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

async function getAuthenticatedLawyer() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const service = createServiceClient();
  const { data: lawyer, error } = await service
    .from("lawyers")
    .select("id, email")
    .eq("email", user.email)
    .maybeSingle();

  if (error) return null;
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

  // Single service client reused for both queries
  const service = createServiceClient();

  // Fetch brief — select matter_id for auth check but exclude it from response
  const { data: brief, error: briefError } = await service
    .from("context_briefs")
    .select("id, matter_id, jurisdiction_code, jurisdiction_name, status, legal_landscape, cultural_intelligence, regulatory_notes, created_at")
    .eq("id", params.briefId)
    .maybeSingle();

  if (briefError || !brief) {
    return NextResponse.json({ error: "Brief not found" }, { status: 404 });
  }

  // Verify the requesting lawyer is on the matter team
  const { data: membership, error: membershipError } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", brief.matter_id)
    .eq("lawyer_id", lawyer.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Strip internal field from response
  const { matter_id: _omit, ...responseBody } = brief;

  return NextResponse.json(responseBody, {
    headers: {
      // Cache ready briefs for 1 hour; always fetch live for generating/error states
      "Cache-Control":
        brief.status === "ready" ? "public, max-age=3600" : "no-store",
    },
  });
}
