import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-zen-mesh opacity-60 dark:opacity-40" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-10">
        <div className="mb-10 flex justify-center">
          <Logo size={26} />
        </div>
        <div className="flex flex-1 flex-col animate-fade-up">{children}</div>
      </div>
    </div>
  );
}
