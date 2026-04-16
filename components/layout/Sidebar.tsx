"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Briefcase, FileText, Award, LogOut, Menu, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/lawyers",     label: "Lawyers",      icon: Users },
  { href: "/matters",     label: "Matters",      icon: Briefcase },
  { href: "/field-notes", label: "Field Notes",  icon: FileText },
  { href: "/reputation",  label: "Reputation",   icon: Award },
];

function NavLinks({ pathname, onNav }: { pathname: string; onNav?: () => void }) {
  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onNav}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-white/20 text-white"
                : "text-white/60 hover:text-white hover:bg-white/10"
            }`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        );
      })}
    </>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xl font-bold text-white">Doly</span>
      <span className="text-[10px] font-semibold tracking-widest uppercase px-1.5 py-0.5 border border-white/40 text-white/70 rounded">
        Dentons
      </span>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) { console.error("Sign-out failed:", error.message); return; }
    router.refresh();
    router.push("/login");
  }

  return (
    <>
      {/* ── Desktop sidebar (lg+) ─────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 min-h-screen bg-brand-purple flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <Logo />
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile / tablet top bar (below lg) ───────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-brand-purple flex items-center justify-between px-4 h-14 border-b border-white/10">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/profile" className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
            <span className="text-white text-xs font-semibold">Me</span>
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="text-white/70 hover:text-white p-1"
            aria-label="Open navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Mobile drawer overlay ─────────────────────────────────────── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="relative w-64 bg-brand-purple flex flex-col h-full shadow-xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="text-white/70 hover:text-white p-1"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              <NavLinks pathname={pathname} onNav={() => setMobileOpen(false)} />
            </nav>
            <div className="p-4 border-t border-white/10">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
