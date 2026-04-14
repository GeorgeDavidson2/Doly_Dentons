import { redirect } from "next/navigation";

export default function MatterPage({ params }: { params: { id: string } }) {
  redirect(`/matters/${params.id}/overview`);
}
