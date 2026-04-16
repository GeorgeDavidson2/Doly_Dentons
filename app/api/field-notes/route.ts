import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { awardPoints } from "@/lib/reputation/awards";

const JURISDICTIONS: Record<string, string> = {
  BR: "Brazil",
  CO: "Colombia",
  DE: "Germany",
  EU: "European Union",
  MX: "Mexico",
  US: "United States",
};

const createNoteSchema = z.object({
  jurisdiction_code: z.string().min(2).max(10).transform((s) => s.trim().toUpperCase()),
  title: z.string().min(1, "Title is required").max(200),
  content: z.string().min(1, "Content is required"),
  matter_type: z.string().optional().nullable(),
  visibility: z.enum(["firm", "private"]).default("firm"),
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

  if (error || !lawyer) return null;
  return lawyer;
}

// GET /api/field-notes?jurisdiction=CO&q=FDI
export async function GET(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const jurisdiction = searchParams.get("jurisdiction")?.trim().toUpperCase() || null;
  const q = searchParams.get("q")?.trim() || null;

  let query = supabase
    .from("field_notes")
    .select("id, jurisdiction_code, jurisdiction_name, title, content, matter_type, upvotes, created_at, author_id, author:lawyers(id, full_name, office_city)")
    .eq("visibility", "firm")
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  if (jurisdiction) query = query.eq("jurisdiction_code", jurisdiction);
  if (q) query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

// POST /api/field-notes — create note + award 40 pts to author
export async function POST(req: Request) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { jurisdiction_code, title, content, matter_type, visibility } = parsed.data;
  const jurisdiction_name = JURISDICTIONS[jurisdiction_code] ?? jurisdiction_code;

  const service = createServiceClient();
  const { data: note, error } = await service
    .from("field_notes")
    .insert({
      author_id: lawyer.id,
      jurisdiction_code,
      jurisdiction_name,
      title,
      content,
      matter_type: matter_type ?? null,
      visibility,
    })
    .select("id, jurisdiction_code, jurisdiction_name, title, content, upvotes, created_at")
    .single();

  if (error || !note) {
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }

  await awardPoints({
    lawyer_id: lawyer.id,
    event_type: "note_contributed",
    description: `Contributed field note: ${title}`,
  });

  return NextResponse.json(note, { status: 201 });
}
