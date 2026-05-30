import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[var(--color-bg)] via-[var(--color-accent)] to-[var(--color-bg)]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-xl shadow-black/5"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-fg)]">
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
