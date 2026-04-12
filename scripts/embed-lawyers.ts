// This script generates 384-dimension vector embeddings for all lawyer profiles
// and stores them in the lawyers.embedding column in Supabase.
//
// Run after seeding: npm run embed-lawyers
// Re-run after any lawyer profile changes.
//
// Full implementation added in Phase 2 (Connect feature).
// Placeholder ensures the npm script is wired up correctly.

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

console.log("ℹ️  embed-lawyers: full implementation coming in Phase 2 (Connect feature).");
console.log("    Run this script after Phase 2 is complete to generate lawyer embeddings.");
