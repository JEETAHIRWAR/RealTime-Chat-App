import { useState } from "react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { toast } from "sonner";

import AuthLayout from "@/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import OTPInput from "@/components/auth/OTPInput";

import { authApi } from "@/api/auth";

export default function ResetPasswordPage()
{
  const { state } = useLocation();
  const navigate = useNavigate();

  const email = state?.email;

  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");
  const [loading, setLoading] = useState(false);

  if (!email)
  {
    return <Navigate to="/forgot-password" replace />;
  }

  const submit = async (e) =>
  {
    e.preventDefault();

    if (otp.length < 6)
    {
      toast.error("Enter 6-digit OTP");
      return;
    }

    if (password.length < 6)
    {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword)
    {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try
    {
      await authApi.resetPassword(
        email,
        otp,
        password
      );

      toast.success("Password updated successfully");

      navigate("/login", {
        replace: true,
        state: {
          email,
        },
      });
    }
    catch (err)
    {
      toast.error(
        err?.response?.data?.message ||
        "Failed to reset password"
      );
    }
    finally
    {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle={`Enter the OTP sent to ${email}`}
      footer={
        <>
          Back to{" "}
          <Link
            to="/login"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={submit}
        className="space-y-4"
      >
        <OTPInput
          value={otp}
          onChange={setOtp}
        />

        <Input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          required
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? <Spinner /> : "Reset password"}
        </Button>
      </form>
    </AuthLayout>
  );
}