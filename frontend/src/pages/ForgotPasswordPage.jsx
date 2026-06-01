import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import AuthLayout from "@/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";

import { authApi } from "@/api/auth";

export default function ForgotPasswordPage()
{
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const submit = async (e) =>
  {
    e.preventDefault();

    if (!email)
    {
      toast.error("Enter your email");
      return;
    }

    setLoading(true);

    try
    {
      await authApi.forgotPassword(email);

      toast.success("OTP sent to your email");

      navigate("/reset-password", {
        state: {
          email,
        },
      });
    }
    catch (err)
    {
      toast.error(
        err?.response?.data?.message ||
        "Failed to send OTP"
      );
    }
    finally
    {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="Enter your email and we'll send you a reset OTP."
      footer={
        <>
          Remember password?{" "}
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
        className="space-y-3"
      >
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? <Spinner /> : "Send reset OTP"}
        </Button>
      </form>
    </AuthLayout>
  );
}