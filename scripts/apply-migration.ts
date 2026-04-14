/**
 * Applies a SQL migration file directly to the Supabase database.
 *
 * Usage:
 *   npx tsx scripts/apply-migration.ts supabase/migrations/005_match_lawyers_rpc.sql
 *
 * Requires DATABASE_URL in .env.local — get it from:
 *   Supabase Dashboard → Settings → Database → Connection String → URI
 *   Format: postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { Client } from "pg";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx scripts/apply-migration.ts <sql-file>");
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(__dirname, "../", filePath), "utf8");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error(
    "DATABASE_URL is not set in .env.local\n\n" +
    "Get it from: Supabase Dashboard → Settings → Database → Connection String → URI\n" +
    "Then add to .env.local:\n" +
    "  DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
  );
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log(`Applying ${filePath}...`);
  await client.query(sql);
  await client.end();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
