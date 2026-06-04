import { cn } from "@/utils/cn";

export default function Button({ className, variant = "primary", size = "md", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";
  const variants = {
    primary: "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[var(--shadow-card)] hover:bg-[var(--color-primary-hover)]",
    ghost: "text-[var(--color-fg)] hover:bg-[var(--color-hover)]",
    outline: "border border-[var(--color-border)] bg-[var(--color-card)]/60 text-[var(--color-fg)] hover:bg-[var(--color-hover)]",
    danger: "bg-[var(--color-danger)] text-[var(--color-danger-fg)] hover:bg-[var(--color-danger-hover)]",
  };
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
