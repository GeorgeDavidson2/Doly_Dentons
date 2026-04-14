import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const addMemberSchema = z.object({
  lawyer_id: z.string().uuid(),
  role: z.enum(["collaborator", "reviewer"]).default("collaborator"),
  match_score: z.number().min(0).max(1).optional(),
});

const INVITER_POINTS = 20;
const INVITEE_POINTS = 30;

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
  { params }: { params: { id: string } }
) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // Verify membership
  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", params.id)
    .eq("lawyer_id", lawyer.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: team, error } = await service
    .from("matter_team")
    .select(
      "id, role, match_score, joined_at, lawyer:lawyers(id, full_name, title, office_city, reputation_score)"
    )
    .eq("matter_id", params.id)
    .order("joined_at");

  if (error) {
    return NextResponse.json({ error: "Failed to load team" }, { status: 500 });
  }

  return NextResponse.json(team ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { lawyer_id, role, match_score } = parsed.data;

  // Cannot invite yourself
  if (lawyer_id === lawyer.id) {
    return NextResponse.json(
      { error: "Cannot invite yourself to a matter" },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  // Verify current user is on the team
  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", params.id)
    .eq("lawyer_id", lawyer.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Verify invited lawyer exists
  const { data: invitee, error: inviteeError } = await service
    .from("lawyers")
    .select("id, reputation_score")
    .eq("id", lawyer_id)
    .maybeSingle();

  if (inviteeError || !invitee) {
    return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
  }

  // Check for duplicate
  const { data: existing } = await service
    .from("matter_team")
    .select("id")
    .eq("matter_id", params.id)
    .eq("lawyer_id", lawyer_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Lawyer is already on this matter's team" },
      { status: 409 }
    );
  }

  // Add to team
  const { data: newMember, error: insertError } = await service
    .from("matter_team")
    .insert({
      matter_id: params.id,
      lawyer_id,
      role,
      match_score: match_score ?? null,
    })
    .select("id, matter_id, lawyer_id, role, match_score, joined_at")
    .single();

  if (insertError || !newMember) {
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }

  // Fetch inviter's current score for the increment
  const { data: inviter } = await service
    .from("lawyers")
    .select("reputation_score")
    .eq("id", lawyer.id)
    .single();

  // Award reputation — all four ops in parallel
  await Promise.allSettled([
    service.from("reputation_events").insert({
      lawyer_id: lawyer.id,
      event_type: "match_accepted",
      points: INVITER_POINTS,
      matter_id: params.id,
      description: `Invited a lawyer to the matter team`,
    }),
    service.from("reputation_events").insert({
      lawyer_id,
      event_type: "matter_joined",
      points: INVITEE_POINTS,
      matter_id: params.id,
      description: `Joined matter team`,
    }),
    service
      .from("lawyers")
      .update({ reputation_score: (inviter?.reputation_score ?? 0) + INVITER_POINTS })
      .eq("id", lawyer.id),
    service
      .from("lawyers")
      .update({ reputation_score: invitee.reputation_score + INVITEE_POINTS })
      .eq("id", lawyer_id),
  ]);

  return NextResponse.json(newMember, { status: 201 });
}
