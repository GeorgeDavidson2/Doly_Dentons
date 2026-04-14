import "server-only";
import { createClient } from "@supabase/supabase-js";
import { embedText, buildMatterQueryText } from "@/lib/ai/embeddings";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Secondary scoring weights
const JURISDICTION_WEIGHT = 0.10; // per matched jurisdiction
const LANGUAGE_WEIGHT = 0.05;     // per matched language
const REPUTATION_WEIGHT = 0.03;   // per reputation decile (0–10)

// Languages commonly spoken in each jurisdiction (ISO codes → languages)
const JURISDICTION_LANGUAGES: Record<string, string[]> = {
  AR: ["Spanish"],
  AT: ["German"],
  AU: ["English"],
  BE: ["French", "Dutch", "German"],
  BR: ["Portuguese"],
  CA: ["English", "French"],
  CH: ["German", "French", "Italian"],
  CL: ["Spanish"],
  CN: ["Mandarin"],
  CO: ["Spanish"],
  DE: ["German"],
  EC: ["Spanish"],
  EG: ["Arabic"],
  ES: ["Spanish"],
  EU: ["English", "French", "German"],
  FR: ["French"],
  GB: ["English"],
  GH: ["English"],
  GR: ["Greek"],
  HK: ["English", "Mandarin", "Cantonese"],
  ID: ["Indonesian"],
  IL: ["Hebrew", "English"],
  IN: ["English", "Hindi"],
  IT: ["Italian"],
  JP: ["Japanese"],
  KE: ["English", "Swahili"],
  KR: ["Korean"],
  LB: ["Arabic", "French", "English"],
  MX: ["Spanish"],
  MY: ["Malay", "English", "Mandarin"],
  NG: ["English"],
  NL: ["Dutch", "English"],
  NZ: ["English"],
  OM: ["Arabic"],
  PA: ["Spanish"],
  PE: ["Spanish"],
  PH: ["English", "Filipino"],
  PK: ["English", "Urdu"],
  PL: ["Polish"],
  PT: ["Portuguese"],
  QA: ["Arabic", "English"],
  RO: ["Romanian"],
  RU: ["Russian"],
  SA: ["Arabic"],
  SE: ["Swedish"],
  SG: ["English", "Mandarin", "Malay"],
  TH: ["Thai", "English"],
  TN: ["Arabic", "French"],
  TR: ["Turkish"],
  TW: ["Mandarin"],
  TZ: ["Swahili", "English"],
  UA: ["Ukrainian"],
  US: ["English"],
  VN: ["Vietnamese"],
  ZA: ["English", "Afrikaans"],
};

export type MatchResult = {
  id: string;
  full_name: string;
  title: string;
  office_city: string;
  office_country: string;
  timezone: string;
  languages: string[];
  reputation_score: number;
  similarity: number;
  matched_jurisdictions: string[];
  score: number; // final adjusted score, capped at 1.0
};

/** Maps reputation_score to a 0–10 decile. */
export function getReputationDecile(reputationScore: number): number {
  if (reputationScore <= 0) return 0;
  if (reputationScore >= 2500) return 10;
  return Math.floor(reputationScore / 250);
}

/**
 * Returns the number of languages the lawyer speaks that are relevant to
 * at least one of the matter's jurisdictions.
 */
export function calculateLanguageOverlap(
  lawyerLanguages: string[],
  jurisdictionCodes: string[]
): number {
  const relevant = new Set<string>();
  for (const code of jurisdictionCodes) {
    for (const lang of JURISDICTION_LANGUAGES[code] ?? []) {
      relevant.add(lang);
    }
  }
  return lawyerLanguages.filter((l) => relevant.has(l)).length;
}

/**
 * Finds and ranks lawyers for a given matter using vector similarity +
 * secondary scoring (jurisdiction overlap, language overlap, reputation).
 */
export async function matchLawyersForMatter(matterId: string): Promise<MatchResult[]> {
  const service = getServiceClient();

  // Fetch the matter with its jurisdictions
  const { data: matter, error: matterError } = await service
    .from("matters")
    .select("id, matter_type, description, matter_jurisdictions(jurisdiction_code, jurisdiction_name)")
    .eq("id", matterId)
    .single();

  if (matterError || !matter) {
    throw new Error(`Matter not found: ${matterError?.message ?? matterId}`);
  }

  const jurisdictions = matter.matter_jurisdictions as {
    jurisdiction_code: string;
    jurisdiction_name: string;
  }[];

  if (jurisdictions.length === 0) {
    return [];
  }

  const jurisdictionCodes = jurisdictions.map((j) => j.jurisdiction_code);

  // Embed the matter query
  const queryText = buildMatterQueryText({
    matter_type: matter.matter_type,
    matter_jurisdictions: jurisdictions,
  });
  const queryEmbedding = await embedText(queryText);

  // Run pgvector similarity search (returns up to 20 candidates)
  const { data: candidates, error: rpcError } = await service.rpc("match_lawyers", {
    query_embedding: queryEmbedding,
    jurisdiction_codes: jurisdictionCodes,
    match_count: 20,
  });

  if (rpcError) {
    throw new Error(`match_lawyers RPC failed: ${rpcError.message}`);
  }

  if (!candidates || candidates.length === 0) {
    return [];
  }

  // Apply secondary scoring
  const scored: MatchResult[] = candidates.map((c: {
    id: string;
    full_name: string;
    title: string;
    office_city: string;
    office_country: string;
    timezone: string;
    languages: string[];
    reputation_score: number;
    similarity: number;
    matched_jurisdictions: string[];
  }) => {
    const jurisdictionBoost = c.matched_jurisdictions.length * JURISDICTION_WEIGHT;
    const languageBoost = calculateLanguageOverlap(c.languages, jurisdictionCodes) * LANGUAGE_WEIGHT;
    const reputationBoost = getReputationDecile(c.reputation_score) * REPUTATION_WEIGHT;

    const raw = c.similarity + jurisdictionBoost + languageBoost + reputationBoost;
    const score = Math.min(1.0, raw);

    return {
      id: c.id,
      full_name: c.full_name,
      title: c.title,
      office_city: c.office_city,
      office_country: c.office_country,
      timezone: c.timezone,
      languages: c.languages,
      reputation_score: c.reputation_score,
      similarity: c.similarity,
      matched_jurisdictions: c.matched_jurisdictions,
      score,
    };
  });

  // Re-sort by adjusted score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 10);
}
