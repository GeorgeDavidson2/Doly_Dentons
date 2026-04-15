import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const patchLawyerSchema = z.object({
  bio:       z.string().max(2000).optional(),
  title:     z.string().max(100).optional(),
  full_name: z.string().min(1).max(200).optional(),
  languages: z.array(z.string().max(50)).max(20).optional(),
  jurisdictions: z.array(z.object({
    jurisdiction_code: z.string().min(2).max(10),
    jurisdiction_name: z.string().min(1).max(100),
    expertise_level:   z.number().int().min(1).max(5),
    matter_types:      z.array(z.string().max(50)).max(20),
    years_experience:  z.number().int().min(0).max(60),
  })).max(20).optional(),
  availability: z.array(z.object({
    day_of_week:      z.number().int().min(0).max(6),
    work_start_hour:  z.number().int().min(0).max(23),
    work_end_hour:    z.number().int().min(1).max(24),
  })).max(7).optional(),
});

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

  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchLawyerSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { bio, title, full_name, languages, jurisdictions, availability } = parsed.data;

  // Use service client — ownership already verified above
  const service = createServiceClient();

  const { error: updateError } = await service
    .from("lawyers")
    .update({ bio, title, full_name, languages })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }

  if (Array.isArray(jurisdictions)) {
    const { error: deleteJurError } = await service
      .from("lawyer_jurisdictions")
      .delete()
      .eq("lawyer_id", params.id);

    if (deleteJurError) {
      return NextResponse.json({ error: "Failed to update jurisdictions" }, { status: 500 });
    }

    if (jurisdictions.length > 0) {
      const { error: insertJurError } = await service
        .from("lawyer_jurisdictions")
        .insert(
          jurisdictions.map((j) => ({
            lawyer_id: params.id,
            jurisdiction_code: j.jurisdiction_code,
            jurisdiction_name: j.jurisdiction_name,
            expertise_level: j.expertise_level,
            matter_types: j.matter_types,
            years_experience: j.years_experience,
          }))
        );

      if (insertJurError) {
        return NextResponse.json({ error: "Failed to save jurisdictions" }, { status: 500 });
      }
    }
  }

  if (Array.isArray(availability)) {
    const { error: deleteAvailError } = await service
      .from("lawyer_availability")
      .delete()
      .eq("lawyer_id", params.id);

    if (deleteAvailError) {
      return NextResponse.json({ error: "Failed to update availability" }, { status: 500 });
    }

    if (availability.length > 0) {
      const { error: insertAvailError } = await service
        .from("lawyer_availability")
        .insert(
          availability.map((a) => ({
            lawyer_id: params.id,
            timezone: lawyer.timezone,
            day_of_week: a.day_of_week,
            work_start_hour: a.work_start_hour,
            work_end_hour: a.work_end_hour,
          }))
        );

      if (insertAvailError) {
        return NextResponse.json({ error: "Failed to save availability" }, { status: 500 });
      }
    }
  }

  // Regenerate embedding non-blocking — don't make the profile save wait for it
  void fetch(new URL(`/api/lawyers/${params.id}/embed`, req.url).toString(), {
    method: "POST",
    headers: { cookie: req.headers.get("cookie") ?? "" },
  }).catch((err) => {
    console.error("Failed to regenerate lawyer embedding", { lawyerId: params.id, err });
  });

  return NextResponse.json({ success: true });
}
