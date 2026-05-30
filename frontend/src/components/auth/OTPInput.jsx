import { useRef } from "react";

export default function OTPInput({ value, onChange, length = 6 }) {
  const refs = useRef([]);
  const chars = (value || "").padEnd(length, " ").slice(0, length).split("");

  const set = (i, ch) => {
    const arr = chars.slice();
    arr[i] = ch || " ";
    onChange(arr.join("").replace(/ /g, ""));
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={chars[i].trim()}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            set(i, v);
            if (v && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !chars[i].trim() && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (text) {
              e.preventDefault();
              onChange(text);
              refs.current[Math.min(text.length, length - 1)]?.focus();
            }
          }}
          className="h-14 w-12 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-center text-xl font-semibold text-[var(--color-fg)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
      ))}
    </div>
  );
}
