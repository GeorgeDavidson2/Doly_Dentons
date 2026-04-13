import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [lawyerResult, jurisdictionsResult, eventsResult] = await Promise.all([
    supabase
      .from("lawyers")
      .select("id, full_name, title, office_city, office_country, timezone, languages, bio, avatar_url, reputation_score, matters_count, contributions")
      .eq("id", params.id)
      .single(),
    supabase
      .from("lawyer_jurisdictions")
      .select("id, jurisdiction_code, jurisdiction_name, expertise_level, matter_types, years_experience")
      .eq("lawyer_id", params.id)
      .order("expertise_level", { ascending: false }),
    supabase
      .from("reputation_events")
      .select("id, event_type, points, description, created_at")
      .eq("lawyer_id", params.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (lawyerResult.error || !lawyerResult.data) {
    return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
  }

  if (jurisdictionsResult.error) {
    return NextResponse.json({ error: "Failed to load jurisdictions" }, { status: 500 });
  }

  if (eventsResult.error) {
    return NextResponse.json({ error: "Failed to load reputation events" }, { status: 500 });
  }

  return NextResponse.json({
    lawyer: lawyerResult.data,
    jurisdictions: jurisdictionsResult.data,
    reputation_events: eventsResult.data,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Ownership check by email — seed data IDs don't match auth UIDs
  const { data: lawyer } = await supabase
    .from("lawyers")
    .select("id, email, timezone")
    .eq("id", params.id)
    .single();

  if (!lawyer || lawyer.email !== user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { bio, title, full_name, languages, jurisdictions, availability } = body;

  // Use service client — ownership already verified above
  const service = createServiceClient();

  await service
    .from("lawyers")
    .update({ bio, title, full_name, languages })
    .eq("id", params.id);

  if (Array.isArray(jurisdictions)) {
    await service.from("lawyer_jurisdictions").delete().eq("lawyer_id", params.id);
    if (jurisdictions.length > 0) {
      await service.from("lawyer_jurisdictions").insert(
        jurisdictions.map((j: Record<string, unknown>) => ({ ...j, lawyer_id: params.id }))
      );
    }
  }

  if (Array.isArray(availability)) {
    await service.from("lawyer_availability").delete().eq("lawyer_id", params.id);
    if (availability.length > 0) {
      await service.from("lawyer_availability").insert(
        availability.map((a: Record<string, unknown>) => ({
          ...a,
          lawyer_id: params.id,
          timezone: lawyer.timezone,
        }))
      );
    }
  }

  // TODO: Trigger embedding regeneration (issue #25)

  return NextResponse.json({ success: true });
}
