"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Deliberately minimal: just the mark on the far left and the two account
 * actions on the far right. With no in-between links to collapse, there's
 * no mobile hamburger menu either - both actions render at every width.
 */
export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-colors duration-300",
        scrolled ? "border-b border-border bg-background/80 backdrop-blur-xl" : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="Zendapp home" className="transition-opacity duration-200 hover:opacity-80">
          <Logo size={24} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/signup"
            className="rounded-xl px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
          >
            Log in
          </Link>
          <Button
            asChild
            size="sm"
            variant="glow"
            className="transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-8px_rgba(49,2,143,0.55)]"
          >
            <Link href="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
