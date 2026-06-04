import { cn } from "@/utils/cn";
import { forwardRef } from "react";

const Input = forwardRef(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-input)] px-4 text-sm text-[var(--color-fg)] shadow-sm outline-none transition placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20",
        className
      )}
      {...props}
    />
  );
});
export default Input;
