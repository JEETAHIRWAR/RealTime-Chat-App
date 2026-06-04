import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-4 text-[var(--color-fg)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--color-secondary-soft),transparent_34%),radial-gradient(circle_at_80%_10%,var(--color-primary-soft),transparent_32%)]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-surface relative w-full max-w-md rounded-3xl border border-[var(--color-border)] p-8"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[var(--shadow-card)]">
            <MessageCircle size={20} />
          </div>
          <span className="text-lg font-semibold">Pulse</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-[var(--color-muted-fg)]">{subtitle}</p>}
        <div className="mt-6">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-[var(--color-muted-fg)]">{footer}</div>}
      </motion.div>
    </div>
  );
}
