"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

const GRADIENTS = [
  "from-primary-400 to-primary-800",
  "from-primary-300 to-primary-600",
  "from-primary-500 to-primary-900",
  "from-primary-200 to-primary-500",
];

function gradientFor(seed: string) {
  const i = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GRADIENTS.length;
  return GRADIENTS[i];
}

export function Avatar({
  src,
  name,
  size = 44,
  className,
}: {
  src?: string;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 select-none items-center justify-center overflow-hidden rounded-full",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src && <AvatarPrimitive.Image src={src} alt={name} className="h-full w-full object-cover" />}
      <AvatarPrimitive.Fallback
        className={cn(
          "flex h-full w-full items-center justify-center bg-gradient-to-br font-display font-semibold text-white",
          gradientFor(name || "z"),
        )}
        style={{ fontSize: size * 0.38 }}
        delayMs={0}
      >
        {initials(name || "?")}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
