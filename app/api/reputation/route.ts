import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getBadge } from "@/lib/reputation/awards";

// GET /api/reputation?lawyer_id=xxx   — single lawyer events + badge
// GET /api/reputation                 — firm-wide leaderboard (top 20)
export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { searchParams } = new URL(request.url);
  const lawyerId = searchParams.get("lawyer_id");

  if (lawyerId) {
    // Single lawyer: recent events + score + badge
    const [lawyerResult, eventsResult] = await Promise.all([
      service
        .from("lawyers")
        .select("id, full_name, office_city, reputation_score, avatar_url")
        .eq("id", lawyerId)
        .single(),
      service
        .from("reputation_events")
        .select("id, event_type, points, description, matter_id, created_at")
        .eq("lawyer_id", lawyerId)
        .order("created_at", { ascending: false })
        .limit(50),
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
      lawyer: {
        ...lawyerResult.data,
        badge: getBadge(lawyerResult.data.reputation_score ?? 0),
      },
      events: eventsResult.data ?? [],
    });
  }

  // Leaderboard: top 20 lawyers by reputation_score
  const { data: leaderboard, error } = await service
    .from("lawyers")
    .select("id, full_name, office_city, office_country, reputation_score, avatar_url, matters_count")
    .order("reputation_score", { ascending: false })
    .order("full_name", { ascending: true })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const enriched = (leaderboard ?? []).map((l, idx) => ({
    ...l,
    rank: idx + 1,
    badge: getBadge(l.reputation_score ?? 0),
  }));

  return NextResponse.json({ leaderboard: enriched });
}
