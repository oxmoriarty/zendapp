import * as React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton rounded-xl", className)} {...props} />;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "success" | "warning" | "muted";
}) {
  const variants = {
    default: "bg-primary/10 text-primary",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border px-6 py-14 text-center animate-fade-in">
      {icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display font-semibold">{title}</p>
        {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
      </div>
      {action}
    </div>
  );
}
