import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function demoReset() {
  console.log("🔄 Resetting demo state...\n");

  // Delete in dependency order
  const steps = [
    { table: "task_handoffs", label: "Task handoffs" },
    { table: "tasks", label: "Tasks" },
    { table: "matter_team", label: "Matter team" },
    { table: "context_briefs", label: "Context briefs" },
    { table: "matter_jurisdictions", label: "Matter jurisdictions" },
    { table: "matters", label: "Matters" },
    { table: "reputation_events", label: "Reputation events" },
    { table: "field_notes", label: "Field notes" },
  ];

  for (const step of steps) {
    const { error } = await supabase
      .from(step.table)
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows
    if (error) throw new Error(`${step.label}: ${error.message}`);
    console.log(`✓ ${step.label} cleared`);
  }

  // Reset reputation scores on seeded lawyers
  const resetScores = [
    { id: "11111111-1111-1111-1111-111111111101", reputation_score: 1840, matters_count: 43, contributions: 12 },
    { id: "11111111-1111-1111-1111-111111111102", reputation_score: 1200, matters_count: 31, contributions: 8 },
    { id: "11111111-1111-1111-1111-111111111103", reputation_score: 890,  matters_count: 22, contributions: 6 },
    { id: "11111111-1111-1111-1111-111111111104", reputation_score: 560,  matters_count: 14, contributions: 4 },
    { id: "11111111-1111-1111-1111-111111111105", reputation_score: 340,  matters_count: 9,  contributions: 2 },
    { id: "11111111-1111-1111-1111-111111111106", reputation_score: 1050, matters_count: 28, contributions: 7 },
    { id: "11111111-1111-1111-1111-111111111107", reputation_score: 1420, matters_count: 37, contributions: 10 },
    { id: "11111111-1111-1111-1111-111111111108", reputation_score: 980,  matters_count: 25, contributions: 6 },
    { id: "11111111-1111-1111-1111-111111111109", reputation_score: 1680, matters_count: 41, contributions: 11 },
    { id: "11111111-1111-1111-1111-111111111110", reputation_score: 790,  matters_count: 19, contributions: 5 },
    { id: "11111111-1111-1111-1111-111111111111", reputation_score: 620,  matters_count: 16, contributions: 4 },
    { id: "11111111-1111-1111-1111-111111111112", reputation_score: 430,  matters_count: 11, contributions: 3 },
    { id: "11111111-1111-1111-1111-111111111113", reputation_score: 510,  matters_count: 13, contributions: 3 },
    { id: "11111111-1111-1111-1111-111111111114", reputation_score: 380,  matters_count: 10, contributions: 2 },
    { id: "11111111-1111-1111-1111-111111111115", reputation_score: 290,  matters_count: 8,  contributions: 2 },
  ];

  for (const lawyer of resetScores) {
    const { error } = await supabase
      .from("lawyers")
      .update({
        reputation_score: lawyer.reputation_score,
        matters_count: lawyer.matters_count,
        contributions: lawyer.contributions,
      })
      .eq("id", lawyer.id);
    if (error) throw new Error(`Reset lawyer ${lawyer.id}: ${error.message}`);
  }
  console.log("✓ Reputation scores reset\n");

  // Re-seed field notes and reputation events
  const { execSync } = require("child_process");
  console.log("Re-seeding field notes and reputation events...");
  execSync("npx ts-node --project tsconfig.scripts.json scripts/seed.ts", {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
  });

  console.log("\n✅ Demo reset complete. Ready for presentation.");
}

demoReset().catch((err) => {
  console.error("❌ Reset failed:", err.message);
  process.exit(1);
});
