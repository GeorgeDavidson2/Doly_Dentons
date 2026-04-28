import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getJurisdictionName } from "@/lib/jurisdictions";

const createMatterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  client_name: z.string().min(1, "Client name is required"),
  matter_type: z.string().min(1, "Matter type is required"),
  deadline: z
    .string()
    .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid deadline date" })
    .optional(),
  jurisdiction_codes: z
    .array(z.string().min(2).max(10).transform((s) => s.trim().toUpperCase()))
    .min(1, "At least one jurisdiction is required")
    .transform((arr) => Array.from(new Set(arr))),
});

async function getAuthenticatedLawyer() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  const parsed = createMatterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { title, description, client_name, matter_type, deadline, jurisdiction_codes } = parsed.data;
  const service = createServiceClient();

  const { data: matter, error: matterError } = await service
    .from("matters")
    .insert({
      title,
      description,
      client_name,
      matter_type,
      lead_lawyer_id: lawyer.id,
      deadline: deadline ?? null,
    })
    .select("id, title, client_name, matter_type, status, deadline, created_at")
    .single();

  if (matterError || !matter) {
    return NextResponse.json({ error: "Failed to create matter" }, { status: 500 });
  }

  const { error: jurisdictionError } = await service
    .from("matter_jurisdictions")
    .insert(
      jurisdiction_codes.map((code) => ({
        matter_id: matter.id,
        jurisdiction_code: code,
        jurisdiction_name: getJurisdictionName(code),
      }))
    );

  if (jurisdictionError) {
    return NextResponse.json({ error: "Failed to save jurisdictions" }, { status: 500 });
  }

  const { error: teamError } = await service
    .from("matter_team")
    .insert({ matter_id: matter.id, lawyer_id: lawyer.id, role: "lead" });

  if (teamError) {
    return NextResponse.json({ error: "Failed to add creator to team" }, { status: 500 });
  }

  // Context briefs are generated on demand from the Context tab UI via
  // POST /api/context/generate (issue #15). Not triggered here because
  // fire-and-forget is unreliable on Vercel Hobby (no waitUntil).

  // Warm the Connect match cache non-blocking so the first Connect tab load is fast.
  void fetch(new URL("/api/connect/match", req.url).toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: req.headers.get("cookie") ?? "" },
    body: JSON.stringify({ matter_id: matter.id }),
  }).catch(() => {
    // Best-effort — failure is non-critical
  });

  return NextResponse.json(matter, { status: 201 });
}

export async function GET(req: Request) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const service = createServiceClient();

  const { data: teamRows, error: teamError } = await service
    .from("matter_team")
    .select("matter_id")
    .eq("lawyer_id", lawyer.id)
    .eq("status", "accepted");

  if (teamError) {
    return NextResponse.json({ error: "Failed to load matters" }, { status: 500 });
  }

  const matterIds = (teamRows ?? []).map((r) => r.matter_id);
  if (matterIds.length === 0) {
    return NextResponse.json([]);
  }

  let query = service
    .from("matters")
    .select(`
      id, title, client_name, matter_type, status, deadline, created_at,
      matter_jurisdictions(jurisdiction_code, jurisdiction_name),
      matter_team(lawyer_id)
    `)
    .in("id", matterIds)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data: matters, error: mattersError } = await query;

  if (mattersError) {
    return NextResponse.json({ error: "Failed to load matters" }, { status: 500 });
  }

  return NextResponse.json(matters ?? []);
}
