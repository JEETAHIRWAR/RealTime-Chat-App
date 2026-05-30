import { cn } from "@/utils/cn";

function initials(name = "") {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function Avatar({ src, name = "?", size = 40, online, className }) {
  return (
    <div className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-primary)] font-semibold"
          style={{ fontSize: size * 0.4 }}
        >
          {initials(name) || "?"}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-[var(--color-card)]",
            online ? "bg-green-500" : "bg-[var(--color-muted-fg)]"
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
