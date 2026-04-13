import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import ProfileForm from "./_components/ProfileForm";
import type { Lawyer, LawyerJurisdiction, LawyerAvailability } from "@/types";

export default async function ProfilePage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Look up by email — seed data IDs don't match auth UIDs
  const { data: lawyer } = await supabase
    .from("lawyers")
    .select("id, full_name, title, office_city, office_country, timezone, languages, bio, avatar_url, reputation_score, matters_count, contributions")
    .eq("email", user.email)
    .single();

  if (!lawyer) redirect("/dashboard");

  const [jurisdictionsResult, availabilityResult] = await Promise.all([
    supabase
      .from("lawyer_jurisdictions")
      .select("*")
      .eq("lawyer_id", lawyer.id)
      .order("expertise_level", { ascending: false }),
    supabase
      .from("lawyer_availability")
      .select("*")
      .eq("lawyer_id", lawyer.id)
      .order("day_of_week"),
  ]);

  return (
    <div className="flex min-h-screen bg-brand-grey-bg">
      <Sidebar />
      <main className="flex-1 p-8 max-w-3xl">
        <ProfileForm
          lawyer={lawyer as Lawyer}
          jurisdictions={(jurisdictionsResult.data ?? []) as LawyerJurisdiction[]}
          availability={(availabilityResult.data ?? []) as LawyerAvailability[]}
        />
      </main>
    </div>
  );
}
