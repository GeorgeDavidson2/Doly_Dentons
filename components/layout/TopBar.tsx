"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bell, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PendingInvite, ActivityEvent } from "@/app/api/notifications/route";

const STORAGE_KEY = "bell_last_seen";

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  return parts.length >= 2
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : name[0].toUpperCase();
}

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function InviteRow({
  invite,
  onRespond,
}: {
  invite: PendingInvite;
  onRespond: (matterId: string, action: "accept" | "decline") => Promise<void>;
}) {
  const [loading, setLoading] = useState<"accept" | "decline" | null>(null);

  async function handle(action: "accept" | "decline") {
    setLoading(action);
    try {
      await onRespond(invite.matter_id, action);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="px-4 py-3 bg-brand-purple/5 border-b border-gray-100">
      <p className="text-xs font-medium text-gray-800 leading-relaxed">
        You've been invited to{" "}
        <span className="text-brand-purple">{invite.matter_title}</span>
      </p>
      <p className="text-[11px] text-gray-400 mt-0.5 mb-2">
        as {invite.role} · {relativeTime(invite.invited_at)}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void handle("accept")}
          disabled={loading !== null}
          className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1 bg-brand-purple text-white rounded-lg hover:bg-brand-purple-dark disabled:opacity-50 transition-colors"
        >
          {loading === "accept" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
          Accept
        </button>
        <button
          type="button"
          onClick={() => void handle("decline")}
          disabled={loading !== null}
          className="flex items-center gap-1 text-[11px] font-medium px-3 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {loading === "decline" && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
          Decline
        </button>
      </div>
    </div>
  );
}

export default function TopBar() {
  const [name, setName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<number>(0);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (Number.isFinite(parsed)) setLastSeen(parsed);
    }
  }, []);

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

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setInvites(data.invites ?? []);
      setEvents(data.events ?? []);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [bellOpen]);

  const newEventsCount = events.filter(
    (e) => new Date(e.created_at).getTime() > lastSeen
  ).length;
  const unreadCount = invites.length + newEventsCount;

  function handleBellClick() {
    if (!bellOpen) {
      const now = Date.now();
      setLastSeen(now);
      localStorage.setItem(STORAGE_KEY, String(now));
    }
    setBellOpen((v) => !v);
  }

  async function handleRespond(matterId: string, action: "accept" | "decline") {
    const res = await fetch(`/api/matters/${matterId}/team`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      // Remove invite from list and re-fetch events to pick up new rep event on accept
      setInvites((prev) => prev.filter((i) => i.matter_id !== matterId));
      if (action === "accept") await fetchNotifications();
    }
  }

  if (!name) return null;

  const hasContent = invites.length > 0 || events.length > 0;

  return (
    <div className="h-14 flex items-center justify-end gap-3 px-6 border-b border-gray-100 bg-white flex-shrink-0">
      {/* Bell */}
      <div className="relative" ref={bellRef}>
        <button
          type="button"
          onClick={handleBellClick}
          className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {bellOpen && (
          <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Notifications</p>
            </div>

            {!hasContent && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-gray-400">No activity yet</p>
              </div>
            )}

            {/* Pending invites */}
            {invites.map((invite) => (
              <InviteRow key={invite.id} invite={invite} onRespond={handleRespond} />
            ))}

            {/* Past activity */}
            {events.length > 0 && (
              <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {events.map((e) => (
                  <div key={e.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-700 leading-relaxed">{e.description}</p>
                      <span className="text-[11px] font-semibold text-green-600 flex-shrink-0">
                        +{e.points}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      {e.matter_title && (
                        <span className="text-[11px] text-brand-purple truncate max-w-[160px]">
                          {e.matter_title}
                        </span>
                      )}
                      {e.matter_title && (
                        <span className="text-[11px] text-gray-300">·</span>
                      )}
                      <span className="text-[11px] text-gray-400">{relativeTime(e.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-2.5 border-t border-gray-100">
              <Link
                href="/reputation"
                onClick={() => setBellOpen(false)}
                className="text-xs text-brand-purple font-medium hover:underline"
              >
                View full history →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Profile */}
      <Link
        href="/profile"
        aria-label="My profile"
        className="flex items-center gap-2.5 group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple/50"
        title="My profile"
      >
        <span className="text-sm text-gray-500 group-hover:text-gray-700 transition-colors hidden sm:block">
          {name}
        </span>
        <div className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center flex-shrink-0 group-hover:bg-brand-purple/20 transition-colors overflow-hidden">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={32}
              height={32}
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
