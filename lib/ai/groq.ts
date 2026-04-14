import Groq from "groq-sdk";

const MODEL = "llama-3.3-70b-versatile";

function getClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }
  return new Groq({ apiKey });
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

function parseBriefResponse(raw: string): BriefContent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Groq returned non-JSON content: ${raw.slice(0, 200)}`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).legal_landscape !== "string" ||
    typeof (parsed as Record<string, unknown>).cultural_intelligence !== "string" ||
    typeof (parsed as Record<string, unknown>).regulatory_notes !== "string"
  ) {
    throw new Error("Groq response is missing required brief fields");
  }

  const { legal_landscape, cultural_intelligence, regulatory_notes } =
    parsed as Record<string, string>;

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
