import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          type={type}
          className={cn(
            "flex h-14 w-full rounded-2xl border border-input bg-surface-raised px-4 text-base placeholder:text-muted-foreground/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          ref={ref}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
