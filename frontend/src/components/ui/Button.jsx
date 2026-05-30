import { cn } from "@/utils/cn";

export default function Button({ className, variant = "primary", size = "md", ...props }) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";
  const variants = {
    primary: "bg-[var(--color-primary)] text-[var(--color-primary-fg)] hover:opacity-90",
    ghost: "hover:bg-[var(--color-muted)] text-[var(--color-fg)]",
    outline: "border border-[var(--color-border)] hover:bg-[var(--color-muted)] text-[var(--color-fg)]",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-10 w-10",
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
