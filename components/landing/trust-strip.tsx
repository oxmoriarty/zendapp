import { Lock, Zap, Wallet } from "lucide-react";

const ITEMS = [
  { icon: Lock, label: "Non-custodial — your keys never leave your device" },
  { icon: Zap, label: "Instant, final payments on Arc" },
  { icon: Wallet, label: "One simple USDC balance, always" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-border bg-surface-sunken">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 sm:grid-cols-3">
        {ITEMS.map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="h-4.5 w-4.5" />
            </span>
            <p className="text-sm font-medium text-foreground">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
