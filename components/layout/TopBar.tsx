"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name[0].toUpperCase();
}

export default function TopBar() {
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;

      const { data } = await supabase
        .from("lawyers")
        .select("full_name, avatar_url")
        .eq("email", user.email)
        .single();

      if (data) {
        setName(data.full_name);
        setAvatarUrl(data.avatar_url ?? null);
      }
    });
  }, []);

  if (!name) return null;

  return (
    <div className="h-14 flex items-center justify-end px-6 border-b border-gray-100 bg-white flex-shrink-0">
      <Link
        href="/profile"
        className="flex items-center gap-2.5 group"
        title="My profile"
      >
        <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors hidden sm:block">
          {name}
        </span>
        <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-purple/20 transition-colors overflow-hidden">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-brand-purple font-semibold text-xs">
              {getInitials(name)}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
