import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { generateBrief } from "@/lib/ai/groq";

const schema = z.object({
  matter_id: z.string().uuid(),
});

async function getAuthenticatedLawyer() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const service = createServiceClient();
  const { data: lawyer } = await service
    .from("lawyers")
    .select("id, email")
    .eq("email", user.email)
    .single();

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
  const { data: membership } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", matter_id)
    .eq("lawyer_id", lawyer.id)
    .single();

  if (!membership) {
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
  const { data: existing } = await service
    .from("context_briefs")
    .select("id, jurisdiction_code, status")
    .eq("matter_id", matter_id);

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
        await service
          .from("context_briefs")
          .update({ status: "generating", legal_landscape: null, cultural_intelligence: null, regulatory_notes: null })
          .in("id", updateIds);
      })()
    );
  }

  if (toInsert.length > 0) {
    prepOps.push(
      (async () => {
        await service.from("context_briefs").insert(
          toInsert.map((j) => ({
            matter_id,
            jurisdiction_code: j.jurisdiction_code,
            jurisdiction_name: j.jurisdiction_name,
            status: "generating",
          }))
        );
      })()
    );
  }

  await Promise.all(prepOps);

  // Re-fetch brief IDs so we can update by id after generation
  const { data: freshStubs } = await service
    .from("context_briefs")
    .select("id, jurisdiction_code")
    .eq("matter_id", matter_id)
    .in(
      "jurisdiction_code",
      toGenerate.map((j) => j.jurisdiction_code)
    );

  const briefIdByCode = new Map(
    (freshStubs ?? []).map((b) => [b.jurisdiction_code, b.id])
  );

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
        await service
          .from("context_briefs")
          .update({
            status: "ready",
            legal_landscape: result.value.content.legal_landscape,
            cultural_intelligence: result.value.content.cultural_intelligence,
            regulatory_notes: result.value.content.regulatory_notes,
          })
          .eq("id", briefId);
      } else {
        await service
          .from("context_briefs")
          .update({ status: "error" })
          .eq("id", briefId);
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

  return NextResponse.json({ briefs: briefs ?? [] });
}
