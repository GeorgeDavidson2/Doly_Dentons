import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { awardPoints } from "@/lib/reputation/awards";

const uuidSchema = z.string().uuid();

// POST /api/field-notes/[id]/upvote
export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const idParsed = uuidSchema.safeParse(params.id);
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
  }
  const noteId = idParsed.data;

  // Authenticate upvoter
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  // Resolve upvoter's lawyer row
  const { data: upvoter, error: upvoterError } = await service
    .from("lawyers")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (upvoterError || !upvoter) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the note to get author + current upvote count
  const { data: note, error: noteError } = await service
    .from("field_notes")
    .select("id, author_id, upvotes, title")
    .eq("id", noteId)
    .single();

  if (noteError || !note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Block self-upvote
  if (upvoter.id === note.author_id) {
    return NextResponse.json({ error: "Cannot upvote your own note" }, { status: 400 });
  }

  // Increment the cosmetic upvote counter (service role bypasses author-only RLS)
  const { error: updateError } = await service
    .from("field_notes")
    .update({ upvotes: note.upvotes + 1 })
    .eq("id", noteId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to record upvote" }, { status: 500 });
  }

  // Award points to the AUTHOR — atomic cap enforced by award_upvote_points RPC
  await awardPoints({
    lawyer_id: note.author_id,
    event_type: "note_upvoted",
    source_id: noteId,
    description: `Field note upvoted: ${note.title}`,
  });

  return NextResponse.json({ upvotes: note.upvotes + 1 });
}
