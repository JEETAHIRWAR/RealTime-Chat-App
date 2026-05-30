import { cn } from "@/utils/cn";
import { forwardRef } from "react";

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-muted-fg)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
        className
      )}
      {...props}
    />
  );
});
export default Input;
