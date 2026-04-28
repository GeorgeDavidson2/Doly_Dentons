import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export interface PendingInvite {
  type: "invite";
  id: string; // matter_team.id
  matter_id: string;
  matter_title: string;
  role: string;
  invited_at: string;
}

export interface ActivityEvent {
  type: "event";
  id: string;
  event_type: string;
  points: number;
  description: string;
  matter_id: string | null;
  matter_title: string | null;
  created_at: string;
}

export type NotificationItem = PendingInvite | ActivityEvent;

export async function GET() {
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

  // Pending invites for this lawyer
  const { data: inviteRows } = await service
    .from("matter_team")
    .select("id, matter_id, role, joined_at, matters(title)")
    .eq("lawyer_id", lawyer.id)
    .eq("status", "pending")
    .order("joined_at", { ascending: false });

  const invites: PendingInvite[] = (inviteRows ?? []).map((row) => ({
    type: "invite" as const,
    id: row.id,
    matter_id: row.matter_id,
    matter_title: (row.matters as unknown as { title: string } | null)?.title ?? "Unknown matter",
    role: row.role,
    invited_at: row.joined_at,
  }));

  // Past reputation events
  const { data: eventRows } = await service
    .from("reputation_events")
    .select("id, event_type, points, description, matter_id, created_at, matters(title)")
    .eq("lawyer_id", lawyer.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const events: ActivityEvent[] = (eventRows ?? []).map((row) => ({
    type: "event" as const,
    id: row.id,
    event_type: row.event_type,
    points: row.points,
    description: row.description,
    matter_id: row.matter_id ?? null,
    matter_title: (row.matters as unknown as { title: string } | null)?.title ?? null,
    created_at: row.created_at,
  }));

  return NextResponse.json({ invites, events });
}
