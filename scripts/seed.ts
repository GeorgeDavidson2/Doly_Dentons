import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================================
// PRE-DEFINED UUIDs — keep stable across resets
// ============================================================
const IDS = {
  isabella: "11111111-1111-1111-1111-111111111101",
  klaus:    "11111111-1111-1111-1111-111111111102",
  rodrigo:  "11111111-1111-1111-1111-111111111103",
  sofia:    "11111111-1111-1111-1111-111111111104",
  marcus:   "11111111-1111-1111-1111-111111111105",
  james:    "11111111-1111-1111-1111-111111111106",
  yuki:     "11111111-1111-1111-1111-111111111107",
  priya:    "11111111-1111-1111-1111-111111111108",
  chenwei:  "11111111-1111-1111-1111-111111111109",
  marie:    "11111111-1111-1111-1111-111111111110",
  ahmed:    "11111111-1111-1111-1111-111111111111",
  sarah:    "11111111-1111-1111-1111-111111111112",
  hans:     "11111111-1111-1111-1111-111111111113",
  ana:      "11111111-1111-1111-1111-111111111114",
  carlos:   "11111111-1111-1111-1111-111111111115",
};

// ============================================================
// LAWYERS
// ============================================================
const lawyers = [
  {
    id: IDS.isabella,
    email: "isabella.reyes@dentons.com",
    full_name: "Isabella Reyes",
    title: "Senior Partner",
    office_city: "Bogotá",
    office_country: "CO",
    timezone: "America/Bogota",
    languages: ["Spanish", "English", "Portuguese"],
    bio: "Senior partner with 15 years of experience in LatAm tech and corporate law. Deep expertise in Colombia, Mexico, and Brazil regulatory frameworks. Led over 40 cross-border tech expansion matters across Latin America.",
    reputation_score: 1840,
    matters_count: 43,
    contributions: 12,
  },
  {
    id: IDS.klaus,
    email: "klaus.weber@dentons.com",
    full_name: "Klaus Weber",
    title: "Partner",
    office_city: "Frankfurt",
    office_country: "DE",
    timezone: "Europe/Berlin",
    languages: ["German", "English", "French"],
    bio: "Partner specialising in EU regulatory law, NIS2 compliance, and German corporate law. Extensive experience advising tech companies on EU market entry and GDPR compliance.",
    reputation_score: 1200,
    matters_count: 31,
    contributions: 8,
  },
  {
    id: IDS.rodrigo,
    email: "rodrigo.costa@dentons.com",
    full_name: "Rodrigo Costa",
    title: "Senior Associate",
    office_city: "São Paulo",
    office_country: "BR",
    timezone: "America/Sao_Paulo",
    languages: ["Portuguese", "English", "Spanish"],
    bio: "Senior associate focused on Brazilian corporate law, LGPD compliance, and tech sector M&A. Advised on 20+ fintech regulatory matters and data protection frameworks.",
    reputation_score: 890,
    matters_count: 22,
    contributions: 6,
  },
  {
    id: IDS.sofia,
    email: "sofia.mendez@dentons.com",
    full_name: "Sofia Mendez",
    title: "Associate",
    office_city: "Mexico City",
    office_country: "MX",
    timezone: "America/Mexico_City",
    languages: ["Spanish", "English"],
    bio: "Associate specialising in Mexican fintech law, FDI regulations, and corporate structuring. Active advisor on Mexico's fintech regulatory sandbox programme.",
    reputation_score: 560,
    matters_count: 14,
    contributions: 4,
  },
  {
    id: IDS.marcus,
    email: "marcus.chen@dentons.com",
    full_name: "Marcus Chen",
    title: "Partner",
    office_city: "Miami",
    office_country: "US",
    timezone: "America/New_York",
    languages: ["English", "Mandarin"],
    bio: "Partner advising US tech companies on cross-border expansion into Latin America and Europe. Specialist in international corporate structuring and regulatory strategy.",
    reputation_score: 340,
    matters_count: 9,
    contributions: 2,
  },
  {
    id: IDS.james,
    email: "james.okafor@dentons.com",
    full_name: "James Okafor",
    title: "Partner",
    office_city: "London",
    office_country: "GB",
    timezone: "Europe/London",
    languages: ["English", "French"],
    bio: "Partner in the London office with expertise in UK financial regulation, FCA compliance, and cross-border M&A. Extensive experience in Africa-UK business corridors.",
    reputation_score: 1050,
    matters_count: 28,
    contributions: 7,
  },
  {
    id: IDS.yuki,
    email: "yuki.tanaka@dentons.com",
    full_name: "Yuki Tanaka",
    title: "Senior Partner",
    office_city: "Tokyo",
    office_country: "JP",
    timezone: "Asia/Tokyo",
    languages: ["Japanese", "English"],
    bio: "Senior partner leading Dentons' Japan technology practice. Specialist in J-SOX compliance, Japan FDI rules, and technology licensing in Asia-Pacific markets.",
    reputation_score: 1420,
    matters_count: 37,
    contributions: 10,
  },
  {
    id: IDS.priya,
    email: "priya.sharma@dentons.com",
    full_name: "Priya Sharma",
    title: "Partner",
    office_city: "Dubai",
    office_country: "AE",
    timezone: "Asia/Dubai",
    languages: ["English", "Hindi", "Arabic"],
    bio: "Partner specialising in UAE commercial law, DIFC regulations, and India-GCC cross-border transactions. Recognised authority on Middle East tech sector regulation.",
    reputation_score: 980,
    matters_count: 25,
    contributions: 6,
  },
  {
    id: IDS.chenwei,
    email: "chen.wei@dentons.com",
    full_name: "Chen Wei",
    title: "Senior Partner",
    office_city: "Singapore",
    office_country: "SG",
    timezone: "Asia/Singapore",
    languages: ["Mandarin", "English", "Malay"],
    bio: "Senior partner heading the Singapore technology and data practice. Expert in PDPA compliance, ASEAN cross-border data flows, and Singapore fintech regulation.",
    reputation_score: 1680,
    matters_count: 41,
    contributions: 11,
  },
  {
    id: IDS.marie,
    email: "marie.dubois@dentons.com",
    full_name: "Marie Dubois",
    title: "Partner",
    office_city: "Paris",
    office_country: "FR",
    timezone: "Europe/Paris",
    languages: ["French", "English", "Spanish"],
    bio: "Partner in the Paris office focused on French and EU competition law, GDPR, and tech sector regulatory strategy. Extensive experience in EU AI Act compliance.",
    reputation_score: 790,
    matters_count: 19,
    contributions: 5,
  },
  {
    id: IDS.ahmed,
    email: "ahmed.alhassan@dentons.com",
    full_name: "Ahmed Al-Hassan",
    title: "Senior Associate",
    office_city: "Dubai",
    office_country: "AE",
    timezone: "Asia/Dubai",
    languages: ["Arabic", "English"],
    bio: "Senior associate specialising in Saudi Arabia corporate law, Vision 2030 investment frameworks, and GCC cross-border transactions.",
    reputation_score: 620,
    matters_count: 16,
    contributions: 4,
  },
  {
    id: IDS.sarah,
    email: "sarah.mitchell@dentons.com",
    full_name: "Sarah Mitchell",
    title: "Associate",
    office_city: "Toronto",
    office_country: "CA",
    timezone: "America/Toronto",
    languages: ["English", "French"],
    bio: "Associate specialising in Canadian privacy law, PIPEDA compliance, and cross-border US-Canada technology transactions.",
    reputation_score: 430,
    matters_count: 11,
    contributions: 3,
  },
  {
    id: IDS.hans,
    email: "hans.mueller@dentons.com",
    full_name: "Hans Mueller",
    title: "Senior Associate",
    office_city: "Berlin",
    office_country: "DE",
    timezone: "Europe/Berlin",
    languages: ["German", "English"],
    bio: "Senior associate in the Berlin office with expertise in German data protection law, startup regulatory compliance, and EU Digital Markets Act.",
    reputation_score: 510,
    matters_count: 13,
    contributions: 3,
  },
  {
    id: IDS.ana,
    email: "ana.lima@dentons.com",
    full_name: "Ana Lima",
    title: "Associate",
    office_city: "São Paulo",
    office_country: "BR",
    timezone: "America/Sao_Paulo",
    languages: ["Portuguese", "English"],
    bio: "Associate focused on Brazilian fintech regulation, Central Bank of Brazil compliance, and Latin American cross-border payment systems.",
    reputation_score: 380,
    matters_count: 10,
    contributions: 2,
  },
  {
    id: IDS.carlos,
    email: "carlos.vega@dentons.com",
    full_name: "Carlos Vega",
    title: "Associate",
    office_city: "Bogotá",
    office_country: "CO",
    timezone: "America/Bogota",
    languages: ["Spanish", "English"],
    bio: "Associate specialising in Colombian corporate law, SFC regulations, and Andean Community trade frameworks.",
    reputation_score: 290,
    matters_count: 8,
    contributions: 2,
  },
];

