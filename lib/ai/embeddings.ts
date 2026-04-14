import "server-only";
import { pipeline } from "@xenova/transformers";
import { getJurisdictionName } from "@/lib/jurisdictions";

// Singleton — model loads once per server instance (~3-5s first load, ~23MB)
let embedder: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
  }
  return embedder;
}

/** Convert any text to a 384-dimension unit vector. */
export async function embedText(text: string): Promise<number[]> {
  const model = await getEmbedder();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const output = await (model as any)(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as number[]);
}

type LawyerForEmbedding = {
  full_name: string;
  title: string;
  office_city: string;
  languages: string[];
  bio: string;
  lawyer_jurisdictions: {
    jurisdiction_code: string;
    jurisdiction_name: string;
    matter_types: string[];
  }[];
};

/** Build the profile text that gets embedded for a lawyer. */
export function buildLawyerProfileText(lawyer: LawyerForEmbedding): string {
  const jurisdictionNames = lawyer.lawyer_jurisdictions
    .map((j) => j.jurisdiction_name || getJurisdictionName(j.jurisdiction_code))
    .join(", ");

  const matterTypes = Array.from(
    new Set(lawyer.lawyer_jurisdictions.flatMap((j) => j.matter_types))
  ).join(", ");

  const languages = lawyer.languages.join(", ");

  const parts = [
    `${lawyer.full_name} is a ${lawyer.title} at Dentons ${lawyer.office_city}.`,
    jurisdictionNames ? `Jurisdictions: ${jurisdictionNames}.` : null,
    matterTypes ? `Matter types: ${matterTypes}.` : null,
    languages ? `Languages: ${languages}.` : null,
    lawyer.bio ? `Bio: ${lawyer.bio}` : null,
  ].filter(Boolean);

  return parts.join(" ");
}

type MatterForEmbedding = {
  matter_type: string;
  matter_jurisdictions: {
    jurisdiction_code: string;
    jurisdiction_name: string;
  }[];
};

/** Build the query text that gets embedded for a matter when matching lawyers. */
export function buildMatterQueryText(matter: MatterForEmbedding): string {
  const jurisdictionNames = matter.matter_jurisdictions
    .map((j) => j.jurisdiction_name || getJurisdictionName(j.jurisdiction_code))
    .join(", ");

  return `Legal matter in ${jurisdictionNames} requiring ${matter.matter_type} expertise.`;
}
