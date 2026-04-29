import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const addMemberSchema = z.object({
  lawyer_id: z.string().uuid(),
  role: z.enum(["collaborator", "reviewer"]).default("collaborator"),
});

const respondSchema = z.object({
  action: z.enum(["accept", "decline"]),
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

  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", params.id)
    .eq("lawyer_id", lawyer.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: team, error } = await service
    .from("matter_team")
    .select(
      "id, role, status, match_score, joined_at, lawyer:lawyers(id, full_name, title, office_city, timezone, reputation_score)"
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

  if (lawyer_id === lawyer.id) {
    return NextResponse.json(
      { error: "Cannot invite yourself to a matter" },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", params.id)
    .eq("lawyer_id", lawyer.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: invitee, error: inviteeError } = await service
    .from("lawyers")
    .select("id, reputation_score")
    .eq("id", lawyer_id)
    .maybeSingle();

  if (inviteeError || !invitee) {
    return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
  }

  const { data: existing } = await service
    .from("matter_team")
    .select("id, status")
    .eq("matter_id", params.id)
    .eq("lawyer_id", lawyer_id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Lawyer has already been invited to this matter" },
      { status: 409 }
    );
  }

  // Create invite as pending — reputation awarded only on acceptance
  const { data: newMember, error: insertError } = await service
    .from("matter_team")
    .insert({ matter_id: params.id, lawyer_id, role, match_score: null, status: "pending" })
    .select("id, matter_id, lawyer_id, role, status, match_score, joined_at")
    .single();

  if (insertError || !newMember) {
    return NextResponse.json({ error: "Failed to add team member" }, { status: 500 });
  }

  // Award the inviter's points immediately for sending the invite
  const { data: inviter } = await service
    .from("lawyers")
    .select("reputation_score")
    .eq("id", lawyer.id)
    .single();

  if (inviter) {
    await Promise.all([
      service.from("reputation_events").insert({
        lawyer_id: lawyer.id,
        event_type: "match_accepted",
        points: INVITER_POINTS,
        matter_id: params.id,
        description: "Invited a lawyer to the matter team",
      }),
      service
        .from("lawyers")
        .update({ reputation_score: inviter.reputation_score + INVITER_POINTS })
        .eq("id", lawyer.id),
    ]);
  }

  revalidatePath("/dashboard");
  revalidatePath("/matters");
  // "layout" invalidates the entire matter subtree (overview/context/connect/flow)
  revalidatePath(`/matters/${params.id}`, "layout");

  return NextResponse.json(newMember, { status: 201 });
}

// Accept or decline a pending invite for the current user
export async function PATCH(
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

  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { action } = parsed.data;
  const service = createServiceClient();

  // Find the pending invite for this lawyer on this matter
  const { data: invite } = await service
    .from("matter_team")
    .select("id, lawyer_id")
    .eq("matter_id", params.id)
    .eq("lawyer_id", lawyer.id)
    .eq("status", "pending")
    .maybeSingle();

  if (!invite) {
    return NextResponse.json({ error: "No pending invite found" }, { status: 404 });
  }

  if (action === "decline") {
    const { error: deleteError } = await service
      .from("matter_team")
      .delete()
      .eq("id", invite.id);
    if (deleteError) {
      return NextResponse.json({ error: "Failed to decline invite" }, { status: 500 });
    }
    revalidatePath("/dashboard");
    revalidatePath("/matters");
    return NextResponse.json({ status: "declined" });
  }

  // Accept: flip status and award invitee reputation
  const { error: updateError } = await service
    .from("matter_team")
    .update({ status: "accepted" })
    .eq("id", invite.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
  }

  const { data: invitee } = await service
    .from("lawyers")
    .select("reputation_score")
    .eq("id", lawyer.id)
    .single();

  if (invitee) {
    await Promise.all([
      service.from("reputation_events").insert({
        lawyer_id: lawyer.id,
        event_type: "matter_joined",
        points: INVITEE_POINTS,
        matter_id: params.id,
        description: "Joined matter team",
      }),
      service
        .from("lawyers")
        .update({ reputation_score: invitee.reputation_score + INVITEE_POINTS })
        .eq("id", lawyer.id),
    ]);
  }

  revalidatePath("/dashboard");
  revalidatePath("/matters");
  revalidatePath(`/matters/${params.id}`, "layout");

  return NextResponse.json({ status: "accepted" });
}