// ============================================================
// JURISDICTIONS
// ============================================================
const jurisdictions = [
  // Isabella Reyes
  { lawyer_id: IDS.isabella, jurisdiction_code: "CO", jurisdiction_name: "Colombia", expertise_level: 5, matter_types: ["Corporate", "Tech", "Regulatory", "FDI"], years_experience: 15 },
  { lawyer_id: IDS.isabella, jurisdiction_code: "MX", jurisdiction_name: "Mexico", expertise_level: 4, matter_types: ["Corporate", "Tech", "Fintech"], years_experience: 10 },
  { lawyer_id: IDS.isabella, jurisdiction_code: "BR", jurisdiction_name: "Brazil", expertise_level: 3, matter_types: ["Corporate", "Regulatory"], years_experience: 7 },
  { lawyer_id: IDS.isabella, jurisdiction_code: "PE", jurisdiction_name: "Peru", expertise_level: 3, matter_types: ["Corporate", "FDI"], years_experience: 5 },
  // Klaus Weber
  { lawyer_id: IDS.klaus, jurisdiction_code: "DE", jurisdiction_name: "Germany", expertise_level: 5, matter_types: ["Corporate", "Regulatory", "Data Protection", "NIS2"], years_experience: 14 },
  { lawyer_id: IDS.klaus, jurisdiction_code: "EU", jurisdiction_name: "European Union", expertise_level: 4, matter_types: ["Regulatory", "Competition", "AI Act"], years_experience: 12 },
  { lawyer_id: IDS.klaus, jurisdiction_code: "AT", jurisdiction_name: "Austria", expertise_level: 3, matter_types: ["Corporate", "Regulatory"], years_experience: 6 },
  // Rodrigo Costa
  { lawyer_id: IDS.rodrigo, jurisdiction_code: "BR", jurisdiction_name: "Brazil", expertise_level: 5, matter_types: ["Corporate", "Fintech", "Data Protection", "LGPD"], years_experience: 10 },
  { lawyer_id: IDS.rodrigo, jurisdiction_code: "CO", jurisdiction_name: "Colombia", expertise_level: 2, matter_types: ["Corporate"], years_experience: 3 },
  { lawyer_id: IDS.rodrigo, jurisdiction_code: "AR", jurisdiction_name: "Argentina", expertise_level: 3, matter_types: ["Corporate", "Regulatory"], years_experience: 5 },
  // Sofia Mendez
  { lawyer_id: IDS.sofia, jurisdiction_code: "MX", jurisdiction_name: "Mexico", expertise_level: 5, matter_types: ["Corporate", "Fintech", "FDI", "Regulatory"], years_experience: 8 },
  { lawyer_id: IDS.sofia, jurisdiction_code: "CO", jurisdiction_name: "Colombia", expertise_level: 2, matter_types: ["Corporate"], years_experience: 2 },
  // Marcus Chen
  { lawyer_id: IDS.marcus, jurisdiction_code: "US", jurisdiction_name: "United States", expertise_level: 5, matter_types: ["Corporate", "Tech", "M&A", "Securities"], years_experience: 12 },
  { lawyer_id: IDS.marcus, jurisdiction_code: "CA", jurisdiction_name: "Canada", expertise_level: 2, matter_types: ["Corporate"], years_experience: 3 },
  // James Okafor
  { lawyer_id: IDS.james, jurisdiction_code: "GB", jurisdiction_name: "United Kingdom", expertise_level: 5, matter_types: ["Corporate", "Financial Regulation", "M&A"], years_experience: 13 },
  { lawyer_id: IDS.james, jurisdiction_code: "EU", jurisdiction_name: "European Union", expertise_level: 3, matter_types: ["Regulatory", "Competition"], years_experience: 6 },
  { lawyer_id: IDS.james, jurisdiction_code: "NG", jurisdiction_name: "Nigeria", expertise_level: 4, matter_types: ["Corporate", "FDI"], years_experience: 8 },
  // Yuki Tanaka
  { lawyer_id: IDS.yuki, jurisdiction_code: "JP", jurisdiction_name: "Japan", expertise_level: 5, matter_types: ["Corporate", "Tech", "IP", "Regulatory"], years_experience: 18 },
  { lawyer_id: IDS.yuki, jurisdiction_code: "KR", jurisdiction_name: "South Korea", expertise_level: 3, matter_types: ["Corporate", "Tech"], years_experience: 6 },
  { lawyer_id: IDS.yuki, jurisdiction_code: "SG", jurisdiction_name: "Singapore", expertise_level: 2, matter_types: ["Corporate"], years_experience: 4 },
  // Priya Sharma
  { lawyer_id: IDS.priya, jurisdiction_code: "AE", jurisdiction_name: "United Arab Emirates", expertise_level: 5, matter_types: ["Corporate", "DIFC", "Regulatory", "Tech"], years_experience: 11 },
  { lawyer_id: IDS.priya, jurisdiction_code: "IN", jurisdiction_name: "India", expertise_level: 4, matter_types: ["Corporate", "Tech", "FDI"], years_experience: 9 },
  { lawyer_id: IDS.priya, jurisdiction_code: "SA", jurisdiction_name: "Saudi Arabia", expertise_level: 3, matter_types: ["Corporate", "Regulatory"], years_experience: 5 },
  // Chen Wei
  { lawyer_id: IDS.chenwei, jurisdiction_code: "SG", jurisdiction_name: "Singapore", expertise_level: 5, matter_types: ["Corporate", "Fintech", "Data Protection", "PDPA"], years_experience: 16 },
  { lawyer_id: IDS.chenwei, jurisdiction_code: "CN", jurisdiction_name: "China", expertise_level: 4, matter_types: ["Corporate", "Tech", "Regulatory"], years_experience: 10 },
  { lawyer_id: IDS.chenwei, jurisdiction_code: "MY", jurisdiction_name: "Malaysia", expertise_level: 3, matter_types: ["Corporate", "Regulatory"], years_experience: 6 },
  // Marie Dubois
  { lawyer_id: IDS.marie, jurisdiction_code: "FR", jurisdiction_name: "France", expertise_level: 5, matter_types: ["Corporate", "Competition", "Data Protection"], years_experience: 9 },
  { lawyer_id: IDS.marie, jurisdiction_code: "EU", jurisdiction_name: "European Union", expertise_level: 4, matter_types: ["Competition", "AI Act", "GDPR"], years_experience: 8 },
  { lawyer_id: IDS.marie, jurisdiction_code: "BE", jurisdiction_name: "Belgium", expertise_level: 3, matter_types: ["Corporate", "Regulatory"], years_experience: 4 },
  // Ahmed Al-Hassan
  { lawyer_id: IDS.ahmed, jurisdiction_code: "SA", jurisdiction_name: "Saudi Arabia", expertise_level: 5, matter_types: ["Corporate", "Vision 2030", "Regulatory"], years_experience: 8 },
  { lawyer_id: IDS.ahmed, jurisdiction_code: "AE", jurisdiction_name: "United Arab Emirates", expertise_level: 4, matter_types: ["Corporate", "DIFC"], years_experience: 6 },
  // Sarah Mitchell
  { lawyer_id: IDS.sarah, jurisdiction_code: "CA", jurisdiction_name: "Canada", expertise_level: 5, matter_types: ["Corporate", "Privacy", "Tech"], years_experience: 7 },
  { lawyer_id: IDS.sarah, jurisdiction_code: "US", jurisdiction_name: "United States", expertise_level: 3, matter_types: ["Corporate", "Privacy"], years_experience: 4 },
  // Hans Mueller
  { lawyer_id: IDS.hans, jurisdiction_code: "DE", jurisdiction_name: "Germany", expertise_level: 4, matter_types: ["Data Protection", "Tech", "Startup"], years_experience: 7 },
  { lawyer_id: IDS.hans, jurisdiction_code: "EU", jurisdiction_name: "European Union", expertise_level: 3, matter_types: ["Digital Markets Act", "Regulatory"], years_experience: 5 },
  // Ana Lima
  { lawyer_id: IDS.ana, jurisdiction_code: "BR", jurisdiction_name: "Brazil", expertise_level: 4, matter_types: ["Fintech", "Payments", "Regulatory"], years_experience: 6 },
  { lawyer_id: IDS.ana, jurisdiction_code: "AR", jurisdiction_name: "Argentina", expertise_level: 2, matter_types: ["Corporate"], years_experience: 2 },
  // Carlos Vega
  { lawyer_id: IDS.carlos, jurisdiction_code: "CO", jurisdiction_name: "Colombia", expertise_level: 4, matter_types: ["Corporate", "SFC", "Regulatory"], years_experience: 5 },
  { lawyer_id: IDS.carlos, jurisdiction_code: "PE", jurisdiction_name: "Peru", expertise_level: 3, matter_types: ["Corporate", "Andean Community"], years_experience: 3 },
];

