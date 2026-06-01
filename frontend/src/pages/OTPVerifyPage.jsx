import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { toast } from "sonner";
import AuthLayout from "@/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import OTPInput from "@/components/auth/OTPInput";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

export default function OTPVerifyPage()
{
  const { state } = useLocation();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(30);

  useEffect(() =>
  {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!state?.identifier) return <Navigate to="/login" replace />;

  const {
    channel,
    identifier,
    mode,
  } = state;

  const verify = async () =>
  {
    if (otp.length < 6) return toast.error("Enter the 6-digit code");

    setLoading(true);

    try
    {
      const res =
        channel === "email"
          ? await authApi.verifyEmailOtp(identifier, otp)
          : await authApi.verifyPhoneOtp(identifier, otp);
      const token =
        res?.accessToken || res?.token;

      if (!token)
      {
        toast.error("Verification failed: token missing");
        return;
      }

      setAuth({
        token,
        refreshToken: res.refreshToken,
        user: res.user,
      });

      toast.success(
        mode === "register"
          ? "Account verified successfully!"
          : "Verified!"
      );

      navigate("/chat", {
        replace: true,
      });
    } catch (err)
    {
      toast.error(err?.response?.data?.message || "Invalid code");
    } finally
    {
      setLoading(false);
    }
  };

  const resend = async () =>
  {
    try
    {
      if (channel === "email") await authApi.requestEmailOtp(identifier);
      else await authApi.requestPhoneOtp(identifier);
      setCooldown(30);
      toast.success("Code resent");
    } catch (err)
    {
      toast.error(err?.response?.data?.message || "Failed to resend");
    }
  };

  return (
    <AuthLayout
      title="Verify it's you"
      subtitle={`Enter the 6-digit code we sent to ${identifier}`}
    >
      <div className="space-y-5">
        <OTPInput value={otp} onChange={setOtp} />
        <Button onClick={verify} disabled={loading} className="w-full">
          {loading ? <Spinner /> : "Verify"}
        </Button>
        <div className="text-center text-sm text-[var(--color-muted-fg)]">
          Didn't get it?{" "}
          <button
            type="button"
            disabled={cooldown > 0}
            onClick={resend}
            className="font-medium text-[var(--color-primary)] disabled:text-[var(--color-muted-fg)] hover:underline"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
