import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getMatterDetail } from "../_lib/getMatter";
import ContextTab from "./_components/ContextTab";
import type { Brief } from "./_components/BriefCard";

export default async function ContextPage({
  params,
}: {
  params: { id: string };
}) {
  // getMatterDetail is React-cached — deduplicates with the layout's call
  const matter = await getMatterDetail(params.id);
  if (!matter) notFound();

  // Fetch full brief content (getMatterDetail only returns brief status)
  const service = createServiceClient();
  const { data: briefs } = await service
    .from("context_briefs")
    .select(
      "id, jurisdiction_code, jurisdiction_name, status, legal_landscape, cultural_intelligence, regulatory_notes"
    )
    .eq("matter_id", params.id)
    .order("jurisdiction_code");

  return (
    <ContextTab
      matterId={params.id}
      initialBriefs={(briefs ?? []) as Brief[]}
      jurisdictions={matter.matter_jurisdictions.map((j) => ({
        jurisdiction_code: j.jurisdiction_code,
        jurisdiction_name: j.jurisdiction_name,
      }))}
    />
  );
}
