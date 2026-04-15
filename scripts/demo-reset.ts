/**
 * demo-reset.ts
 *
 * Resets the database to the exact clean state needed for the demo.
 *
 * Strategy: selectively delete only what Marcus creates during the demo,
 * then restore all seeded data via seed-history. Seed data for other lawyers
 * (Isabella, Klaus, Rodrigo, Sofia) is never touched unless seed-history runs.
 *
 * Run:  npm run demo:reset
 *
 * Idempotent — safe to run multiple times.
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { execSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Stable IDs ───────────────────────────────────────────────────────────────

const MARCUS_ID = "11111111-1111-1111-1111-111111111105";

// These seeded matters must never be deleted
const SEEDED_MATTER_IDS = [
  "22222222-2222-2222-2222-222222222201",
  "22222222-2222-2222-2222-222222222202",
  "22222222-2222-2222-2222-222222222203",
  "22222222-2222-2222-2222-222222222204",
];

// All 15 lawyer baseline scores
const LAWYER_BASELINES = [
  { id: "11111111-1111-1111-1111-111111111101", reputation_score: 1840, matters_count: 43, contributions: 12 },
  { id: "11111111-1111-1111-1111-111111111102", reputation_score: 1200, matters_count: 31, contributions: 8  },
  { id: "11111111-1111-1111-1111-111111111103", reputation_score: 890,  matters_count: 22, contributions: 6  },
  { id: "11111111-1111-1111-1111-111111111104", reputation_score: 560,  matters_count: 14, contributions: 4  },
  { id: "11111111-1111-1111-1111-111111111105", reputation_score: 340,  matters_count: 9,  contributions: 2  },
  { id: "11111111-1111-1111-1111-111111111106", reputation_score: 1050, matters_count: 28, contributions: 7  },
  { id: "11111111-1111-1111-1111-111111111107", reputation_score: 1420, matters_count: 37, contributions: 10 },
  { id: "11111111-1111-1111-1111-111111111108", reputation_score: 980,  matters_count: 25, contributions: 6  },
  { id: "11111111-1111-1111-1111-111111111109", reputation_score: 1680, matters_count: 41, contributions: 11 },
  { id: "11111111-1111-1111-1111-111111111110", reputation_score: 790,  matters_count: 19, contributions: 5  },
  { id: "11111111-1111-1111-1111-111111111111", reputation_score: 620,  matters_count: 16, contributions: 4  },
  { id: "11111111-1111-1111-1111-111111111112", reputation_score: 430,  matters_count: 11, contributions: 3  },
  { id: "11111111-1111-1111-1111-111111111113", reputation_score: 510,  matters_count: 13, contributions: 3  },
  { id: "11111111-1111-1111-1111-111111111114", reputation_score: 380,  matters_count: 10, contributions: 2  },
  { id: "11111111-1111-1111-1111-111111111115", reputation_score: 290,  matters_count: 8,  contributions: 2  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { console.log(`[demo-reset] ${msg}`); }

function elapsed(start: number) { return `${Date.now() - start}ms`; }

async function del(label: string, fn: () => Promise<{ error: unknown }>) {
  const t = Date.now();
  const { error } = await fn();
  if (error) {
    console.error(`[demo-reset] ✗ ${label}:`, error);
    process.exit(1);
  }
  log(`✓ ${label} (${elapsed(t)})`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const totalStart = Date.now();
  log("Starting demo reset...");
  log("─────────────────────────────────────");

  // ── 1. Find Marcus's demo matters (never touch seeded ones) ────────────────
  const t1 = Date.now();
  const { data: allMarcusMatters, error: queryErr } = await supabase
    .from("matters")
    .select("id, title")
    .eq("lead_lawyer_id", MARCUS_ID);

  if (queryErr) { console.error("[demo-reset] ✗ Query matters:", queryErr); process.exit(1); }

  const demoMatters = (allMarcusMatters ?? []).filter(
    (m) => !SEEDED_MATTER_IDS.includes(m.id)
  );
  const matterIds = demoMatters.map((m) => m.id);

  if (matterIds.length === 0) {
    log(`✓ No demo matters to delete (${elapsed(t1)})`);
  } else {
    log(`Found ${matterIds.length} demo matter(s) to delete (${elapsed(t1)}):`);
    demoMatters.forEach((m) => log(`  • "${m.title}"`));
  }

  // ── 2. Delete matter dependents in FK order ────────────────────────────────
  if (matterIds.length > 0) {
    // Get task IDs first (task_handoffs references tasks)
    const { data: taskRows } = await supabase
      .from("tasks").select("id").in("matter_id", matterIds);
    const taskIds = (taskRows ?? []).map((t) => t.id);

    if (taskIds.length > 0) {
      await del(`Delete ${taskIds.length} task_handoff(s)`, () =>
        supabase.from("task_handoffs").delete().in("task_id", taskIds)
      );
    }

    await del(`Delete tasks for ${matterIds.length} matter(s)`, () =>
      supabase.from("tasks").delete().in("matter_id", matterIds)
    );
    await del(`Delete context_briefs`, () =>
      supabase.from("context_briefs").delete().in("matter_id", matterIds)
    );
    await del(`Delete matter_team entries`, () =>
      supabase.from("matter_team").delete().in("matter_id", matterIds)
    );
    await del(`Delete matter_jurisdictions`, () =>
      supabase.from("matter_jurisdictions").delete().in("matter_id", matterIds)
    );
    await del(`Delete ${matterIds.length} matter(s)`, () =>
      supabase.from("matters").delete().in("id", matterIds)
    );
  }

  // ── 3. Delete Marcus's reputation events and field notes ───────────────────
  await del("Delete Marcus's reputation_events", () =>
    supabase.from("reputation_events").delete().eq("lawyer_id", MARCUS_ID)
  );
  await del("Delete Marcus's field_notes", () =>
    supabase.from("field_notes").delete().eq("author_id", MARCUS_ID)
  );

  // ── 4. Reset all lawyer scores to baseline ─────────────────────────────────
  const t4 = Date.now();
  for (const l of LAWYER_BASELINES) {
    const { error } = await supabase
      .from("lawyers")
      .update({ reputation_score: l.reputation_score, matters_count: l.matters_count, contributions: l.contributions })
      .eq("id", l.id);
    if (error) { console.error(`[demo-reset] ✗ Reset lawyer ${l.id}:`, error); process.exit(1); }
  }
  log(`✓ Reset ${LAWYER_BASELINES.length} lawyer scores to baseline (${elapsed(t4)})`);

  // ── 5. Restore seed history (idempotent — safe to always run) ─────────────
  log("Restoring seed history (field notes + reputation events + completed matters)...");
  const t5 = Date.now();
  execSync("npx tsx scripts/seed-history.ts", {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
  });
  log(`✓ Seed history restored (${elapsed(t5)})`);

  // ── 6. Verify ──────────────────────────────────────────────────────────────
  const { data: marcus } = await supabase
    .from("lawyers").select("reputation_score, matters_count").eq("id", MARCUS_ID).single();
  const { count: noteCount } = await supabase
    .from("field_notes").select("id", { count: "exact", head: true });
  const { count: matterCount } = await supabase
    .from("matters").select("id", { count: "exact", head: true }).eq("lead_lawyer_id", MARCUS_ID);

  log("─────────────────────────────────────");
  log(`Demo reset complete in ${elapsed(totalStart)}.`);
  log("");
  log(`  Marcus: ${matterCount ?? 0} matter(s) · score ${marcus?.reputation_score ?? "?"}`);
  log(`  Field notes in DB: ${noteCount ?? "?"}`);
  log("  Ready for demo.");
}

main().catch((err) => {
  console.error("[demo-reset] Fatal error:", err);
  process.exit(1);
});
