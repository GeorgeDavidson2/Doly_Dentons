import { cache } from "react";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export type MatterDetail = {
  id: string;
  title: string;
  description: string;
  client_name: string;
  matter_type: string;
  status: "active" | "completed" | "archived";
  deadline: string | null;
  created_at: string;
  matter_jurisdictions: {
    id: string;
    jurisdiction_code: string;
    jurisdiction_name: string;
  }[];
  matter_team: {
    id: string;
    role: "lead" | "collaborator" | "reviewer";
    status: "pending" | "accepted" | "declined";
    match_score: number | null;
    joined_at: string;
    lawyer: {
      id: string;
      full_name: string;
      title: string;
      office_city: string;
      office_country: string;
      reputation_score: number;
      avatar_url: string | null;
    } | null;
  }[];
  context_briefs: {
    id: string;
    jurisdiction_code: string;
    jurisdiction_name: string;
    status: "generating" | "ready" | "error";
  }[];
};

// React cache deduplicates this call within the same request when layout + page both invoke it
export const getMatterDetail = cache(async (id: string): Promise<MatterDetail | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  if (!user.email) return null;
  const service = createServiceClient();

  const { data: lawyer, error: lawyerError } = await service
    .from("lawyers")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (lawyerError || !lawyer) return null;

  const { data: membership, error: membershipError } = await service
    .from("matter_team")
    .select("role")
    .eq("matter_id", id)
    .eq("lawyer_id", lawyer.id)
    .maybeSingle();

  if (membershipError || !membership) return null;

  const { data: matter, error: matterError } = await service
    .from("matters")
    .select(`
      id, title, description, client_name, matter_type, status, deadline, created_at,
      matter_jurisdictions(id, jurisdiction_code, jurisdiction_name),
      matter_team(
        id, role, status, match_score, joined_at,
        lawyer:lawyers(id, full_name, title, office_city, office_country, reputation_score, avatar_url)
      ),
      context_briefs(id, jurisdiction_code, jurisdiction_name, status)
    `)
    .eq("id", id)
    .maybeSingle();

  if (matterError) return null;
  return matter as unknown as MatterDetail | null;
});
