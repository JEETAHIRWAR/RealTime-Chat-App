import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, Lock } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/layouts/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import GoogleLoginButton from "@/components/auth/GoogleLoginButton";
import Spinner from "@/components/ui/Spinner";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";

const tabs = [
  { id: "password", label: "Password", icon: Lock },
  { id: "email", label: "Email OTP", icon: Mail },
  { id: "phone", label: "Mobile OTP", icon: Phone },
];

export default function LoginPage()
{
  const [tab, setTab] = useState("password");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const submitPassword = async (e) =>
  {
    e.preventDefault();
    setLoading(true);

    try
    {
      const res = await authApi.login({ email, password });

      // ✅ FIX: match backend response
      const token = res?.accessToken || res?.token;
      const user = res?.user;

      if (!token)
      {
        toast.error("Login failed: token missing from backend");
        return;
      }

      // ✅ store correctly
      setAuth({
        token,
        refreshToken: res.refreshToken,
        user,
      });

      toast.success("Welcome back!");

      // ✅ IMPORTANT: ensure state update before navigation
      navigate("/chat", {
        replace: true,
      });

    } catch (err)
    {
      const code = err?.response?.data?.code;
      const message = err?.response?.data?.message;

      if (code === "USER_NOT_FOUND")
      {
        toast.error("User not registered. Register here...");

        navigate("/signup", {
          state: {
            email,
            message: "User not registered. Register here..."
          }
        });

        return;
      }

      toast.error(message || "Invalid credentials");
    } finally
    {
      setLoading(false);
    }
  };

  const requestOtp = async (channel) =>
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
            mode: "email_otp",
          },
        });
      } else
      {
        if (!phone) return toast.error("Enter your mobile number");
        await authApi.requestPhoneOtp(phone);
        navigate("/verify-otp", {
          state: {
            channel: "phone",
            identifier: phone,
            mode: "phone_otp",
          },
        });
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
      title="Welcome back"
      subtitle="Sign in to keep the conversation going."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-[var(--color-primary)] hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-1 rounded-[var(--radius)] bg-[var(--color-muted)] p-1 mb-5">
        {tabs.map((t) =>
        {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center justify-center gap-1.5 rounded-[calc(var(--radius)-4px)] py-2 text-xs font-medium transition ${tab === t.id
                ? "bg-[var(--color-card)] text-[var(--color-fg)] shadow-sm"
                : "text-[var(--color-muted-fg)] hover:text-[var(--color-fg)]"
                }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "password" && (
        <form onSubmit={submitPassword} className="space-y-3">
          <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Spinner /> : "Sign in"}
          </Button>
        </form>
      )}

      {tab === "email" && (
        <div className="space-y-3">
          <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={() => requestOtp("email")} disabled={loading} className="w-full">
            {loading ? <Spinner /> : "Send OTP"}
          </Button>
        </div>
      )}

      {tab === "phone" && (
        <div className="space-y-3">
          <Input type="tel" placeholder="+91 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button onClick={() => requestOtp("phone")} disabled={loading} className="w-full">
            {loading ? <Spinner /> : "Send OTP"}
          </Button>
        </div>
      )}

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        <span className="text-xs text-[var(--color-muted-fg)]">OR</span>
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <GoogleLoginButton />
    </AuthLayout>
  );
}