// ============================================================
// AVAILABILITY (Mon–Fri 9:00–18:00 local time)
// ============================================================
function availability(lawyerId: string, timezone: string) {
  return [1, 2, 3, 4, 5].map((day) => ({
    lawyer_id: lawyerId,
    day_of_week: day,
    work_start_hour: 9,
    work_end_hour: 18,
    timezone,
  }));
}

const allAvailability = [
  ...availability(IDS.isabella, "America/Bogota"),
  ...availability(IDS.klaus, "Europe/Berlin"),
  ...availability(IDS.rodrigo, "America/Sao_Paulo"),
  ...availability(IDS.sofia, "America/Mexico_City"),
  ...availability(IDS.marcus, "America/New_York"),
  ...availability(IDS.james, "Europe/London"),
  ...availability(IDS.yuki, "Asia/Tokyo"),
  ...availability(IDS.priya, "Asia/Dubai"),
  ...availability(IDS.chenwei, "Asia/Singapore"),
  ...availability(IDS.marie, "Europe/Paris"),
  ...availability(IDS.ahmed, "Asia/Dubai"),
  ...availability(IDS.sarah, "America/Toronto"),
  ...availability(IDS.hans, "Europe/Berlin"),
  ...availability(IDS.ana, "America/Sao_Paulo"),
  ...availability(IDS.carlos, "America/Bogota"),
];

