import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const createTaskSchema = z.object({
  matter_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional().default(""),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  required_jurisdiction: z.string().optional().nullable(),
  required_expertise: z.array(z.string()).optional().default([]),
  due_date: z.string().optional().nullable(),
});

// GET /api/flow/tasks?matter_id=xxx
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const matterId = searchParams.get("matter_id");
  if (!matterId) return NextResponse.json({ error: "matter_id required" }, { status: 400 });

  const { data, error } = await supabase
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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert(parsed.data)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
