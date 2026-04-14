import { notFound } from "next/navigation";
import { getMatterDetail } from "../_lib/getMatter";
import ConnectTab from "./_components/ConnectTab";

export default async function ConnectPage({
  params,
}: {
  params: { id: string };
}) {
  const matter = await getMatterDetail(params.id);
  if (!matter) notFound();

  const teamLawyerIds = matter.matter_team
    .map((m) => m.lawyer?.id)
    .filter((id): id is string => !!id);

  return (
    <ConnectTab
      matterId={params.id}
      teamLawyerIds={teamLawyerIds}
    />
  );
}
