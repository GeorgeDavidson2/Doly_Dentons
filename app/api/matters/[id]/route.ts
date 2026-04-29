import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";

const patchMatterSchema = z.object({
  status: z.enum(["active", "completed", "archived"]).optional(),
  deadline: z
    .string()
    .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid deadline date" })
    .optional(),
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

async function checkTeamMembership(matterId: string, lawyerId: string) {
  const service = createServiceClient();
  const { data, error } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", matterId)
    .eq("lawyer_id", lawyerId)
    .maybeSingle();

  if (error) return null;
  return data;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await checkTeamMembership(params.id, lawyer.id);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const service = createServiceClient();
  const { data: matter, error } = await service
    .from("matters")
    .select(`
      id, title, description, client_name, matter_type, status, deadline, created_at,
      matter_jurisdictions(id, jurisdiction_code, jurisdiction_name),
      matter_team(
        id, role, match_score, joined_at,
        lawyer:lawyers(id, full_name, title, office_city, office_country, reputation_score, avatar_url)
      ),
      context_briefs(id, jurisdiction_code, jurisdiction_name, status)
    `)
    .eq("id", params.id)
    .single();

  if (error || !matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  return NextResponse.json(matter);
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const lawyer = await getAuthenticatedLawyer();
  if (!lawyer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await checkTeamMembership(params.id, lawyer.id);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = patchMatterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: matter, error } = await service
    .from("matters")
    .update(parsed.data)
    .eq("id", params.id)
    .select("id, title, status, deadline")
    .single();

  if (error || !matter) {
    return NextResponse.json({ error: "Failed to update matter" }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/matters");
  revalidatePath(`/matters/${params.id}`);

  return NextResponse.json(matter);
}
