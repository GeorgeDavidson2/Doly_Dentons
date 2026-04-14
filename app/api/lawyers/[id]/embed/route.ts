import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { embedText, buildLawyerProfileText } from "@/lib/ai/embeddings";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = createServiceClient();

  // Fetch the lawyer — ownership verified by email
  const { data: lawyer, error: lawyerError } = await service
    .from("lawyers")
    .select("id, email, full_name, title, office_city, languages, bio")
    .eq("id", params.id)
    .maybeSingle();

  if (lawyerError || !lawyer) {
    return NextResponse.json({ error: "Lawyer not found" }, { status: 404 });
  }

  // Only the lawyer themselves can regenerate their own embedding
  if (lawyer.email !== user.email) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch jurisdictions for profile text
  const { data: jurisdictions, error: jurError } = await service
    .from("lawyer_jurisdictions")
    .select("jurisdiction_code, jurisdiction_name, matter_types")
    .eq("lawyer_id", params.id);

  if (jurError) {
    return NextResponse.json({ error: "Failed to load jurisdictions" }, { status: 500 });
  }

  const profileText = buildLawyerProfileText({
    full_name: lawyer.full_name,
    title: lawyer.title,
    office_city: lawyer.office_city,
    languages: lawyer.languages,
    bio: lawyer.bio,
    lawyer_jurisdictions: (jurisdictions ?? []) as {
      jurisdiction_code: string;
      jurisdiction_name: string;
      matter_types: string[];
    }[],
  });

  const embedding = await embedText(profileText);

  const { error: updateError } = await service
    .from("lawyers")
    .update({ embedding: JSON.stringify(embedding) })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to save embedding" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    dimensions: embedding.length,
    generated_at: new Date().toISOString(),
  });
}
