import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Zendapp mark renders identically in light and dark mode — the brand
 * violet (#31028f) has enough contrast against both a white and near-black
 * surface, so we never swap or invert the asset.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      src="/zendapp-mark.svg"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      priority
    />
  );
}

export function Logo({
  size = 28,
  showWordmark = true,
  className,
}: {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <div
        className="flex items-center justify-center rounded-xl bg-primary"
        style={{ width: size + 12, height: size + 12 }}
      >
        <LogoMark size={size * 0.62} className="brightness-0 invert" />
      </div>
      {showWordmark && (
        <span className="font-display text-xl font-semibold tracking-tight">
          Zend<span className="text-primary">app</span>
        </span>
      )}
    </div>
  );
}
