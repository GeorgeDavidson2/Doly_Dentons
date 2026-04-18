import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewMatterForm from "./_components/NewMatterForm";

export default async function NewMatterPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-2xl">
        <NewMatterForm />
      </main>

  );
}
