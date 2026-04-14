/**
 * Tests the Connect matching engine end-to-end.
 * Usage: npx tsx --conditions react-server scripts/test-matcher.ts [matter-id]
 *
 * If no matter-id is provided, creates a temporary matter with CO/MX/BR/DE
 * jurisdictions for testing, then deletes it afterwards.
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { matchLawyersForMatter, getReputationDecile, calculateLanguageOverlap } from "@/lib/connect/matcher";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTestMatter(): Promise<string> {
  // Use Marcus's lawyer ID as the owner
  const { data: marcus } = await supabase
    .from("lawyers")
    .select("id")
    .eq("full_name", "Marcus Chen")
    .single();

  if (!marcus) throw new Error("Marcus not found — run seed first");

  const { data: matter, error } = await supabase
    .from("matters")
    .insert({
      title: "[TEST] LatAm-EU Expansion",
      matter_type: "Corporate",
      description: "Cross-border corporate expansion across Colombia, Mexico, Brazil, and Germany.",
      status: "active",
      client_name: "Test Client",
      lead_lawyer_id: marcus.id,
    })
    .select("id")
    .single();

  if (error || !matter) throw new Error(`Failed to create test matter: ${error?.message}`);

  await supabase.from("matter_team").insert({
    matter_id: matter.id,
    lawyer_id: marcus.id,
    role: "lead",
  });

  await supabase.from("matter_jurisdictions").insert([
    { matter_id: matter.id, jurisdiction_code: "CO", jurisdiction_name: "Colombia" },
    { matter_id: matter.id, jurisdiction_code: "MX", jurisdiction_name: "Mexico" },
    { matter_id: matter.id, jurisdiction_code: "BR", jurisdiction_name: "Brazil" },
    { matter_id: matter.id, jurisdiction_code: "DE", jurisdiction_name: "Germany" },
  ]);

  return matter.id;
}

async function deleteTestMatter(matterId: string) {
  await supabase.from("matters").delete().eq("id", matterId);
}

async function main() {
  let matterId = process.argv[2];
  let cleanup = false;

  if (!matterId) {
    console.log("No matter-id provided — creating temporary test matter...");
    matterId = await createTestMatter();
    cleanup = true;
    console.log(`Created test matter: ${matterId}\n`);
  }

  try {
    console.log("Running matcher (embedding model cold start may take ~3s)...\n");
    const results = await matchLawyersForMatter(matterId);

    if (results.length === 0) {
      console.log("No results returned.");
      return;
    }

    console.log("Ranked results:\n");
    for (const r of results) {
      console.log(
        `  ${String(results.indexOf(r) + 1).padStart(2)}. ${r.full_name.padEnd(20)} ` +
        `score=${r.score.toFixed(4)}  sim=${r.similarity.toFixed(4)}  ` +
        `rep=${r.reputation_score}(d${getReputationDecile(r.reputation_score)})  ` +
        `jurisdictions=[${r.matched_jurisdictions.join(",")}]  ` +
        `languages=[${r.languages.join(",")}]`
      );
    }

    // Assertions
    console.log("\nAssertions:");
    const first = results[0];
    console.log(`  ✓ Top result: ${first.full_name} (expected: Isabella Reyes) — ${first.full_name === "Isabella Reyes" ? "PASS" : "FAIL"}`);

    const rodrigoIdx = results.findIndex((r) => r.full_name === "Rodrigo Costa");
    console.log(`  ✓ Rodrigo in top 3 — ${rodrigoIdx !== -1 && rodrigoIdx < 3 ? `PASS (rank ${rodrigoIdx + 1})` : `FAIL (rank ${rodrigoIdx + 1})`}`);

    const klausIdx = results.findIndex((r) => r.full_name === "Klaus Weber");
    console.log(`  ✓ Klaus in top 5 — ${klausIdx !== -1 && klausIdx < 5 ? `PASS (rank ${klausIdx + 1})` : `FAIL (rank ${klausIdx + 1})`}`);

    const allCapped = results.every((r) => r.score >= 0 && r.score <= 1);
    console.log(`  ✓ All scores 0–1: ${allCapped ? "PASS" : "FAIL"}`);

    // Spot-check utility functions
    console.log(`\nUtility checks:`);
    console.log(`  getReputationDecile(1840) = ${getReputationDecile(1840)} (expected 7)`);
    console.log(`  getReputationDecile(2500) = ${getReputationDecile(2500)} (expected 10)`);
    // CO→Spanish, MX→Spanish, BR→Portuguese, DE→German — English is not primary in any of these
  console.log(`  calculateLanguageOverlap(["Spanish","English","Portuguese"], ["CO","MX","BR","DE"]) = ${calculateLanguageOverlap(["Spanish", "English", "Portuguese"], ["CO", "MX", "BR", "DE"])} (expected 2)`);

  } finally {
    if (cleanup) {
      await deleteTestMatter(matterId);
      console.log("\nTest matter deleted.");
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
