"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Monitor,
  Bell,
  ShieldCheck,
  Wallet,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session-store";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const logout = useSessionStore((s) => s.logout);
  const push = usePushNotifications();

  function handleLogout() {
    logout();
    router.push("/signup");
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 font-display text-2xl font-semibold">Settings</h1>

      <Section title="Appearance">
        <div className="flex gap-2 p-4">
          {[
            { value: "light", icon: Sun, label: "Light" },
            { value: "dark", icon: Moon, label: "Dark" },
            { value: "system", icon: Monitor, label: "System" },
          ].map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1.5 rounded-2xl border py-3 text-xs font-medium transition-colors",
                theme === value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground",
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Notifications">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Bell className="h-4.5 w-4.5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">Push notifications</p>
            <p className="text-xs text-muted-foreground">
              {push.status === "unsupported"
                ? "Not supported on this browser"
                : push.status === "granted"
                  ? "Get notified when you receive money"
                  : "Off — enable to get notified instantly"}
            </p>
          </div>
          {push.loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : push.status === "unsupported" ? null : (
            <Button
              variant={push.status === "granted" ? "secondary" : "glow"}
              size="sm"
              onClick={() => (push.status === "granted" ? push.disable() : push.enable())}
            >
              {push.status === "granted" ? "Turn off" : "Enable"}
            </Button>
          )}
        </div>
      </Section>

      <Section title="Security">
        <Row icon={<ShieldCheck className="h-4.5 w-4.5" />} label="Change passcode" href="#" />
      </Section>

      <Section title="Wallet">
        <Row icon={<Wallet className="h-4.5 w-4.5" />} label="Wallet & recovery" href="/settings/wallet" />
      </Section>

      <Button variant="outline" size="lg" className="mt-6 w-full text-destructive" onClick={handleLogout}>
        <LogOut className="h-4 w-4" /> Log out
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <Card className="overflow-hidden p-0">{children}</Card>
    </div>
  );
}

function Row({ icon, label, trailing, href }: { icon: React.ReactNode; label: string; trailing?: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {trailing && <span className="text-sm text-muted-foreground">{trailing}</span>}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
