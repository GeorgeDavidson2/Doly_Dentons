"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const AUTH_PATHS = ["/login", "/signup", "/auth/callback"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      {/* pt-14 offsets the fixed mobile top bar on small screens */}
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
