import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthLayout from "@/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import Spinner from "@/components/ui/Spinner";
import { authApi } from "@/api/auth";

export default function SignupPage()
{
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // No direct login after register.
  // User must verify email OTP first.

  const submit = async (e) =>
  {
    e.preventDefault();
    setLoading(true);

    try
    {
      const res = await authApi.register({
        name,
        email,
        phone,
        password,
      });

      toast.success(
        res?.message || "OTP sent to verify your account"
      );

      navigate("/verify-otp", {
        state: {
          channel: "email",
          identifier: email,
          mode: "register",
        },
      });
    } catch (err)
    {
      toast.error(err?.response?.data?.message || "Signup failed");
    } finally
    {
      setLoading(false);
    }
  };

  const otpSignup = async (channel) =>
  {
    setLoading(true);
    try
    {
      if (channel === "email")
      {
        if (!email) return toast.error("Enter your email");
        await authApi.requestEmailOtp(email);
        navigate("/verify-otp", {
          state: {
            channel: "email",
            identifier: email,
            name,
            mode: "email_otp",
          },
        });
      } else
      {
        if (!phone) return toast.error("Enter your mobile number");
        await authApi.requestPhoneOtp(phone);
        navigate("/verify-otp", { state: { channel: "phone", identifier: phone, name } });
      }
    } catch (err)
    {
      toast.error(err?.response?.data?.message || "Failed to send OTP");
    } finally
    {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands chatting in real time."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-[var(--color-primary)] hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="tel" placeholder="Mobile (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? <Spinner /> : "Create account"}
        </Button>
      </form>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-muted-fg)]">OR SIGN UP WITH</span>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => otpSignup("email")} disabled={loading}>
          Email OTP
        </Button>
        <Button variant="outline" onClick={() => otpSignup("phone")} disabled={loading}>
          Mobile OTP
        </Button>
      </div>

      <div className="mt-3">
        <GoogleLoginButton />
      </div>
    </AuthLayout>
  );
}