// ============================================================
// FIELD NOTES
// ============================================================
const fieldNotes = [
  {
    author_id: IDS.isabella,
    jurisdiction_code: "CO",
    title: "Colombia FDI Restrictions — Tech Sector 2025",
    content: "Foreign direct investment in Colombian tech companies is generally unrestricted for most sectors. Key considerations: (1) Investments over USD 500K must be registered with Banco de la República within 6 months. (2) Tech companies in the 'orange economy' (creative industries) may qualify for 7-year income tax exemption. (3) Data localisation is not required but financial data processed for Colombian users must comply with SIC resolution 76434. Always verify with DIAN whether the specific activity qualifies for the free trade zone (zona franca) regime, which offers 20% corporate tax vs standard 35%.",
    matter_type: "Corporate",
    visibility: "firm",
    upvotes: 24,
  },
  {
    author_id: IDS.isabella,
    jurisdiction_code: "CO",
    title: "Colombian Negotiation Culture — Key Norms",
    content: "Relationship-building (confianza) is non-negotiable before substantive discussions. First meetings are rarely productive on deal terms — expect 1-2 relationship meetings minimum. Hierarchy matters: always address the most senior person first, and avoid contradicting a senior partner in front of their team. Decision-making is typically centralised at senior level. Punctuality norms: meetings in Bogotá typically start 15-20 minutes late; do not show impatience. Lunch meetings are common and preferred over breakfast. Always follow up with a written summary — verbal commitments are culturally strong but legally weak without documentation.",
    matter_type: null,
    visibility: "firm",
    upvotes: 31,
  },
  {
    author_id: IDS.isabella,
    jurisdiction_code: "MX",
    title: "Mexico Fintech Law — Licensing Overview",
    content: "Mexico's Fintech Law (Ley Fintech, 2018) regulates two primary models: (1) Electronic Payment Institutions (IFPEs) — for companies handling e-money, wallets, and payment processing. (2) Collective Financing Institutions (IFCs) — for crowdfunding platforms. CNBV authorisation required for both. Process takes 6-12 months; approval rate is approximately 40%. Key requirement: majority Mexican ownership is NOT required — 100% foreign ownership is permitted. However, at least one director must be Mexican resident. New sandbox regulations (2023) allow testing for 24 months without full authorisation — recommended entry path for foreign fintechs.",
    matter_type: "Fintech",
    visibility: "firm",
    upvotes: 18,
  },
  {
    author_id: IDS.isabella,
    jurisdiction_code: "BR",
    title: "Brazil LGPD — Practical Compliance Notes",
    content: "LGPD (Lei Geral de Proteção de Dados) is Brazil's GDPR equivalent, enforced since 2021. Key differences from GDPR: (1) No mandatory DPO appointment for all companies — only recommended for high-risk processing. (2) 'Legitimate interest' as a lawful basis has narrower application than EU standard. (3) Data subject rights requests must be responded to within 15 days (vs 30 days GDPR). ANPD (the regulator) has been increasingly active — 3 enforcement actions in 2024. Fines: up to 2% of Brazilian revenue, capped at R$50M per infraction. International data transfer: adequacy decisions pending — standard contractual clauses are the current safe harbour.",
    matter_type: "Data Protection",
    visibility: "firm",
    upvotes: 22,
  },
  {
    author_id: IDS.isabella,
    jurisdiction_code: "CO",
    title: "LatAm Cross-Border Data Transfer Guide",
    content: "No comprehensive regional data transfer framework exists in Latin America — each jurisdiction must be assessed individually. Colombia: transfers to countries without 'adequate protection' (determined by SIC) require standard contractual clauses or binding corporate rules. Brazil LGPD: international transfers permitted to countries with equivalent protection OR via SCCs. Mexico: no data localisation requirements; transfers generally permitted with data subject notice. Argentina: PDPA prohibits transfers to countries without 'adequate' protection — Argentina itself has EU adequacy status. Peru: minimal regulation currently; comprehensive data protection law pending. Practical recommendation: implement a single SCC framework covering all four jurisdictions for efficiency.",
    matter_type: "Data Protection",
    visibility: "firm",
    upvotes: 29,
  },
  {
    author_id: IDS.klaus,
    jurisdiction_code: "DE",
    title: "Germany NIS2 Implementation — Corporate Obligations",
    content: "NIS2 Directive transposed into German law via the NIS2UmsuCG (October 2024). Significantly expands scope vs NIS1: now covers ~30,000 German entities (up from ~2,000). Key obligations for 'important entities' (Wichtige Einrichtungen): (1) Register with BSI within 3 months of being in scope. (2) Implement 10 minimum security measures including MFA, encryption, and incident response plans. (3) Report significant incidents to BSI within 24 hours (initial) and 72 hours (detailed). (4) Management board personal liability — directors can be held personally liable for repeated non-compliance. Fines: up to EUR 10M or 2% of global revenue for essential entities. Tech companies entering German market should conduct NIS2 scoping assessment as first step.",
    matter_type: "Regulatory",
    visibility: "firm",
    upvotes: 19,
  },
  {
    author_id: IDS.klaus,
    jurisdiction_code: "EU",
    title: "EU AI Act — Risk Classification Practical Guide",
    content: "EU AI Act entered into force August 2024; obligations phased in through 2027. Risk tiers relevant to tech companies: (1) Prohibited AI (banned from Aug 2025): social scoring, real-time biometric surveillance, subliminal manipulation. (2) High-risk AI (conformity assessment required): HR tools, credit scoring, biometric categorisation, legal/regulatory decision support. (3) Limited risk (transparency obligations only): chatbots, deepfakes, emotion recognition. For legal tech tools: AI-assisted legal decision-making tools are HIGH RISK under Annex III — require CE marking equivalent, technical documentation, human oversight mechanisms, and registration in EU database. Start compliance assessment now if building AI legal tools for EU market.",
    matter_type: "Regulatory",
    visibility: "firm",
    upvotes: 35,
  },
  {
    author_id: IDS.klaus,
    jurisdiction_code: "DE",
    title: "German Business Culture — Negotiation Norms",
    content: "German business culture is highly formal, direct, and document-focused. Key norms: (1) Punctuality is non-negotiable — arriving late is a serious sign of disrespect. (2) Directness is valued — 'no' means no, and ambiguity is viewed with suspicion. Do not use vague language like 'we will consider it.' (3) Titles matter — use Herr/Frau + last name until invited to use first names. Academic titles (Dr., Prof.) are always used. (4) Decisions are thorough and slow — Germans rarely make decisions in first meetings. Expect multiple rounds of detailed analysis. (5) Written documentation is critical — verbal agreements carry less weight; follow up all discussions with written records. (6) Avoid high-pressure tactics — they create distrust and will set back negotiations.",
    matter_type: null,
    visibility: "firm",
    upvotes: 16,
  },
  {
    author_id: IDS.rodrigo,
    jurisdiction_code: "BR",
    title: "Brazil Corporate Structure — Entrada no Mercado",
    content: "Foreign companies entering the Brazilian market have three main options: (1) Subsidiary (Subsidiária) — most common for tech companies; requires at least 2 shareholders, one Brazilian resident director, and minimum capital (no statutory minimum but JUCESP recommends R$100K+). Registration takes 30-60 days. (2) Branch (Filial) — requires Presidential Decree, rarely used. (3) Representative office — limited scope, cannot generate revenue. Tech companies should also evaluate whether the Simples Nacional tax regime applies (revenue under R$4.8M/year) — reduces effective tax rate dramatically. São Paulo state registration (JUCESP) is the fastest entry point. CNPJ number required before any commercial activity.",
    matter_type: "Corporate",
    visibility: "firm",
    upvotes: 14,
  },
  {
    author_id: IDS.rodrigo,
    jurisdiction_code: "BR",
    title: "Brazil Regulatory — Central Bank Tech Licensing",
    content: "Banco Central do Brasil (BCB) regulates payment institutions and financial services. Foreign fintechs must obtain BCB authorisation before operating in Brazil. Key licence types: (1) Instituição de Pagamento (IP) — covers e-money, prepaid cards, payment processing. (2) Fintech de Crédito (SCD/SEP) — for lending platforms. Authorisation timeline: 12-18 months minimum. BCB's Open Finance regulation (2021) mandates API interoperability — a significant opportunity for foreign fintechs to access Brazilian banking data with user consent. Key risk: BCB has blocked several foreign payment platforms operating without licence — do not soft-launch before authorisation.",
    matter_type: "Fintech",
    visibility: "firm",
    upvotes: 20,
  },
  {
    author_id: IDS.sofia,
    jurisdiction_code: "MX",
    title: "Mexico FDI — Restricted and Reserved Sectors",
    content: "Mexico's Foreign Investment Law defines three categories: (1) Reserved activities (Mexican government only): postal service, land transport, radioactive materials. (2) Restricted activities (maximum foreign ownership limits): air transport (25%), domestic maritime (49%), insurance (49%), broadcasting (49%). (3) Neutral investment: certain activities require CNIE (National Foreign Investment Commission) approval for over 49% foreign ownership, including: banking, securities firms, and companies with assets over MXN 18.6B. For tech companies: software, SaaS, fintech, and most digital services are UNRESTRICTED — 100% foreign ownership is permitted with no CNIE notification required. Always verify current thresholds as they are adjusted annually for inflation.",
    matter_type: "FDI",
    visibility: "firm",
    upvotes: 17,
  },
  {
    author_id: IDS.sofia,
    jurisdiction_code: "MX",
    title: "Mexico Corporate Culture — Business Norms",
    content: "Mexican business culture blends formality with warmth (personalismo). Key norms: (1) Personal relationships are central — invest time in getting to know counterparts personally before pressing on business terms. (2) Hierarchy is respected — always acknowledge the most senior person. Decisions are made at the top; middle management rarely has authority to commit. (3) Meeting times: punctuality is valued in Mexico City corporate settings (unlike some other LatAm markets) but expect some flexibility. (4) Language: while executives in major cities are English-proficient, conducting meetings in Spanish demonstrates respect and dramatically improves rapport. (5) 'Mañana' culture — deadlines can be soft; build buffer into timelines. Confirm deliverables in writing with specific dates.",
    matter_type: null,
    visibility: "firm",
    upvotes: 12,
  },
  {
    author_id: IDS.james,
    jurisdiction_code: "GB",
    title: "UK Post-Brexit Financial Services — Equivalence Status",
    content: "Post-Brexit, UK financial services firms lost EU passporting rights. Current status (2025): UK-EU equivalence decisions remain limited — only a handful of decisions granted, covering primarily clearing and recognised exchanges. Practical implications for tech companies: (1) UK payment institutions cannot passport into EU — separate EU entity required for EU customers. (2) UK e-money institutions need separate EMD authorisation in EU member state. (3) UK GDPR operates independently from EU GDPR — EU adequacy decision for UK remains in place (review due 2025, expected renewal). For cross-border deals: always check whether the transaction triggers FCA notification or approval requirements — threshold for FCA approval has been lowered post-Brexit for certain acquisitions.",
    matter_type: "Financial Regulation",
    visibility: "firm",
    upvotes: 21,
  },
  {
    author_id: IDS.chenwei,
    jurisdiction_code: "SG",
    title: "Singapore MAS Fintech Licensing — Practical Notes",
    content: "Monetary Authority of Singapore (MAS) offers several entry paths for fintechs: (1) Major Payment Institution (MPI) licence — required for companies processing over SGD 3M/month. Full application, 6-9 months. (2) Standard Payment Institution (SPI) — for lower volumes. Faster approval, 3-6 months. (3) FinTech Regulatory Sandbox — for genuinely novel business models. MAS is highly responsive and sandbox approvals can take as little as 2 months. Singapore advantages: no capital controls, English-language legal system, strong IP protection, regional hub status for ASEAN expansion. Key consideration: MAS requires a substantial local presence — not a post-box office. At least one locally resident director with financial services experience is mandatory. Singapore entity provides effective gateway to Malaysia, Indonesia, and Thailand markets.",
    matter_type: "Fintech",
    visibility: "firm",
    upvotes: 26,
  },
  {
    author_id: IDS.priya,
    jurisdiction_code: "AE",
    title: "UAE DIFC vs ADGM — Choosing the Right Hub",
    content: "Foreign tech companies entering UAE face a choice between two financial free zones: (1) DIFC (Dubai International Financial Centre) — common law jurisdiction, DFSA regulator, strong for fintech, asset management, capital markets. Well-established ecosystem with 4,500+ firms. (2) ADGM (Abu Dhabi Global Market) — also common law, FSRA regulator, newer but rapidly growing. Preferred by sovereign wealth fund-adjacent businesses. Key differences: DIFC has more mature fintech regulatory framework (Innovation Testing Licence available). ADGM offers lower setup costs. Both allow 100% foreign ownership. For tech companies NOT in regulated financial services: mainland UAE company (LLC or Free Zone) is often simpler and cheaper than DIFC/ADGM. 2023 reform removed requirement for local UAE sponsor for mainland LLCs — significant improvement.",
    matter_type: "Corporate",
    visibility: "firm",
    upvotes: 23,
  },
];

