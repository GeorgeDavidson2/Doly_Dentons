import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  handoff_context: z.string().nullable().optional(),
});

async function getAuthenticatedLawyer() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const service = createServiceClient();
  const { data: lawyer } = await service
    .from("lawyers")
    .select("id, email")
    .eq("email", user.email)
    .maybeSingle();
  return lawyer;
}

async function getTaskIfOnTeam(taskId: string, lawyerId: string) {
  const service = createServiceClient();
  const { data: task } = await service
    .from("tasks")
    .select("id, matter_id")
    .eq("id", taskId)
    .maybeSingle();
  if (!task) return null;

  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", task.matter_id)
    .eq("lawyer_id", lawyerId)
    .eq("status", "accepted")
    .maybeSingle();
  return membership ? task : null;
}

// PATCH /api/flow/tasks/[id]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = updateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  if (!(await getTaskIfOnTeam(params.id, lawyer.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("tasks")
    .update(parsed.data)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// GET /api/flow/tasks/[id]
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!(await getTaskIfOnTeam(params.id, lawyer.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("tasks")
    .select(`
      *,
      assignee:lawyers!tasks_assigned_to_fkey (
        id, full_name, title, office_city, office_country, timezone, avatar_url
      )
    `)
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
