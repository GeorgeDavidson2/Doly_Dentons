import { toZonedTime } from "date-fns-tz";
import { isWeekend, getHours } from "date-fns";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { awardPoints } from "@/lib/reputation/awards";
import type { Task, Lawyer, LawyerAvailability } from "@/types";

export interface RouteTaskResult {
  assigned_to: string; // lawyer id
  lawyer: Pick<Lawyer, "id" | "full_name" | "title" | "office_city" | "timezone">;
  available_now: boolean;
  next_available_at: string | null; // ISO string
  handoff_id: string;
}

type RoutingLawyer = Pick<Lawyer, "id" | "full_name" | "title" | "office_city" | "office_country" | "timezone" | "reputation_score">;

interface CandidateLawyer {
  lawyer: RoutingLawyer;
  jurisdictions: { jurisdiction_code: string; expertise_level: number }[];
  availability: LawyerAvailability[];
}

// Check if a lawyer is currently working in their local timezone
export function isLawyerAvailable(
  lawyer: Pick<Lawyer, "timezone">,
  availability: LawyerAvailability[],
  at: Date = new Date()
): boolean {
  const local = toZonedTime(at, lawyer.timezone);
  const hour = getHours(local);
  const dayOfWeek = local.getDay(); // 0=Sun, 6=Sat

  if (isWeekend(local)) return false;

  const window = availability.find((a) => a.day_of_week === dayOfWeek);
  if (!window) return false;

  return hour >= window.work_start_hour && hour < window.work_end_hour;
}

// Find when a lawyer next comes online (returns null if available now)
export function nextAvailableAt(
  lawyer: Pick<Lawyer, "timezone">,
  availability: LawyerAvailability[],
  from: Date = new Date()
): Date | null {
  if (isLawyerAvailable(lawyer, availability, from)) return null;

  // Search up to 7 days ahead
  for (let offsetMinutes = 30; offsetMinutes <= 7 * 24 * 60; offsetMinutes += 30) {
    const candidate = new Date(from.getTime() + offsetMinutes * 60 * 1000);
    if (isLawyerAvailable(lawyer, availability, candidate)) {
      // Snap to the start of that work window
      const local = toZonedTime(candidate, lawyer.timezone);
      const dayOfWeek = local.getDay();
      const window = availability.find((a) => a.day_of_week === dayOfWeek);
      if (window) {
        const snapped = toZonedTime(candidate, lawyer.timezone);
        snapped.setHours(window.work_start_hour, 0, 0, 0);
        return snapped;
      }
      return candidate;
    }
  }
  return null;
}