// ============================================================
// REPUTATION EVENTS (historical)
// ============================================================
const reputationEvents = [
  // Isabella — 1840 points
  { lawyer_id: IDS.isabella, event_type: "profile_completed", points: 60, description: "Profile setup completed" },
  { lawyer_id: IDS.isabella, event_type: "cross_border_matter", points: 100, description: "Led LatAm Tech Expansion — TechCorp Brazil/Colombia" },
  { lawyer_id: IDS.isabella, event_type: "cross_border_matter", points: 100, description: "Led 4-country LatAm regulatory matter" },
  { lawyer_id: IDS.isabella, event_type: "cross_border_matter", points: 100, description: "Led Mexico-Colombia fintech expansion" },
  { lawyer_id: IDS.isabella, event_type: "brief_generated", points: 50, description: "Context briefs generated" },
  { lawyer_id: IDS.isabella, event_type: "brief_generated", points: 50, description: "Context briefs generated" },
  { lawyer_id: IDS.isabella, event_type: "note_contributed", points: 40, description: "Colombia FDI note contributed" },
  { lawyer_id: IDS.isabella, event_type: "note_contributed", points: 40, description: "Colombian Negotiation Culture note contributed" },
  { lawyer_id: IDS.isabella, event_type: "note_contributed", points: 40, description: "Mexico Fintech Law note contributed" },
  { lawyer_id: IDS.isabella, event_type: "note_contributed", points: 40, description: "Brazil LGPD note contributed" },
  { lawyer_id: IDS.isabella, event_type: "note_contributed", points: 40, description: "LatAm Data Transfer Guide contributed" },
  { lawyer_id: IDS.isabella, event_type: "note_upvoted", points: 10, description: "Note upvoted by colleague" },
  { lawyer_id: IDS.isabella, event_type: "note_upvoted", points: 10, description: "Note upvoted by colleague" },
  { lawyer_id: IDS.isabella, event_type: "note_upvoted", points: 10, description: "Note upvoted by colleague" },
  { lawyer_id: IDS.isabella, event_type: "handoff_completed", points: 25, description: "Task handoff completed" },
  { lawyer_id: IDS.isabella, event_type: "handoff_completed", points: 25, description: "Task handoff completed" },
  { lawyer_id: IDS.isabella, event_type: "match_accepted", points: 20, description: "Accepted to matter team" },
  { lawyer_id: IDS.isabella, event_type: "match_accepted", points: 20, description: "Accepted to matter team" },
  { lawyer_id: IDS.isabella, event_type: "matter_joined", points: 30, description: "Joined cross-border matter" },
  { lawyer_id: IDS.isabella, event_type: "matter_joined", points: 30, description: "Joined cross-border matter" },
  // Klaus — 1200 points
  { lawyer_id: IDS.klaus, event_type: "profile_completed", points: 60, description: "Profile setup completed" },
  { lawyer_id: IDS.klaus, event_type: "cross_border_matter", points: 100, description: "Led EU regulatory matter" },
  { lawyer_id: IDS.klaus, event_type: "cross_border_matter", points: 100, description: "Led Germany-UK compliance matter" },
  { lawyer_id: IDS.klaus, event_type: "note_contributed", points: 40, description: "NIS2 Implementation note contributed" },
  { lawyer_id: IDS.klaus, event_type: "note_contributed", points: 40, description: "EU AI Act note contributed" },
  { lawyer_id: IDS.klaus, event_type: "note_contributed", points: 40, description: "German Business Culture note contributed" },
  { lawyer_id: IDS.klaus, event_type: "note_contributed", points: 40, description: "Germany NIS2 note contributed" },
  { lawyer_id: IDS.klaus, event_type: "note_upvoted", points: 10, description: "Note upvoted by colleague" },
  { lawyer_id: IDS.klaus, event_type: "handoff_completed", points: 25, description: "Task handoff completed" },
  { lawyer_id: IDS.klaus, event_type: "matter_joined", points: 30, description: "Joined cross-border matter" },
  { lawyer_id: IDS.klaus, event_type: "match_accepted", points: 20, description: "Accepted to matter team" },
  // Rodrigo — 890 points
  { lawyer_id: IDS.rodrigo, event_type: "profile_completed", points: 60, description: "Profile setup completed" },
  { lawyer_id: IDS.rodrigo, event_type: "cross_border_matter", points: 100, description: "Led Brazil fintech regulatory matter" },
  { lawyer_id: IDS.rodrigo, event_type: "note_contributed", points: 40, description: "Brazil corporate structure note contributed" },
  { lawyer_id: IDS.rodrigo, event_type: "note_contributed", points: 40, description: "BCB licensing note contributed" },
  { lawyer_id: IDS.rodrigo, event_type: "brief_generated", points: 50, description: "Context briefs generated" },
  { lawyer_id: IDS.rodrigo, event_type: "handoff_completed", points: 25, description: "Task handoff completed" },
  { lawyer_id: IDS.rodrigo, event_type: "match_accepted", points: 20, description: "Accepted to matter team" },
  { lawyer_id: IDS.rodrigo, event_type: "matter_joined", points: 30, description: "Joined cross-border matter" },
  // Sofia — 560 points
  { lawyer_id: IDS.sofia, event_type: "profile_completed", points: 60, description: "Profile setup completed" },
  { lawyer_id: IDS.sofia, event_type: "cross_border_matter", points: 100, description: "Led Mexico fintech expansion" },
  { lawyer_id: IDS.sofia, event_type: "note_contributed", points: 40, description: "Mexico FDI note contributed" },
  { lawyer_id: IDS.sofia, event_type: "note_contributed", points: 40, description: "Mexico Business Culture note contributed" },
  { lawyer_id: IDS.sofia, event_type: "handoff_completed", points: 25, description: "Task handoff completed" },
  { lawyer_id: IDS.sofia, event_type: "matter_joined", points: 30, description: "Joined matter team" },
  // Marcus — 340 points
  { lawyer_id: IDS.marcus, event_type: "profile_completed", points: 60, description: "Profile setup completed" },
  { lawyer_id: IDS.marcus, event_type: "cross_border_matter", points: 100, description: "Led US-LatAm expansion matter" },
  { lawyer_id: IDS.marcus, event_type: "brief_generated", points: 50, description: "Context briefs generated" },
  { lawyer_id: IDS.marcus, event_type: "matter_joined", points: 30, description: "Joined matter team" },
];

