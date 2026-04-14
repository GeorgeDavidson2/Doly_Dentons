/**
 * Verifies the match_lawyers RPC function works end-to-end.
 * Usage: npx tsx scripts/test-match-lawyers.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Fetch Isabella's embedding to use as the query vector
  const { data: isabella, error: fetchError } = await supabase
    .from("lawyers")
    .select("id, full_name, embedding")
    .eq("full_name", "Isabella Reyes")
    .single();

  if (fetchError || !isabella?.embedding) {
    console.error("Could not fetch Isabella's embedding:", fetchError?.message);
    process.exit(1);
  }

  console.log(`Using ${isabella.full_name}'s embedding as query vector.\n`);

  // Call match_lawyers with a 4-jurisdiction matter (CO, MX, BR, DE)
  const { data: results, error: rpcError } = await supabase.rpc("match_lawyers", {
    query_embedding: isabella.embedding,
    jurisdiction_codes: ["CO", "MX", "BR", "DE"],
    match_count: 10,
  });

  if (rpcError) {
    console.error("RPC error:", rpcError.message);
    process.exit(1);
  }

  console.log("Results for jurisdictions [CO, MX, BR, DE]:\n");
  for (const r of results) {
    console.log(
      `  ${r.full_name.padEnd(20)} sim=${r.similarity.toFixed(4)}  jurisdictions=[${r.matched_jurisdictions.join(", ")}]`
    );
  }

  // Assertions
  const first = results[0];
  console.log(`\n✓ Top result: ${first.full_name} (expected: Isabella Reyes)`);
  console.assert(first.full_name === "Isabella Reyes", "Isabella should be first");

  const isabellaResult = results.find((r: { full_name: string }) => r.full_name === "Isabella Reyes");
  const klausResult = results.find((r: { full_name: string }) => r.full_name === "Klaus Weber");
  const rodrigoResult = results.find((r: { full_name: string }) => r.full_name === "Rodrigo Costa");

  if (rodrigoResult && klausResult) {
    const latamCheck = rodrigoResult.similarity > klausResult.similarity;
    console.log(`✓ Rodrigo (${rodrigoResult.similarity.toFixed(4)}) > Klaus (${klausResult.similarity.toFixed(4)}): ${latamCheck}`);
  }

  console.log(`✓ All similarities between 0 and 1: ${results.every((r: { similarity: number }) => r.similarity >= 0 && r.similarity <= 1)}`);
  console.log(`✓ matched_jurisdictions present: ${!!isabellaResult?.matched_jurisdictions}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