// Core routing function — assigns a task to the best available lawyer
export async function routeTask(taskId: string): Promise<RouteTaskResult> {
  const supabase = createServiceClient();

  // 1. Fetch the task
  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (taskError || !task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const typedTask = task as Task;

  // 2. Get accepted team lawyers with their jurisdiction expertise in one query
  const { data: teamMembers, error: teamError } = await supabase
    .from("matter_team")
    .select(`
      lawyer_id,
      lawyers (
        id, full_name, title, office_city, office_country, timezone,
        reputation_score,
        lawyer_jurisdictions (jurisdiction_code, expertise_level)
      )
    `)
    .eq("matter_id", typedTask.matter_id)
    .eq("status", "accepted");

  if (teamError || !teamMembers?.length) {
    throw new Error("No team members found for this matter");
  }

  // 3. Filter to lawyers with the required jurisdiction
  const normalizedJurisdiction = typedTask.required_jurisdiction?.toUpperCase() ?? null;
  const candidates: CandidateLawyer[] = [];

  for (const member of teamMembers as any[]) {
    const lawyer = member.lawyers as RoutingLawyer;
    if (!lawyer) continue;
    const jurisdictions: { jurisdiction_code: string; expertise_level: number }[] =
      member.lawyers?.lawyer_jurisdictions ?? [];

    if (normalizedJurisdiction) {
      const hasJurisdiction = jurisdictions.some(
        (j) => j.jurisdiction_code.toUpperCase() === normalizedJurisdiction
      );
      if (!hasJurisdiction) continue;
    }

    candidates.push({ lawyer, jurisdictions, availability: [] });
  }

  if (!candidates.length) {
    throw new Error(
      `No qualified lawyers found for jurisdiction: ${normalizedJurisdiction ?? "any"}`
    );
  }

  // 4. Batch-fetch availability for all candidates in one query
  const { data: allAvailability, error: availabilityError } = await supabase
    .from("lawyer_availability")
    .select("*")
    .in("lawyer_id", candidates.map((c) => c.lawyer.id));

  if (availabilityError) {
    throw new Error(`Failed to load lawyer availability: ${availabilityError.message}`);
  }

  const availabilityByLawyer = new Map<string, LawyerAvailability[]>();
  for (const a of (allAvailability ?? []) as LawyerAvailability[]) {
    if (!availabilityByLawyer.has(a.lawyer_id)) {
      availabilityByLawyer.set(a.lawyer_id, []);
    }
    availabilityByLawyer.get(a.lawyer_id)!.push(a);
  }

  for (const c of candidates) {
    c.availability = availabilityByLawyer.get(c.lawyer.id) ?? [];
  }

  // 5. Score candidates
  const now = new Date();

  const scored = candidates.map((c) => {
    const available = isLawyerAvailable(c.lawyer, c.availability, now);
    const next = available ? null : nextAvailableAt(c.lawyer, c.availability, now);

    // Expertise level in the required jurisdiction
    const jurisdictionExpertise = normalizedJurisdiction
      ? (c.jurisdictions.find(
          (j) => j.jurisdiction_code.toUpperCase() === normalizedJurisdiction
        )?.expertise_level ?? 0)
      : 3;

    // Score: available now gets huge boost, then expertise, then reputation
    const score =
      (available ? 1000 : 0) +
      jurisdictionExpertise * 10 +
      Math.floor(c.lawyer.reputation_score / 100);

    return { ...c, available, next, score };
  });

  // Sort: highest score first
  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0];

  // 6. Assign the task
  const { error: updateError } = await supabase
    .from("tasks")
    .update({
      assigned_to: winner.lawyer.id,
      status: "in_progress",
      timezone_window: winner.lawyer.timezone,
    })
    .eq("id", taskId);

  if (updateError) throw new Error(`Failed to assign task: ${updateError.message}`);

  // 7. Create handoff record
  const contextSnapshot = [
    `Task: ${typedTask.title}`,
    typedTask.description ? `Description: ${typedTask.description}` : null,
    typedTask.required_jurisdiction
      ? `Required jurisdiction: ${typedTask.required_jurisdiction}`
      : null,
    typedTask.required_expertise?.length
      ? `Required expertise: ${typedTask.required_expertise.join(", ")}`
      : null,
    `Assigned to: ${winner.lawyer.full_name} (${winner.lawyer.office_city}, ${winner.lawyer.timezone})`,
    winner.available
      ? "Status: Available now"
      : `Status: Next online at ${winner.next?.toISOString() ?? "unknown"}`,
  ]
    .filter(Boolean)
    .join("\n");

  const { data: handoff, error: handoffError } = await supabase
    .from("task_handoffs")
    .insert({
      task_id: taskId,
      from_lawyer_id: typedTask.assigned_to ?? null,
      to_lawyer_id: winner.lawyer.id,
      from_timezone: typedTask.timezone_window ?? null,
      to_timezone: winner.lawyer.timezone,
      context_snapshot: contextSnapshot,
      routed_by: "flow_engine",
    })
    .select("id")
    .single();

  if (handoffError || !handoff) {
    throw new Error(`Failed to create handoff: ${handoffError?.message}`);
  }

  // 8. Award reputation points to receiving lawyer.
  // Title omitted — reputation_events.description is publicly readable via RLS,
  // so we rely on the generic defaultDescription. Task linkage stays via matter_id.
  await awardPoints({
    lawyer_id: winner.lawyer.id,
    event_type: "handoff_completed",
    matter_id: typedTask.matter_id,
  });

  // 9. Invalidate cached server pages that reflect task / activity counts
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/matters/${typedTask.matter_id}/flow`);

  return {
    assigned_to: winner.lawyer.id,
    lawyer: {
      id: winner.lawyer.id,
      full_name: winner.lawyer.full_name,
      title: winner.lawyer.title,
      office_city: winner.lawyer.office_city,
      timezone: winner.lawyer.timezone,
    },
    available_now: winner.available,
    next_available_at: winner.next?.toISOString() ?? null,
    handoff_id: handoff.id,
  };
}
