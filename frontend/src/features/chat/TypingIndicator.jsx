export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="h-2 w-2 animate-bounce rounded-full bg-(--color-muted-fg) [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-(--color-muted-fg) [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-(--color-muted-fg)" />
    </div>
  );
}
