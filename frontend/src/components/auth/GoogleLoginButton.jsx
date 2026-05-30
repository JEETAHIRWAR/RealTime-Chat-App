import { GoogleLogin } from "@react-oauth/google";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function GoogleLoginButton() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <button
        type="button"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID in .env to enable"
        className="h-11 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-sm text-[var(--color-muted-fg)]"
      >
        Continue with Google (configure VITE_GOOGLE_CLIENT_ID)
      </button>
    );
  }

  return (
    <GoogleLogin
      onSuccess={async (cred) => {
        try {
          const res = await authApi.google(cred.credential);
          setAuth({ token: res.token, user: res.user });
          toast.success("Welcome!");
          navigate("/chat");
        } catch (e) {
          toast.error(e?.response?.data?.message || "Google login failed");
        }
      }}
      onError={() => toast.error("Google login failed")}
      width="100%"
    />
  );
}
