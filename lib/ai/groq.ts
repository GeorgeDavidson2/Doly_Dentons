import "server-only";
import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile";

// Module-level singleton — avoids re-initialising the SDK on every parallel call
let _client: Groq | null = null;
function getClient(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not set");
    }
    _client = new Groq({ apiKey });
  }
  return _client;
}

export interface BriefContent {
  legal_landscape: string;
  cultural_intelligence: string;
  regulatory_notes: string;
}

function buildSystemPrompt(): string {
  return `You are a cross-border legal intelligence assistant for Dentons, one of the world's largest law firms. Your role is to produce concise, accurate jurisdiction briefs that help lawyers understand the legal environment in a given country for a specific type of matter.

Always respond with a single valid JSON object and nothing else.`;
}

function buildUserPrompt(params: {
  matterType: string;
  jurisdictionCode: string;
  jurisdictionName: string;
  description?: string;
}): string {
  const { matterType, jurisdictionCode, jurisdictionName, description } = params;

  const contextLine = description?.trim()
    ? `\nMatter context: ${description.trim()}\n`
    : "";

  return `Generate a jurisdiction brief for a "${matterType}" matter in ${jurisdictionName} (${jurisdictionCode}).${contextLine}

Return a JSON object with exactly these three fields:

{
  "legal_landscape": "2-3 paragraphs covering the key legal framework, primary statutes, court system structure, and any notable legal precedents or doctrines relevant to ${matterType} matters in ${jurisdictionName}.",
  "cultural_intelligence": "1-2 paragraphs on business culture, communication norms, relationship-building customs, hierarchy expectations, and negotiation style in ${jurisdictionName} that directly affect how legal engagements and client relationships are conducted.",
  "regulatory_notes": "1-2 paragraphs on the main regulatory bodies, key compliance requirements, licensing or filing obligations, and any recent or upcoming regulatory changes that legal practitioners handling ${matterType} matters in ${jurisdictionName} must be aware of."
}

Be specific and practical. Prioritise information a senior lawyer would need before engaging in ${jurisdictionName}.`;
}

const REQUIRED_FIELDS = ["legal_landscape", "cultural_intelligence", "regulatory_notes"] as const;

function parseBriefResponse(raw: string): BriefContent {
  if (!raw) throw new Error("Groq returned an empty response");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Don't include raw content in error — may contain confidential matter descriptions
    throw new Error("Groq returned non-JSON content");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("Groq response is not a JSON object");
  }

  const obj = parsed as Record<string, unknown>;
  const missing = REQUIRED_FIELDS.filter((k) => typeof obj[k] !== "string");

  if (missing.length > 0) {
    throw new Error(
      `Groq response is missing required fields: ${missing.join(", ")}. Got keys: ${Object.keys(obj).join(", ")}`
    );
  }

  const { legal_landscape, cultural_intelligence, regulatory_notes } =
    obj as Record<string, string>;

  return { legal_landscape, cultural_intelligence, regulatory_notes };
}

export async function generateBrief(params: {
  matterType: string;
  jurisdictionCode: string;
  jurisdictionName: string;
  description?: string;
}): Promise<BriefContent> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(params) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  return parseBriefResponse(raw);
}
