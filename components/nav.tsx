"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Send, Users, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/send", label: "Send", icon: Send },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/history", label: "Activity", icon: Clock },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl safe-bottom md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]"
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-primary/10 text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className={cn(active ? "font-medium text-primary" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card/60 px-4 py-8 md:flex">
      <div className="px-2 mb-10">
        <Logo size={26} />
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/settings"
        className="rounded-2xl px-3.5 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        Settings
      </Link>
    </aside>
  );
}
