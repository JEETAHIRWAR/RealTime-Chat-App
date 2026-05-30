import { Link } from "react-router-dom";
export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="text-[var(--color-muted-fg)]">Page not found</p>
      <Link to="/" className="text-[var(--color-primary)] hover:underline">
        Go home
      </Link>
    </div>
  );
}
