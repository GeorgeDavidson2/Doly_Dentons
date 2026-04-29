"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type CurrentLawyer = {
  name: string;
  avatarUrl: string | null;
};

// Module-level cache + in-flight promise so multiple components mounting at
// once (TopBar + Sidebar) share a single Supabase fetch instead of racing.
let cached: CurrentLawyer | null = null;
let inflight: Promise<CurrentLawyer | null> | null = null;

async function fetchCurrentLawyer(): Promise<CurrentLawyer | null> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const { data } = await supabase
      .from("lawyers")
      .select("full_name, avatar_url")
      .eq("email", user.email)
      .maybeSingle();
    if (!data) return null;

    cached = {
      name: data.full_name as string,
      avatarUrl: (data.avatar_url as string | null) ?? null,
    };
    return cached;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

/**
 * Returns the logged-in user's lawyer profile (name + avatar) for header chrome.
 * Returns `null` while loading or if no matching lawyer row exists.
 *
 * Backed by a module-level cache + in-flight promise dedup, so simultaneous
 * mounts of TopBar and Sidebar share a single Supabase round-trip.
 */
export function useCurrentLawyer(): CurrentLawyer | null {
  const [lawyer, setLawyer] = useState<CurrentLawyer | null>(cached);

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    void fetchCurrentLawyer().then((result) => {
      if (!cancelled && result) setLawyer(result);
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
