import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { routeTask } from "@/lib/flow/engine";
import { z } from "zod";

const schema = z.object({
  task_id: z.string().uuid(),
});

// POST /api/flow/route-task
// Runs the Flow engine on a single task — assigns it to the best available lawyer
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify caller is on the task's matter team
  const service = createServiceClient();
  const { data: lawyer } = await service
    .from("lawyers")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();
  if (!lawyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: task } = await service
    .from("tasks")
    .select("matter_id")
    .eq("id", parsed.data.task_id)
    .maybeSingle();
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", task.matter_id)
    .eq("lawyer_id", lawyer.id)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const result = await routeTask(parsed.data.task_id);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Routing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
