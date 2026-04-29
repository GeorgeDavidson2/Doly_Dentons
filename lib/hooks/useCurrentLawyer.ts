"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CurrentLawyer = {
  name: string;
  avatarUrl: string | null;
};

/**
 * Returns the logged-in user's lawyer profile (name + avatar) for header chrome.
 * Returns `null` while loading or if no matching lawyer row exists.
 *
 * Used by both the desktop TopBar and the mobile top bar in Sidebar so they
 * stay in sync without duplicate Supabase fetches.
 */
export function useCurrentLawyer(): CurrentLawyer | null {
  const [lawyer, setLawyer] = useState<CurrentLawyer | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (cancelled || !user?.email) return;
      const { data } = await supabase
        .from("lawyers")
        .select("full_name, avatar_url")
        .eq("email", user.email)
        .maybeSingle();
      if (cancelled || !data) return;
      setLawyer({
        name: data.full_name as string,
        avatarUrl: (data.avatar_url as string | null) ?? null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return lawyer;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
