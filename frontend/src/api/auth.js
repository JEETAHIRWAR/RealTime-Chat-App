import { api } from "./axios";

// Backend endpoints (adjust to match your MERN routes)
export const authApi = {
  // Password
  login: (data) => api.post("/api/auth/login", data).then((r) => r.data),
  register: (data) => api.post("/api/auth/register", data).then((r) => r.data),

  // Email OTP
  requestEmailOtp: (email) => api.post("/api/auth/send-email-otp", { email }).then((r) => r.data),
  verifyEmailOtp: (email, otp) => api.post("/api/auth/verify-email-otp", { email, otp }).then((r) => r.data),

  // Mobile OTP
  requestPhoneOtp: (phone) => api.post("/api/auth/send-phone-otp", { phone }).then((r) => r.data),
  verifyPhoneOtp: (phone, otp) => api.post("/api/auth/verify-phone-otp", { phone, otp }).then((r) => r.data),

  // GOOGLE (YOU DON'T HAVE YET IN BACKEND)
  google: (credential) =>
    api.post("/api/auth/google-login", { token: credential }).then((r) => r.data),

  // SESSION
  me: () =>
    api.get("/api/auth/me").then((r) => r.data),

  logout: () =>
    api.post("/api/auth/logout").then((r) => r.data).catch(() => null),
};
