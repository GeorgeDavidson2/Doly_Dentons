import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const createTaskSchema = z.object({
  matter_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  required_jurisdiction: z.string().optional().nullable(),
  required_expertise: z.array(z.string()).optional().default([]),
  due_date: z.string().optional().nullable(),
});

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

async function isOnTeam(matterId: string, lawyerId: string) {
  const service = createServiceClient();
  const { data } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", matterId)
    .eq("lawyer_id", lawyerId)
    .eq("status", "accepted")
    .maybeSingle();
  return !!data;
}

// GET /api/flow/tasks?matter_id=xxx
export async function GET(request: Request) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const matterId = searchParams.get("matter_id");
  if (!matterId) return NextResponse.json({ error: "matter_id required" }, { status: 400 });
  if (!UUID_RE.test(matterId)) {
    return NextResponse.json({ error: "matter_id must be a UUID" }, { status: 400 });
  }

  if (!(await isOnTeam(matterId, lawyer.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("tasks")
    .select(`
      *,
      assignee:lawyers!tasks_assigned_to_fkey (
        id, full_name, title, office_city, office_country, timezone, avatar_url
      ),
      handoff_from_lawyer:lawyers!tasks_handoff_from_fkey (
        id, full_name, office_city, timezone
      )
    `)
    .eq("matter_id", matterId)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/flow/tasks
export async function POST(request: Request) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!(await isOnTeam(parsed.data.matter_id, lawyer.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("tasks")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidatePath("/dashboard");
  revalidatePath(`/matters/${parsed.data.matter_id}/flow`);

  return NextResponse.json(data, { status: 201 });
}
