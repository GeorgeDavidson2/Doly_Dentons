import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const addMemberSchema = z.object({
  lawyer_id: z.string().uuid(),
  role: z.enum(["collaborator", "reviewer"]).default("collaborator"),
  // match_score is intentionally excluded from the client payload —
  // trusting the client to supply it would allow arbitrary score injection.
  // The score is stored as null here; issue #25 will populate it server-side.
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

  // Verify membership — 403 (not 404) so callers know the matter exists but they lack access
  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", params.id)
    .eq("lawyer_id", lawyer.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const { lawyer_id, role } = parsed.data;

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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  // Add to team (match_score stored as null — populated server-side in issue #25)
  const { data: newMember, error: insertError } = await service
    .from("matter_team")
    .insert({ matter_id: params.id, lawyer_id, role, match_score: null })
    .select("id, matter_id, lawyer_id, role, match_score, joined_at")
    .single();

  if (insertError || !newMember) {
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }

  // Fetch inviter's current score for the increment
  const { data: inviter, error: inviterError } = await service
    .from("lawyers")
    .select("reputation_score")
    .eq("id", lawyer.id)
    .single();

  if (inviterError || !inviter) {
    // Team member was added — log and continue rather than failing the request
    console.error("Failed to fetch inviter reputation score:", inviterError?.message);
    return NextResponse.json(newMember, { status: 201 });
  }

  // Award reputation — fail fast with Promise.all so errors surface
  const [evInviter, evInvitee, repInviter, repInvitee] = await Promise.all([
    service.from("reputation_events").insert({
      lawyer_id: lawyer.id,
      event_type: "match_accepted",
      points: INVITER_POINTS,
      matter_id: params.id,
      description: "Invited a lawyer to the matter team",
    }),
    service.from("reputation_events").insert({
      lawyer_id,
      event_type: "matter_joined",
      points: INVITEE_POINTS,
      matter_id: params.id,
      description: "Joined matter team",
    }),
    service
      .from("lawyers")
      .update({ reputation_score: inviter.reputation_score + INVITER_POINTS })
      .eq("id", lawyer.id),
    service
      .from("lawyers")
      .update({ reputation_score: invitee.reputation_score + INVITEE_POINTS })
      .eq("id", lawyer_id),
  ]);

  // Log any reputation errors — team membership is already committed
  const repErrors = [evInviter, evInvitee, repInviter, repInvitee]
    .map((r) => r.error)
    .filter(Boolean);
  if (repErrors.length > 0) {
    console.error("Reputation award errors:", repErrors.map((e) => e!.message));
  }

  return NextResponse.json(newMember, { status: 201 });
}
