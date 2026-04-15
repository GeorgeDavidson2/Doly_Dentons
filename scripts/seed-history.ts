/**
 * seed-history.ts
 *
 * Seeds reputation events, completed matters, and field notes for the top demo
 * lawyers so their profiles look credible on demo day.
 *
 * Idempotent — deletes existing seeded rows by stable UUIDs before re-inserting.
 *
 * Run:
 *   npx ts-node -e "require('./scripts/seed-history.ts')"
 *   OR
 *   npx tsx scripts/seed-history.ts
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Stable IDs ───────────────────────────────────────────────────────────────

const LAWYERS = {
  isabella: "11111111-1111-1111-1111-111111111101",
  klaus:    "11111111-1111-1111-1111-111111111102",
  rodrigo:  "11111111-1111-1111-1111-111111111103",
  sofia:    "11111111-1111-1111-1111-111111111104",
  marcus:   "11111111-1111-1111-1111-111111111105",
};

const MATTER_IDS = {
  isabellaMatter1: "22222222-2222-2222-2222-222222222201",
  isabellaMatter2: "22222222-2222-2222-2222-222222222202",
  isabellaMatter3: "22222222-2222-2222-2222-222222222203",
  klausMatter1:   "22222222-2222-2222-2222-222222222204",
};

const NOTE_IDS = {
  // Isabella
  in1: "33333333-3333-3333-3333-333333333301",
  in2: "33333333-3333-3333-3333-333333333302",
  in3: "33333333-3333-3333-3333-333333333303",
  in4: "33333333-3333-3333-3333-333333333304",
  in5: "33333333-3333-3333-3333-333333333305",
  // Klaus
  kn1: "33333333-3333-3333-3333-333333333306",
  kn2: "33333333-3333-3333-3333-333333333307",
  kn3: "33333333-3333-3333-3333-333333333308",
  kn4: "33333333-3333-3333-3333-333333333309",
  // Rodrigo
  rn1: "33333333-3333-3333-3333-333333333310",
  rn2: "33333333-3333-3333-3333-333333333311",
  rn3: "33333333-3333-3333-3333-333333333312",
  // Sofia
  sn1: "33333333-3333-3333-3333-333333333313",
  sn2: "33333333-3333-3333-3333-333333333314",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns an ISO timestamp for N days ago at a realistic working hour. */
