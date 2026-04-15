import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const uuidSchema = z.string().uuid();

// GET /api/reputation?lawyer_id=xxx   — single lawyer events + badge
// GET /api/reputation                 — firm-wide leaderboard (top 20)
export async function GET(request: Request) {
  // Use the user-scoped client for all reads — RLS allows authenticated users
  // to read lawyers and reputation_events firm-wide (read-only).
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawLawyerId = searchParams.get("lawyer_id");

  if (rawLawyerId) {
    const parsed = uuidSchema.safeParse(rawLawyerId);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid lawyer_id — must be a UUID" }, { status: 400 });
    }
    const lawyerId = parsed.data;
    // Single lawyer: score + events from the last 30 days (matches chart window)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [lawyerResult, eventsResult] = await Promise.all([
      supabase
        .from("lawyers")
        .select("id, full_name, office_city, reputation_score, avatar_url")
        .eq("id", lawyerId)
        .single(),
      supabase
        .from("reputation_events")
        .select("id, event_type, points, description, matter_id, created_at")
        .eq("lawyer_id", lawyerId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (lawyerResult.error) {
      const status = lawyerResult.error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json({ error: lawyerResult.error.message }, { status });
    }
    if (!lawyerResult.data) {
      return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
    }
    if (eventsResult.error) {
      return NextResponse.json({ error: eventsResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      lawyer: lawyerResult.data,
      events: eventsResult.data ?? [],
    });
  }

  // Leaderboard: top 20 by reputation_score, stable secondary sort by full_name
  const { data: leaderboard, error } = await supabase
    .from("lawyers")
    .select("id, full_name, office_city, office_country, reputation_score, avatar_url, matters_count")
    .order("reputation_score", { ascending: false })
    .order("full_name", { ascending: true })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (leaderboard ?? []).map((l, idx) => ({
    ...l,
    rank: idx + 1,
  }));

  return NextResponse.json({ leaderboard: enriched });
}