// ============================================================
// MAIN SEED FUNCTION
// ============================================================
async function seed() {
  console.log("🌱 Starting seed...\n");

  // 1. Lawyers
  console.log("Inserting lawyers...");
  const { error: lawyersError } = await supabase
    .from("lawyers")
    .upsert(lawyers, { onConflict: "id" });
  if (lawyersError) throw new Error(`Lawyers: ${lawyersError.message}`);
  console.log(`✓ ${lawyers.length} lawyers inserted\n`);

  // 2. Jurisdictions
  console.log("Inserting jurisdictions...");
  const { error: jurError } = await supabase
    .from("lawyer_jurisdictions")
    .upsert(jurisdictions, { onConflict: "lawyer_id,jurisdiction_code" });
  if (jurError) throw new Error(`Jurisdictions: ${jurError.message}`);
  console.log(`✓ ${jurisdictions.length} jurisdiction records inserted\n`);

  // 3. Availability
  console.log("Inserting availability windows...");
  const { error: availError } = await supabase
    .from("lawyer_availability")
    .upsert(allAvailability, { onConflict: "lawyer_id,day_of_week" });
  if (availError) throw new Error(`Availability: ${availError.message}`);
  console.log(`✓ ${allAvailability.length} availability windows inserted\n`);

  // 4. Field notes
  console.log("Inserting field notes...");
  const { error: notesError } = await supabase
    .from("field_notes")
    .insert(fieldNotes);
  if (notesError) throw new Error(`Field notes: ${notesError.message}`);
  console.log(`✓ ${fieldNotes.length} field notes inserted\n`);

  // 5. Reputation events
  console.log("Inserting reputation events...");
  const { error: repError } = await supabase
    .from("reputation_events")
    .insert(reputationEvents);
  if (repError) throw new Error(`Reputation events: ${repError.message}`);
  console.log(`✓ ${reputationEvents.length} reputation events inserted\n`);

  console.log("✅ Seed complete!\n");
  console.log("Demo lawyers:");
  console.log("  Isabella Reyes  — Bogotá       — CO/MX/BR  — Rep: 1,840");
  console.log("  Klaus Weber     — Frankfurt    — DE/EU     — Rep: 1,200");
  console.log("  Rodrigo Costa   — São Paulo    — BR/CO     — Rep:   890");
  console.log("  Sofia Mendez    — Mexico City  — MX        — Rep:   560");
  console.log("  Marcus Chen     — Miami        — US        — Rep:   340");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
