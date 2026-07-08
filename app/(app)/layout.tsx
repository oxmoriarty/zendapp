"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/store/session-store";
import { BottomNav, SideNav } from "@/components/nav";
import { OfflineBanner } from "@/components/offline-banner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) router.replace("/signup");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-dvh bg-background">
      <OfflineBanner />
      <SideNav />
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-6 md:ml-64 md:max-w-3xl md:px-8 md:pb-10 md:pt-10">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
