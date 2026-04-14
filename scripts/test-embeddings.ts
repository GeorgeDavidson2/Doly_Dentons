/**
 * Test script: verifies embedding pipeline correctness.
 *
 * Usage:
 *   npx tsx scripts/test-embeddings.ts
 *
 * Expected:
 *   - Each embedding is 384 numbers
 *   - Identical input → identical output
 *   - Isabella ↔ Rodrigo similarity > Isabella ↔ Klaus (LatAm overlap)
 */

import { embedText, buildLawyerProfileText } from "../lib/ai/embeddings";

const ISABELLA = {
  full_name: "Isabella Reyes",
  title: "Senior Partner",
  office_city: "Bogotá",
  languages: ["Spanish", "English", "Portuguese"],
  bio: "Senior partner with 15 years of experience in LatAm tech and corporate law. Deep expertise in Colombia, Mexico, and Brazil regulatory frameworks. Led over 40 cross-border tech expansion matters across Latin America.",
  lawyer_jurisdictions: [
    { jurisdiction_code: "CO", jurisdiction_name: "Colombia", matter_types: ["Corporate", "Tech", "Regulatory", "FDI"] },
    { jurisdiction_code: "MX", jurisdiction_name: "Mexico", matter_types: ["Corporate", "Tech", "Fintech"] },
    { jurisdiction_code: "BR", jurisdiction_name: "Brazil", matter_types: ["Corporate", "Regulatory"] },
    { jurisdiction_code: "PE", jurisdiction_name: "Peru", matter_types: ["Corporate", "FDI"] },
  ],
};

const RODRIGO = {
  full_name: "Rodrigo Costa",
  title: "Partner",
  office_city: "São Paulo",
  languages: ["Portuguese", "Spanish", "English"],
  bio: "Partner specializing in Brazilian fintech regulation and LGPD compliance. Also covers Colombia and Argentina corporate matters.",
  lawyer_jurisdictions: [
    { jurisdiction_code: "BR", jurisdiction_name: "Brazil", matter_types: ["Corporate", "Fintech", "Data Protection", "LGPD"] },
    { jurisdiction_code: "CO", jurisdiction_name: "Colombia", matter_types: ["Corporate"] },
    { jurisdiction_code: "AR", jurisdiction_name: "Argentina", matter_types: ["Corporate", "Regulatory"] },
  ],
};

const KLAUS = {
  full_name: "Klaus Weber",
  title: "Senior Partner",
  office_city: "Frankfurt",
  languages: ["German", "English", "French"],
  bio: "Senior partner specialising in German and EU regulatory frameworks, data protection, and competition law. NIS2 and AI Act expert.",
  lawyer_jurisdictions: [
    { jurisdiction_code: "DE", jurisdiction_name: "Germany", matter_types: ["Corporate", "Regulatory", "Data Protection", "NIS2"] },
    { jurisdiction_code: "EU", jurisdiction_name: "European Union", matter_types: ["Regulatory", "Competition", "AI Act"] },
    { jurisdiction_code: "AT", jurisdiction_name: "Austria", matter_types: ["Corporate", "Regulatory"] },
  ],
};

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

async function main() {
  console.log("Loading model (first run ~3-5s)...\n");

  const isabellaText = buildLawyerProfileText(ISABELLA);
  const rodrigoText = buildLawyerProfileText(RODRIGO);
  const klausText = buildLawyerProfileText(KLAUS);

  console.log("Isabella profile text:");
  console.log(" ", isabellaText, "\n");

  const start = Date.now();
  const [vecIsabella, vecRodrigo, vecKlaus] = await Promise.all([
    embedText(isabellaText),
    embedText(rodrigoText),
    embedText(klausText),
  ]);
  console.log(`Embeddings generated in ${Date.now() - start}ms\n`);

  // Dimension check
  console.assert(vecIsabella.length === 384, `Expected 384 dims, got ${vecIsabella.length}`);
  console.log(`✓ Dimension: ${vecIsabella.length} (expected 384)`);

  // Determinism check
  const vecIsabella2 = await embedText(isabellaText);
  const identical = vecIsabella.every((v, i) => v === vecIsabella2[i]);
  console.log(`✓ Deterministic: ${identical ? "yes" : "NO — mismatch!"}`);

  // Similarity check
  const simIsabellaRodrigo = cosineSimilarity(vecIsabella, vecRodrigo);
  const simIsabellaKlaus = cosineSimilarity(vecIsabella, vecKlaus);

  console.log(`\nCosine similarity:`);
  console.log(`  Isabella ↔ Rodrigo (LatAm overlap): ${simIsabellaRodrigo.toFixed(4)}`);
  console.log(`  Isabella ↔ Klaus   (EU vs LatAm):   ${simIsabellaKlaus.toFixed(4)}`);

  const similarityCheckPassed = simIsabellaRodrigo > simIsabellaKlaus;
  console.log(`\n${similarityCheckPassed ? "✓" : "✗"} Isabella ↔ Rodrigo > Isabella ↔ Klaus: ${similarityCheckPassed}`);

  if (!similarityCheckPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
