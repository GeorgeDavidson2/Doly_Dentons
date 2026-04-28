import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateBrief } from "@/lib/ai/groq";
import { awardPoints } from "@/lib/reputation/awards";

const schema = z.object({
  matter_id: z.string().uuid(),
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

  // Verify team membership
  const { data: membership, error: membershipError } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", matter_id)
    .eq("lawyer_id", lawyer.id)
    .eq("status", "accepted")
    .maybeSingle();

  if (membershipError || !membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch matter with jurisdictions
  const { data: matter, error: matterError } = await service
    .from("matters")
    .select("id, matter_type, description, matter_jurisdictions(jurisdiction_code, jurisdiction_name)")
    .eq("id", matter_id)
    .single();

  if (matterError || !matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const jurisdictions = matter.matter_jurisdictions as {
    jurisdiction_code: string;
    jurisdiction_name: string;
  }[];

  if (jurisdictions.length === 0) {
    return NextResponse.json({ briefs: [] });
  }

  // Fetch existing briefs to determine what needs generation
  const { data: existing, error: existingError } = await service
    .from("context_briefs")
    .select("id, jurisdiction_code, status")
    .eq("matter_id", matter_id);

  if (existingError) {
    return NextResponse.json({ error: "Failed to check existing briefs" }, { status: 500 });
  }

  const existingByCode = new Map(
    (existing ?? []).map((b) => [b.jurisdiction_code, b])
  );

  // Skip jurisdictions already ready or currently generating
  const toGenerate = jurisdictions.filter((j) => {
    const brief = existingByCode.get(j.jurisdiction_code);
    return !brief || brief.status === "error";
  });

  if (toGenerate.length === 0) {
    // Nothing to do — return current briefs
    const { data: briefs } = await service
      .from("context_briefs")
      .select("id, jurisdiction_code, jurisdiction_name, status, legal_landscape, cultural_intelligence, regulatory_notes, created_at")
      .eq("matter_id", matter_id)
      .order("jurisdiction_code");

    return NextResponse.json({ briefs: briefs ?? [] });
  }

  // Mark each as generating: update existing "error" rows, insert new ones
  const toUpdate = toGenerate.filter((j) => existingByCode.has(j.jurisdiction_code));
  const toInsert = toGenerate.filter((j) => !existingByCode.has(j.jurisdiction_code));

  const prepOps: Promise<void>[] = [];

  if (toUpdate.length > 0) {
    const updateIds = toUpdate
      .map((j) => existingByCode.get(j.jurisdiction_code)?.id)
      .filter(Boolean) as string[];

    prepOps.push(
      (async () => {
        const { error } = await service
          .from("context_briefs")
          .update({ status: "generating", legal_landscape: null, cultural_intelligence: null, regulatory_notes: null })
          .in("id", updateIds);
        if (error) throw new Error(`Failed to reset errored briefs: ${error.message}`);
      })()
    );
  }

  if (toInsert.length > 0) {
    prepOps.push(
      (async () => {
        const { error } = await service.from("context_briefs").insert(
          toInsert.map((j) => ({
            matter_id,
            jurisdiction_code: j.jurisdiction_code,
            jurisdiction_name: j.jurisdiction_name,
            status: "generating",
          }))
        );
        if (error) throw new Error(`Failed to create brief stubs: ${error.message}`);
      })()
    );
  }

  try {
    await Promise.all(prepOps);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to initialise briefs" },
      { status: 500 }
    );
  }

  // Re-fetch brief IDs so we can update by id after generation
  const { data: freshStubs, error: stubsError } = await service
    .from("context_briefs")
    .select("id, jurisdiction_code")
    .eq("matter_id", matter_id)
    .in(
      "jurisdiction_code",
      toGenerate.map((j) => j.jurisdiction_code)
    );

  if (stubsError) {
    return NextResponse.json({ error: "Failed to retrieve brief IDs" }, { status: 500 });
  }

  const briefIdByCode = new Map(
    (freshStubs ?? []).map((b) => [b.jurisdiction_code, b.id])
  );

  const missingIds = toGenerate.filter((j) => !briefIdByCode.has(j.jurisdiction_code));
  if (missingIds.length > 0) {
    return NextResponse.json({ error: "Brief IDs missing after insert" }, { status: 500 });
  }

  // Run all Groq calls in parallel
  const genResults = await Promise.allSettled(
    toGenerate.map((j) =>
      generateBrief({
        matterType: matter.matter_type,
        jurisdictionCode: j.jurisdiction_code,
        jurisdictionName: j.jurisdiction_name,
        description: matter.description ?? undefined,
      }).then((content) => ({ jurisdiction_code: j.jurisdiction_code, content }))
    )
  );

  // Persist results — parallel updates
  await Promise.allSettled(
    genResults.map(async (result, i) => {
      const code = toGenerate[i].jurisdiction_code;
      const briefId = briefIdByCode.get(code);
      if (!briefId) return;

      if (result.status === "fulfilled") {
        const { error } = await service
          .from("context_briefs")
          .update({
            status: "ready",
            legal_landscape: result.value.content.legal_landscape,
            cultural_intelligence: result.value.content.cultural_intelligence,
            regulatory_notes: result.value.content.regulatory_notes,
          })
          .eq("id", briefId);
        if (error) throw new Error(`DB update failed for brief ${briefId}: ${error.message}`);
      } else {
        const { error } = await service
          .from("context_briefs")
          .update({ status: "error" })
          .eq("id", briefId);
        if (error) throw new Error(`DB error-mark failed for brief ${briefId}: ${error.message}`);
      }
    })
  );

  // Return all briefs for this matter
  const { data: briefs, error: briefsError } = await service
    .from("context_briefs")
    .select("id, jurisdiction_code, jurisdiction_name, status, legal_landscape, cultural_intelligence, regulatory_notes, created_at")
    .eq("matter_id", matter_id)
    .order("jurisdiction_code");

  if (briefsError) {
    return NextResponse.json({ error: "Failed to load briefs" }, { status: 500 });
  }

  // Award 50 points to the matter creator if all briefs are now ready.
  // Guard: check for an existing brief_generated event for this matter
  // so concurrent or repeated calls don't double-award.
  const allReady = (briefs ?? []).every((b) => b.status === "ready");
  if (allReady && briefs && briefs.length > 0) {
    const { data: matterMeta } = await service
      .from("matters")
      .select("lead_lawyer_id")
      .eq("id", matter_id)
      .single();

    if (matterMeta?.lead_lawyer_id) {
      const { data: alreadyAwarded } = await service
        .from("reputation_events")
        .select("id")
        .eq("lawyer_id", matterMeta.lead_lawyer_id)
        .eq("event_type", "brief_generated")
        .eq("matter_id", matter_id)
        .maybeSingle();

      if (!alreadyAwarded) {
        await awardPoints({
          lawyer_id: matterMeta.lead_lawyer_id,
          event_type: "brief_generated",
          matter_id,
          description: `All ${briefs.length} jurisdiction briefs generated`,
        });
      }
    }
  }

  return NextResponse.json({ briefs: briefs ?? [] });
}
