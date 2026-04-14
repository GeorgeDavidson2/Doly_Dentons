/**
 * Generates and stores 384-dimension vector embeddings for all lawyer profiles.
 *
 * Usage:
 *   npm run embed-lawyers            # skip lawyers that already have embeddings
 *   npm run embed-lawyers -- --force # re-embed all lawyers
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { embedText, buildLawyerProfileText } from "@/lib/ai/embeddings";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const force = process.argv.includes("--force");

async function main() {
  // Fetch all lawyers with their jurisdiction data
  const { data: lawyers, error } = await supabase
    .from("lawyers")
    .select(
      "id, full_name, title, office_city, languages, bio, embedding, lawyer_jurisdictions(jurisdiction_code, jurisdiction_name, matter_types)"
    )
    .order("full_name");

  if (error) {
    console.error("Failed to fetch lawyers:", error.message);
    process.exit(1);
  }

  if (!lawyers || lawyers.length === 0) {
    console.log("No lawyers found. Run `npm run seed` first.");
    process.exit(0);
  }

  const toEmbed = force
    ? lawyers
    : lawyers.filter((l) => !l.embedding);

  const skipped = lawyers.length - toEmbed.length;
  if (skipped > 0) {
    console.log(`Skipping ${skipped} lawyer(s) that already have embeddings (use --force to re-embed).`);
  }

  if (toEmbed.length === 0) {
    console.log("All lawyers already have embeddings.");
    return;
  }

  console.log(`\nEmbedding ${toEmbed.length} lawyer(s)...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < toEmbed.length; i++) {
    const lawyer = toEmbed[i];
    const label = `${i + 1}/${toEmbed.length}: ${lawyer.full_name}`;
    process.stdout.write(`  ${label}... `);

    const start = Date.now();
    try {
      const profileText = buildLawyerProfileText({
        full_name: lawyer.full_name,
        title: lawyer.title,
        office_city: lawyer.office_city,
        languages: lawyer.languages,
        bio: lawyer.bio,
        lawyer_jurisdictions: lawyer.lawyer_jurisdictions as {
          jurisdiction_code: string;
          jurisdiction_name: string;
          matter_types: string[];
        }[],
      });

      const embedding = await embedText(profileText);

      const { error: updateError } = await supabase
        .from("lawyers")
        .update({ embedding: JSON.stringify(embedding) })
        .eq("id", lawyer.id);

      if (updateError) {
        console.log(`FAILED (${updateError.message})`);
        failCount++;
      } else {
        console.log(`done (${embedding.length}d, ${Date.now() - start}ms)`);
        successCount++;
      }
    } catch (err) {
      console.log(`ERROR (${err instanceof Error ? err.message : String(err)})`);
      failCount++;
    }
  }

  console.log(`\n✓ ${successCount} embedded${failCount > 0 ? `, ${failCount} failed` : ""}.`);

  // Verify stored embeddings
  const { data: check } = await supabase
    .from("lawyers")
    .select("full_name, embedding")
    .not("embedding", "is", null);

  console.log(`\nVerification: ${check?.length ?? 0}/${lawyers.length} lawyers have embeddings in Supabase.`);

  if (failCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