function daysAgo(days: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function log(msg: string) {
  console.log(`[seed-history] ${msg}`);
}

async function assertNoError(label: string, error: unknown) {
  if (error) {
    console.error(`[seed-history] ✗ ${label}:`, error);
    process.exit(1);
  }
}

// ─── 1. Field Notes ───────────────────────────────────────────────────────────

const FIELD_NOTES = [
  // Isabella (5)
  {
    id: NOTE_IDS.in1,
    author_id: LAWYERS.isabella,
    jurisdiction_code: "CO",
    jurisdiction_name: "Colombia",
    title: "Colombia FDI restrictions — what foreign tech investors need to know",
    content: `Colombia imposes sector-specific foreign investment restrictions under Law 9/1991 and Decree 2080/2000. Key sectors with caps: media (max 40% foreign ownership), defence (prohibited), and financial services (prior approval required from Superintendencia Financiera). For tech companies, the general regime allows 100% foreign ownership with no prior authorisation, but registration with the Banco de la República (Form 11) is mandatory within three months of the investment. Failure to register blocks profit repatriation. Watch for the "Zona Franca" incentive — 20% corporate tax rate versus 35% standard, applicable to tech service exporters.`,
    matter_type: "Regulatory",
    visibility: "firm",
    upvotes: 24,
    created_at: daysAgo(52, 9, 15),
  },
  {
    id: NOTE_IDS.in2,
    author_id: LAWYERS.isabella,
    jurisdiction_code: "CO",
    jurisdiction_name: "Colombia",
    title: "Cultural intelligence: Colombian business negotiation norms",
    content: `Colombian business culture is relationship-driven — expect multiple introductory meetings before substantive negotiation begins. Key norms: (1) Initial meetings are for trust-building, not deal-making. Attempting to close too early signals disrespect. (2) Hierarchy matters — ensure your team's seniority matches your counterpart's. Sending a junior to meet a senior partner is a common mistake by foreign firms. (3) "Mañana" culture applies to timelines; build buffer into all deadlines. (4) Regional differences are significant: Bogotá is more formal and European in style; Medellín is faster-paced and entrepreneurial; Cali is more relaxed. (5) Spanish communication is preferred even when counterparts are bilingual — making the effort signals respect.`,
    matter_type: null,
    visibility: "firm",
    upvotes: 31,
    created_at: daysAgo(44, 14, 30),
  },
  {
    id: NOTE_IDS.in3,
    author_id: LAWYERS.isabella,
    jurisdiction_code: "MX",
    jurisdiction_name: "Mexico",
    title: "Mexico Fintech Law — CNBV sandbox eligibility and application process",
    content: `Mexico's Fintech Law (Ley Fintech, March 2018) created the first comprehensive fintech regulatory framework in LatAm. Key points for sandbox applicants: The CNBV sandbox ("régimen de pruebas") allows companies to test products for up to 24 months with a temporary licence. Eligibility requires: (a) a genuine innovation that doesn't fit existing categories, (b) a defined test population (max 10,000 users), (c) Mexican legal entity incorporation. Common rejection reasons: insufficient consumer protection plan, unclear exit strategy if the test fails. Processing time averages 6-9 months. The CNBV has approved 19 sandbox applications since 2019. Important: sandbox approval does not guarantee a permanent licence — begin the full licensing process in parallel by month 12.`,
    matter_type: "Regulatory",
    visibility: "firm",
    upvotes: 19,
    created_at: daysAgo(35, 11, 0),
  },
  {
    id: NOTE_IDS.in4,
    author_id: LAWYERS.isabella,
    jurisdiction_code: "BR",
    jurisdiction_name: "Brazil",
    title: "Brazil LGPD — key obligations for tech companies processing personal data",
    content: `Brazil's Lei Geral de Proteção de Dados (LGPD, Law 13.709/2018) came into full enforcement in August 2021. Critical obligations for tech companies: (1) Legal basis: unlike GDPR, LGPD has 10 legal bases including "legitimate interest" and "protection of credit" — document your chosen basis for each processing activity. (2) DPO requirement: mandatory for companies processing large volumes of data. Unlike GDPR, no small-company exemption. (3) ANPD registration: the National Data Protection Authority (ANPD) will require operators to register; rules are still being finalised. (4) Data localisation: no hard localisation requirement, but data transfers to countries without "adequate" protection require specific safeguards (standard contractual clauses or binding corporate rules). (5) Penalties: up to 2% of revenue in Brazil, capped at BRL 50M per violation — lower than GDPR's 4% of global turnover.`,
    matter_type: "Data Privacy",
    visibility: "firm",
    upvotes: 28,
    created_at: daysAgo(21, 10, 45),
  },
  {
    id: NOTE_IDS.in5,
    author_id: LAWYERS.isabella,
    jurisdiction_code: "BR",
    jurisdiction_name: "Brazil",
    title: "Cross-border data transfers in LatAm — a practical guide for 2025",
    content: `Managing cross-border data flows across Brazil (LGPD), Colombia (Law 1581/2012), and Mexico (LFPDPPP) requires a coordinated approach. Summary of key differences: Brazil requires adequacy finding OR standard contractual clauses; Colombia requires prior CNAI registration for cross-border flows plus a Transmission Agreement; Mexico requires data transfer clauses in contracts and prohibits transfers to countries with "less" protection without consent. Practical strategy: use a single set of SCCs covering all three jurisdictions, supplemented by local addenda. The LGPD SCCs published by ANPD in 2023 are broadly compatible with Colombian requirements but need a Mexico-specific addendum. Recommended: centralise data processing through a single LatAm entity (Colombia is most flexible) with data processing agreements to each local entity.`,
    matter_type: "Data Privacy",
    visibility: "firm",
    upvotes: 22,
    created_at: daysAgo(9, 15, 0),
  },

  // Klaus (4)
  {
    id: NOTE_IDS.kn1,
    author_id: LAWYERS.klaus,
    jurisdiction_code: "DE",
    jurisdiction_name: "Germany",
    title: "Germany NIS2 Directive — implementation timeline and scope",
    content: `Germany's NIS2 Implementation Act (NIS2UmsuCG) came into force October 2024, implementing EU NIS2 Directive. Key changes from NIS1: scope expanded from ~4,500 to ~30,000 entities in Germany. New "important" entity category (in addition to "essential") with slightly lower obligations. Sectors added: waste management, space, public administration, postal services. Key obligations: (1) Risk management measures within 12 months of classification. (2) Incident reporting: significant incidents to BSI within 24h (initial) and 72h (detailed). (3) Management liability — board members personally liable for NIS2 compliance failures, including potential personal fines. (4) Supply chain security — assess and document third-party ICT risks. Registration with BSI is mandatory by April 2025 for in-scope entities. Many tech companies are surprised to find they qualify as "important entities" — check headcount (250+) AND revenue (€50M+) thresholds.`,
    matter_type: "Regulatory",
    visibility: "firm",
    upvotes: 18,
    created_at: daysAgo(48, 9, 0),
  },
  {
    id: NOTE_IDS.kn2,
    author_id: LAWYERS.klaus,
    jurisdiction_code: "DE",
    jurisdiction_name: "Germany",
    title: "GmbH vs AG for tech startups entering Germany — practical comparison",
    content: `The choice between GmbH and AG is critical for tech companies entering Germany and often misunderstood by foreign counsel. GmbH (Gesellschaft mit beschränkter Haftung): minimum capital €25,000 (can be paid in instalments — €12,500 upfront); flexible shareholder agreements; no mandatory supervisory board under 500 employees; notarisation of share transfers required (expensive, €500-2,000 per transfer). AG (Aktiengesellschaft): minimum capital €50,000 (fully paid on formation); shares freely transferable without notarisation; mandatory supervisory board once >500 employees (co-determination); better for IPO/funding rounds. For VC-backed startups: GmbH is standard in Germany (unlike UK/US preference for incorporated vehicles). A GmbH can issue virtual equity (VSOP) cost-effectively. If US investors insist on familiar structures, consider a Delaware HoldCo → German GmbH subsidiary structure, but get German tax advice first — the Hinzurechnungsbesteuerung rules can create unexpected CFC charges.`,
    matter_type: "M&A",
    visibility: "firm",
    upvotes: 15,
    created_at: daysAgo(33, 14, 0),
  },
  {
    id: NOTE_IDS.kn3,
    author_id: LAWYERS.klaus,
    jurisdiction_code: "EU",
    jurisdiction_name: "European Union",
    title: "GDPR Article 28 — data processing agreements checklist for 2025",
    content: `Article 28 GDPR requires a written contract (DPA) between controllers and processors. The EDPB has clarified several grey areas through enforcement actions since 2021. Essential clauses: (1) Subject matter, duration, nature and purpose of processing — must be specific, not generic. (2) Sub-processor approval — document whether it's general or specific authorisation; if general, require 30-day notice of new sub-processors. (3) Audit rights — "right to audit" clauses are required but "audit by documentation only" is acceptable per EDPB guidance if supplemented by a physical audit right. (4) Return/deletion — specify format and timeline; 30 days post-contract is standard. (5) International transfers — if processor is outside EEA, the DPA must incorporate SCCs or rely on adequacy decision (US: EU-US Data Privacy Framework, 2023). Common mistakes: (a) Using the processor's standard DPA without reviewing sub-processor lists; (b) Omitting technical/organisational measures specifics; (c) Failing to update DPAs after the EU-US Privacy Shield invalidation.`,
    matter_type: "Data Privacy",
    visibility: "firm",
    upvotes: 21,
    created_at: daysAgo(18, 10, 30),
  },
  {
    id: NOTE_IDS.kn4,
    author_id: LAWYERS.klaus,
    jurisdiction_code: "EU",
    jurisdiction_name: "European Union",
    title: "EU data sovereignty — practical compliance for SaaS companies in 2025",
    content: `Data sovereignty has moved from compliance aspiration to contractual demand in EU public sector and critical infrastructure procurement. What "sovereignty" means in practice: (1) Data residency — data stored and processed within EU borders. Cloud providers must offer region-locked deployments; verify at the storage layer, not just the application layer. (2) Operational sovereignty — EU-based staff with no access by non-EU personnel, including parent company staff. AWS, Azure, and GCP all offer "sovereign cloud" variants for this. (3) Legal sovereignty — no possibility of third-country law (e.g. US CLOUD Act) compelling disclosure. Requires EU-incorporated and EU-controlled cloud provider (e.g. OVHcloud, Deutsche Telekom's Open Telekom Cloud, T-Systems). (4) Financial sovereignty — ability to migrate data within 90 days if provider is acquired by non-EU entity. Recommendation: use GAIA-X framework and Trusted Cloud label as baseline for client discussions; it provides objective criteria.`,
    matter_type: "Regulatory",
    visibility: "firm",
    upvotes: 16,
    created_at: daysAgo(6, 11, 15),
  },

  // Rodrigo (3)
  {
    id: NOTE_IDS.rn1,
    author_id: LAWYERS.rodrigo,
    jurisdiction_code: "BR",
    jurisdiction_name: "Brazil",
    title: "Brazil LGPD enforcement — ANPD investigation priorities in 2025",
    content: `The ANPD (Autoridade Nacional de Proteção de Dados) has accelerated enforcement since obtaining independent agency status in 2022. 2025 priorities based on official communications: (1) Health data processors — highest risk category, two major investigations in progress. (2) Consent management in adtech — ANPD has signalled systematic review of cookie consent banners. (3) Data breach notification — ANPD expects notification within 2 business days of awareness of a significant breach; the 72-hour GDPR clock is not directly applicable but companies often use it as a proxy. (4) Children's data — ANPD published specific guidance in 2024; expect enforcement actions in EdTech sector. Practical note: ANPD's investigative procedure (PAS) is public record once initiated — early voluntary cooperation is strongly advisable to avoid public exposure before resolution.`,
    matter_type: "Data Privacy",
    visibility: "firm",
    upvotes: 12,
    created_at: daysAgo(41, 9, 30),
  },
  {
    id: NOTE_IDS.rn2,
    author_id: LAWYERS.rodrigo,
    jurisdiction_code: "BR",
    jurisdiction_name: "Brazil",
    title: "Fintech regulation in Brazil — Banco Central sandbox programme",
    content: `Banco Central do Brasil's regulatory sandbox (Resolution 4,865/2021) allows fintech companies to test innovative products for up to 36 months under a temporary authorisation. Four cohorts completed; fifth cohort open Q2 2025. Eligible activities: payment arrangements, credit operations, currency exchange, investment services. Key requirements: (1) Must demonstrate genuine innovation — incremental improvement insufficient. (2) Customer cap during testing: 50,000 for payment services, 10,000 for credit. (3) Mandatory consumer protection measures including a dedicated complaints channel. (4) Exit plan required: either full licence application or orderly wind-down. Success rate: approximately 70% of sandbox participants have achieved or applied for full authorisation. Notable participants: Nubank (credit card innovation), Pix QR code extensions, cross-border crypto payments. Important: sandbox approval does not suspend AML/KYC obligations — full Bacen AML compliance required from day one.`,
    matter_type: "Regulatory",
    visibility: "firm",
    upvotes: 9,
    created_at: daysAgo(26, 13, 45),
  },
  {
    id: NOTE_IDS.rn3,
    author_id: LAWYERS.rodrigo,
    jurisdiction_code: "CO",
    jurisdiction_name: "Colombia",
    title: "Colombia-Brazil trade — corporate structuring for cross-border operations",
    content: `The Colombia-Brazil bilateral relationship lacks a comprehensive double tax treaty (negotiations stalled since 2012), creating significant structuring considerations for businesses operating in both markets. Key issues: (1) Withholding tax on dividends: Brazil withholds 15% on dividends to Colombian residents (no treaty reduction); Colombia withholds 10% on dividends distributed to non-residents. (2) Royalties: Brazil withholds 15-25% on royalties paid to Colombia; no treaty reduction available. Best structure: for most tech companies, a holding entity in a treaty-friendly jurisdiction (Netherlands, Spain, or Luxembourg) between the CO and BR operating companies reduces overall WHT burden. (3) Transfer pricing: both countries have transfer pricing rules broadly aligned with OECD guidelines, but Brazil uses its own fixed-margin methodology (not arm's-length). This divergence can create double taxation on intra-group transactions — document carefully. (4) Corporate tax: Colombia 35%, Brazil 34% (25% IRPJ + 9% CSLL). The effective rate after state-level ICMS/ISS can reach 40%+ in Brazil.`,
    matter_type: "M&A",
    visibility: "firm",
    upvotes: 7,
    created_at: daysAgo(14, 10, 0),
  },

  // Sofia (2)
  {
    id: NOTE_IDS.sn1,
    author_id: LAWYERS.sofia,
    jurisdiction_code: "MX",
    jurisdiction_name: "Mexico",
    title: "Mexico fintech sandbox — CNBV application requirements and timeline",
    content: `Mexico's Fintech Law establishes a regulatory sandbox administered by the CNBV (Comisión Nacional Bancaria y de Valores). For companies seeking to test innovative financial products: Application requirements: (1) Detailed business plan with innovation justification — explain why existing licences are insufficient. (2) Consumer protection protocol — mandatory, must include compensation mechanism for losses during testing. (3) Technology security assessment — ISO 27001 certification or equivalent. (4) Mexican entity incorporation — at minimum an S.A.P.I. (Sociedad Anónima Promotora de Inversión). Processing time: 6-9 months from complete application. CNBV has been overwhelmed; informal pre-consultation meetings are strongly recommended before formal filing. User caps: 10,000 users maximum during the sandbox period. Duration: up to 24 months. Post-sandbox: apply for full ITF (Institución de Tecnología Financiera) licence, which requires minimum capital of MXN 500,000 (~USD 29,000) for payment services.`,
    matter_type: "Regulatory",
    visibility: "firm",
    upvotes: 6,
    created_at: daysAgo(38, 11, 0),
  },
  {
    id: NOTE_IDS.sn2,
    author_id: LAWYERS.sofia,
    jurisdiction_code: "MX",
    jurisdiction_name: "Mexico",
    title: "Foreign Direct Investment in Mexico — sector restrictions and 2025 updates",
    content: `Mexico's Foreign Investment Law (Ley de Inversión Extranjera) restricts or prohibits foreign investment in certain sectors. As of 2025: Prohibited (0% foreign investment): petroleum and other hydrocarbons, electricity generation (certain categories post-2021 reform), radioactive minerals, telegraphs, postal services, banking note issuance. Restricted (maximum 49%): national air transportation, shipping, freshwater fishing, fuel retail. Historically open but now subject to screening: mining, energy (following 2021 constitutional reform), electricity transmission. For tech companies: software, IT services, and e-commerce are fully open (100% foreign ownership permitted without prior authorisation). Exception: telecom concessions require FIC (Foreign Investment Commission) pre-approval above 49%. Important 2024 change: Mexico's COFECE (antitrust authority) now reviews foreign acquisitions in digital markets above MXN 18M transaction value — previously only larger thresholds triggered review. Nearshoring note: US-Mexico-Canada Agreement (USMCA) provides preferential treatment for US/Canadian investors — ensure investments are structured to maximise USMCA benefits.`,
    matter_type: "Regulatory",
    visibility: "firm",
    upvotes: 5,
    created_at: daysAgo(22, 14, 30),
  },
];

// ─── 2. Completed Matters ─────────────────────────────────────────────────────

const COMPLETED_MATTERS = [
  {
    id: MATTER_IDS.isabellaMatter1,
    title: "Bancolombia LatAm Expansion 2025",
    client_name: "Bancolombia S.A.",
    matter_type: "Regulatory",
    description: "Cross-border regulatory advisory for Bancolombia's expansion into Mexico and Brazil. Covered FDI approvals, fintech licensing, and data protection compliance across three jurisdictions.",
    status: "completed",
    lead_lawyer_id: LAWYERS.isabella,
    deadline: "2025-06-30T00:00:00Z",
    created_at: daysAgo(130, 9, 0),
    jurisdictions: [
      { code: "CO", name: "Colombia" },
      { code: "BR", name: "Brazil" },
      { code: "MX", name: "Mexico" },
    ],
    team: [
      { lawyer_id: LAWYERS.isabella, role: "lead" },
      { lawyer_id: LAWYERS.rodrigo, role: "collaborator" },
      { lawyer_id: LAWYERS.sofia, role: "collaborator" },
    ],
  },
  {
    id: MATTER_IDS.isabellaMatter2,
    title: "TechFin Mexico Entry",
    client_name: "TechFin Group",
    matter_type: "Regulatory",
    description: "Full-service entry into the Mexican fintech market including CNBV sandbox application, CNBV ITF licence preparation, and AML compliance programme.",
    status: "completed",
    lead_lawyer_id: LAWYERS.isabella,
    deadline: "2025-04-15T00:00:00Z",
    created_at: daysAgo(105, 10, 0),
    jurisdictions: [
      { code: "MX", name: "Mexico" },
      { code: "CO", name: "Colombia" },
    ],
    team: [
      { lawyer_id: LAWYERS.isabella, role: "lead" },
      { lawyer_id: LAWYERS.sofia, role: "collaborator" },
    ],
  },
  {
    id: MATTER_IDS.isabellaMatter3,
    title: "Startup BR LGPD Compliance Programme",
    client_name: "Startup BR Ltda.",
    matter_type: "Data Privacy",
    description: "End-to-end LGPD compliance programme for a Brazilian SaaS startup preparing for Series B. Included data mapping, DPA templates, privacy policy, and ANPD registration.",
    status: "completed",
    lead_lawyer_id: LAWYERS.isabella,
    deadline: "2025-03-01T00:00:00Z",
    created_at: daysAgo(90, 11, 0),
    jurisdictions: [
      { code: "BR", name: "Brazil" },
    ],
    team: [
      { lawyer_id: LAWYERS.isabella, role: "lead" },
      { lawyer_id: LAWYERS.rodrigo, role: "collaborator" },
    ],
  },
  {
    id: MATTER_IDS.klausMatter1,
    title: "Deutsche Bank EU Compliance 2025",
    client_name: "Deutsche Bank AG",
    matter_type: "Regulatory",
    description: "NIS2 compliance programme and DORA readiness assessment for Deutsche Bank's digital banking division. Covered risk management framework, incident response procedures, and third-party ICT oversight.",
    status: "completed",
    lead_lawyer_id: LAWYERS.klaus,
    deadline: "2025-05-31T00:00:00Z",
    created_at: daysAgo(115, 9, 0),
    jurisdictions: [
      { code: "DE", name: "Germany" },
      { code: "EU", name: "European Union" },
    ],
    team: [
      { lawyer_id: LAWYERS.klaus, role: "lead" },
    ],
  },
];

// ─── 3. Reputation Events ─────────────────────────────────────────────────────

const REPUTATION_EVENTS = [
  // ── Isabella (target 1,840) ──────────────────────────────────────────────
  // Historical (>30 days): 5 events
  { lawyer_id: LAWYERS.isabella, event_type: "profile_completed",   points: 60,  description: "Completed profile (one-time bonus)",           matter_id: null, created_at: daysAgo(58, 9, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "cross_border_matter", points: 100, description: "Led Bancolombia LatAm Expansion 2025",          matter_id: MATTER_IDS.isabellaMatter1, created_at: daysAgo(55, 10, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "matter_joined",       points: 30,  description: "Joined matter: Bancolombia LatAm Expansion",    matter_id: MATTER_IDS.isabellaMatter1, created_at: daysAgo(52, 11, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "brief_generated",     points: 50,  description: "Jurisdiction brief generated — Colombia",       matter_id: MATTER_IDS.isabellaMatter1, created_at: daysAgo(48, 14, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "note_contributed",    points: 40,  description: "Contributed field note: Colombia FDI restrictions", matter_id: null, created_at: daysAgo(46, 9, 15) },
  // Recent (<30 days): 16 events
  { lawyer_id: LAWYERS.isabella, event_type: "cross_border_matter", points: 100, description: "Led TechFin Mexico Entry",                      matter_id: MATTER_IDS.isabellaMatter2, created_at: daysAgo(28, 9, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "note_contributed",    points: 40,  description: "Contributed field note: Colombian business culture", matter_id: null, created_at: daysAgo(25, 14, 30) },
  { lawyer_id: LAWYERS.isabella, event_type: "handoff_completed",   points: 25,  description: "Received a task handoff",                       matter_id: MATTER_IDS.isabellaMatter2, created_at: daysAgo(23, 10, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "matter_joined",       points: 30,  description: "Joined matter: TechFin Mexico Entry",           matter_id: MATTER_IDS.isabellaMatter2, created_at: daysAgo(21, 11, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "match_accepted",      points: 20,  description: "Invited a lawyer to a matter",                  matter_id: MATTER_IDS.isabellaMatter2, created_at: daysAgo(19, 15, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "brief_generated",     points: 50,  description: "Jurisdiction brief generated — Mexico",         matter_id: MATTER_IDS.isabellaMatter2, created_at: daysAgo(17, 9, 30) },
  { lawyer_id: LAWYERS.isabella, event_type: "note_upvoted",        points: 10,  description: "Field note upvoted: Colombia FDI restrictions", matter_id: null, created_at: daysAgo(16, 11, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "cross_border_matter", points: 100, description: "Led Startup BR LGPD Compliance Programme",      matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(14, 9, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "note_contributed",    points: 40,  description: "Contributed field note: Brazil LGPD obligations", matter_id: null, created_at: daysAgo(12, 10, 45) },
  { lawyer_id: LAWYERS.isabella, event_type: "handoff_completed",   points: 25,  description: "Received a task handoff",                       matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(10, 14, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "matter_joined",       points: 30,  description: "Joined matter: Startup BR LGPD Compliance",     matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(8, 9, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "note_upvoted",        points: 10,  description: "Field note upvoted: Colombian culture",         matter_id: null, created_at: daysAgo(7, 11, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "match_accepted",      points: 20,  description: "Invited a lawyer to a matter",                  matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(5, 15, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "note_contributed",    points: 40,  description: "Contributed field note: LatAm data transfers",  matter_id: null, created_at: daysAgo(3, 10, 0) },
  { lawyer_id: LAWYERS.isabella, event_type: "brief_generated",     points: 50,  description: "Jurisdiction brief generated — Brazil",         matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(1, 14, 0) },

  // ── Klaus (target 1,200) ─────────────────────────────────────────────────
  // Historical (>30 days): 4 events
  { lawyer_id: LAWYERS.klaus, event_type: "profile_completed",   points: 60,  description: "Completed profile (one-time bonus)",           matter_id: null, created_at: daysAgo(57, 9, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "cross_border_matter", points: 100, description: "Led Deutsche Bank EU Compliance 2025",         matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(53, 10, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "matter_joined",       points: 30,  description: "Joined matter: Deutsche Bank EU Compliance",   matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(50, 11, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "brief_generated",     points: 50,  description: "Jurisdiction brief generated — Germany",       matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(47, 14, 0) },
  // Recent (<30 days): 12 events
  { lawyer_id: LAWYERS.klaus, event_type: "matter_joined",       points: 30,  description: "Joined a new matter",                          matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(28, 9, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "note_contributed",    points: 40,  description: "Contributed field note: Germany NIS2",         matter_id: null, created_at: daysAgo(24, 9, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "match_accepted",      points: 20,  description: "Invited a lawyer to a matter",                 matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(20, 10, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "handoff_completed",   points: 25,  description: "Received a task handoff",                      matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(17, 14, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "cross_border_matter", points: 100, description: "Cross-border matter contribution",             matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(14, 9, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "note_upvoted",        points: 10,  description: "Field note upvoted: Germany NIS2",             matter_id: null, created_at: daysAgo(12, 11, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "match_accepted",      points: 20,  description: "Invited a lawyer to a matter",                 matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(10, 15, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "note_contributed",    points: 40,  description: "Contributed field note: GDPR Article 28",      matter_id: null, created_at: daysAgo(8, 9, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "handoff_completed",   points: 25,  description: "Received a task handoff",                      matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(6, 10, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "handoff_completed",   points: 25,  description: "Received a task handoff",                      matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(4, 14, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "matter_joined",       points: 30,  description: "Joined a matter",                              matter_id: MATTER_IDS.klausMatter1, created_at: daysAgo(2, 9, 0) },
  { lawyer_id: LAWYERS.klaus, event_type: "note_upvoted",        points: 10,  description: "Field note upvoted: GmbH vs AG",               matter_id: null, created_at: daysAgo(1, 11, 0) },

  // ── Rodrigo (target 890) ─────────────────────────────────────────────────
  // Historical (>30 days): 4 events
  { lawyer_id: LAWYERS.rodrigo, event_type: "profile_completed",   points: 60,  description: "Completed profile (one-time bonus)",              matter_id: null, created_at: daysAgo(59, 9, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "matter_joined",       points: 30,  description: "Joined matter: Bancolombia LatAm Expansion",      matter_id: MATTER_IDS.isabellaMatter1, created_at: daysAgo(54, 10, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "brief_generated",     points: 50,  description: "Jurisdiction brief generated — Brazil",           matter_id: MATTER_IDS.isabellaMatter1, created_at: daysAgo(49, 14, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "cross_border_matter", points: 100, description: "Contributed to cross-border matter",              matter_id: MATTER_IDS.isabellaMatter1, created_at: daysAgo(45, 11, 0) },
  // Recent (<30 days): 11 events
  { lawyer_id: LAWYERS.rodrigo, event_type: "matter_joined",       points: 30,  description: "Joined matter: Startup BR LGPD Compliance",       matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(27, 9, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "note_contributed",    points: 40,  description: "Contributed field note: LGPD enforcement",        matter_id: null, created_at: daysAgo(23, 10, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "handoff_completed",   points: 25,  description: "Received a task handoff",                         matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(20, 14, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "cross_border_matter", points: 100, description: "Cross-border matter contribution",                matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(16, 9, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "note_upvoted",        points: 10,  description: "Field note upvoted: Brazil LGPD enforcement",     matter_id: null, created_at: daysAgo(13, 11, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "match_accepted",      points: 20,  description: "Invited a lawyer to a matter",                    matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(11, 15, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "note_contributed",    points: 40,  description: "Contributed field note: Banco Central sandbox",   matter_id: null, created_at: daysAgo(8, 9, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "brief_generated",     points: 50,  description: "Jurisdiction brief generated — Brazil",           matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(5, 10, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "matter_joined",       points: 30,  description: "Joined a new matter",                             matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(3, 9, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "handoff_completed",   points: 25,  description: "Received a task handoff",                         matter_id: MATTER_IDS.isabellaMatter3, created_at: daysAgo(1, 14, 0) },
  { lawyer_id: LAWYERS.rodrigo, event_type: "note_contributed",    points: 40,  description: "Contributed field note: Colombia-Brazil trade",    matter_id: null, created_at: daysAgo(0, 10, 0) },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  log("Starting seed-history...");

  const seededLawyers = [LAWYERS.isabella, LAWYERS.klaus, LAWYERS.rodrigo, LAWYERS.sofia];
  const seededMatterIds = Object.values(MATTER_IDS);
  const seededNoteIds = Object.values(NOTE_IDS);

  // ── Clean up ──────────────────────────────────────────────────────────────
  log("Cleaning up existing seeded data...");

  const { error: eventsDeleteError } = await supabase
    .from("reputation_events")
    .delete()
    .in("lawyer_id", seededLawyers);
  await assertNoError("delete reputation_events", eventsDeleteError);

  const { error: notesDeleteError } = await supabase
    .from("field_notes")
    .delete()
    .in("id", seededNoteIds);
  await assertNoError("delete field_notes", notesDeleteError);

  // Delete matter data in dependency order
  const { error: teamDeleteError } = await supabase
    .from("matter_team")
    .delete()
    .in("matter_id", seededMatterIds);
  await assertNoError("delete matter_team", teamDeleteError);

  const { error: mjDeleteError } = await supabase
    .from("matter_jurisdictions")
    .delete()
    .in("matter_id", seededMatterIds);
  await assertNoError("delete matter_jurisdictions", mjDeleteError);

  const { error: mattersDeleteError } = await supabase
    .from("matters")
    .delete()
    .in("id", seededMatterIds);
  await assertNoError("delete matters", mattersDeleteError);

  log("Cleanup done.");

  // ── Field notes ───────────────────────────────────────────────────────────
  log(`Inserting ${FIELD_NOTES.length} field notes...`);
  const { error: notesError } = await supabase.from("field_notes").insert(FIELD_NOTES);
  await assertNoError("insert field_notes", notesError);
  log(`✓ ${FIELD_NOTES.length} field notes inserted.`);

  // ── Completed matters ──────────────────────────────────────────────────────
  log(`Inserting ${COMPLETED_MATTERS.length} completed matters...`);

  for (const matter of COMPLETED_MATTERS) {
    const { jurisdictions, team, ...matterRow } = matter;

    const { error: matterError } = await supabase.from("matters").insert(matterRow);
    await assertNoError(`insert matter: ${matter.title}`, matterError);

    const { error: mjError } = await supabase.from("matter_jurisdictions").insert(
      jurisdictions.map((j) => ({
        matter_id: matter.id,
        jurisdiction_code: j.code,
        jurisdiction_name: j.name,
      }))
    );
    await assertNoError(`insert matter_jurisdictions: ${matter.title}`, mjError);

    const { error: teamError } = await supabase.from("matter_team").insert(
      team.map((t) => ({ matter_id: matter.id, ...t }))
    );
    await assertNoError(`insert matter_team: ${matter.title}`, teamError);
  }

  log(`✓ ${COMPLETED_MATTERS.length} completed matters inserted.`);

  // ── Reputation events ──────────────────────────────────────────────────────
  log(`Inserting ${REPUTATION_EVENTS.length} reputation events...`);
  const { error: eventsError } = await supabase.from("reputation_events").insert(REPUTATION_EVENTS);
  await assertNoError("insert reputation_events", eventsError);
  log(`✓ ${REPUTATION_EVENTS.length} reputation events inserted.`);

  // ── Summary ───────────────────────────────────────────────────────────────
  log("─────────────────────────────────────");
  log("Seed complete. Summary:");
  log(`  Field notes:        ${FIELD_NOTES.length} (Isabella: 5, Klaus: 4, Rodrigo: 3, Sofia: 2)`);
  log(`  Completed matters:  ${COMPLETED_MATTERS.length} (Isabella: 3, Klaus: 1)`);
  log(`  Reputation events:  ${REPUTATION_EVENTS.length}`);
  log("  Expected scores: Isabella 1,840 · Klaus 1,200 · Rodrigo 890");
  log("─────────────────────────────────────");
}

main().catch((err) => {
  console.error("[seed-history] Fatal error:", err);
  process.exit(1);
});
