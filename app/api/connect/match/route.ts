import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { matchLawyersForMatter, type MatchResult } from "@/lib/connect/matcher";

const schema = z.object({
  matter_id: z.string().uuid(),
});

// Module-level cache: matter_id → { results, expiresAt }
// Persists across requests within the same serverless instance (~10 min TTL).
const matchCache = new Map<string, { results: EnrichedMatch[]; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export type EnrichedMatch = MatchResult & {
  expertise_levels: Record<string, number>; // jurisdiction_code → expertise_level
};

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

export async function POST(req: Request) {
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

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { matter_id } = parsed.data;
  const service = createServiceClient();

  // Verify matter exists and current user is on the team
  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", matter_id)
    .eq("lawyer_id", lawyer.id)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Return cached results if still fresh
  const cached = matchCache.get(matter_id);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.results);
  }

  // Run the full matching pipeline
  let matches: MatchResult[];
  try {
    matches = await matchLawyersForMatter(matter_id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Matching failed" },
      { status: 500 }
    );
  }

  // Exclude the current user from results
  const filtered = matches.filter((m) => m.id !== lawyer.id);

  if (filtered.length === 0) {
    matchCache.set(matter_id, { results: [], expiresAt: Date.now() + CACHE_TTL_MS });
    return NextResponse.json([]);
  }

  // Enrich with expertise levels for each lawyer's matched jurisdictions (single batch query)
  const lawyerIds = filtered.map((m) => m.id);
  const jurisdictionCodes = Array.from(
    new Set(filtered.flatMap((m) => m.matched_jurisdictions))
  );

  const { data: expertiseRows } = await service
    .from("lawyer_jurisdictions")
    .select("lawyer_id, jurisdiction_code, expertise_level")
    .in("lawyer_id", lawyerIds)
    .in("jurisdiction_code", jurisdictionCodes);

  // Build lookup: lawyer_id → jurisdiction_code → expertise_level
  const expertiseLookup = new Map<string, Record<string, number>>();
  for (const row of expertiseRows ?? []) {
    if (!expertiseLookup.has(row.lawyer_id)) {
      expertiseLookup.set(row.lawyer_id, {});
    }
    expertiseLookup.get(row.lawyer_id)![row.jurisdiction_code] = row.expertise_level;
  }

  const enriched: EnrichedMatch[] = filtered.map((m) => ({
    ...m,
    expertise_levels: expertiseLookup.get(m.id) ?? {},
  }));

  matchCache.set(matter_id, { results: enriched, expiresAt: Date.now() + CACHE_TTL_MS });

  return NextResponse.json(enriched);
}
