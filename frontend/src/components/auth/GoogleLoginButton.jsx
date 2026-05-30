import { GoogleLogin } from "@react-oauth/google";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function GoogleLoginButton()
{
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId)
  {
    return (
      <button
        type="button"
        disabled
        title="Set VITE_GOOGLE_CLIENT_ID in .env"
        className="h-11 w-full rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] text-sm text-[var(--color-muted-fg)]"
      >
        Continue with Google
      </button>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        useOneTap={false}
        width="420"
        // size="large"
        size="medium"
        theme="outline"
        text="signin_with"
        shape="rectangular"
        onSuccess={async (cred) =>
        {
          try
          {
            if (!cred?.credential)
            {
              toast.error("Google credential missing");
              return;
            }

            const res =
              await authApi.google(
                cred.credential
              );

            const token =
              res?.accessToken || res?.token;

            if (!token)
            {
              toast.error("Google login failed: token missing");
              return;
            }

            setAuth({
              token,
              user: res.user,
            });

            toast.success("Welcome! to Pulse- RealTime ChatApp");

            navigate(
              "/chat",
              {
                replace: true
              }
            );
          }
          catch (e)
          {
            console.log(
              "GOOGLE LOGIN FRONTEND ERROR:",
              e?.response?.data || e.message
            );

            toast.error(
              e?.response?.data?.message ||
              "Google login failed"
            );
          }
        }}
        onError={() =>
        {
          toast.error(
            "Google login failed"
          );
        }}
      />
    </div>
  );
}