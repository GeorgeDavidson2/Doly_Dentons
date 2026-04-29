"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

const AUTH_PATHS = ["/login", "/signup", "/auth/callback"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Scrolling now happens inside this container, not on `window` — so Next.js'
  // default scroll-to-top on route change doesn't fire. Reset it ourselves.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      {/* Right side: top bar + page content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar is hidden on mobile (Sidebar handles the mobile header) */}
        <div className="hidden lg:block">
          <TopBar />
        </div>
        {/* pt-14 offsets the fixed mobile top bar on small screens */}
        {/* Pages render their own <main> inside this scrollable wrapper */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto pt-14 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
