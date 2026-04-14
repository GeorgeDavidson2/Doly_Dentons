import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import NewMatterForm from "./_components/NewMatterForm";

export default async function NewMatterPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-brand-grey-bg">
      <Sidebar />
      <main className="flex-1 p-8 max-w-2xl">
        <NewMatterForm />
      </main>
    </div>
  );
}
