import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "@/store/authStore";
import { connectSocket, disconnectSocket } from "@/socket/socket";

import ProtectedRoute from "@/routes/ProtectedRoute";

import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import OTPVerifyPage from "@/pages/OTPVerifyPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import ProfilePage from "@/pages/ProfilePage";
import ChatPage from "@/pages/ChatPage";
import NotFoundPage from "@/pages/NotFoundPage";


export default function App()
{
  const { token, hydrate, user, ready } = useAuthStore();

  useEffect(() =>
  {
    hydrate();
  }, [hydrate]);

  useEffect(() =>
  {
    if (ready && token && user)
    {
      connectSocket(token);

      return () =>
      {
        disconnectSocket();
      };
    }
  }, [ready, token, user]);

  if (!ready)
  {
    return null;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          token ? (
            <Navigate to="/chat" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="/login" element={<LoginPage />} />

      <Route path="/signup" element={<SignupPage />} />

      <Route path="/verify-otp" element={<OTPVerifyPage />} />
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />

      <Route
        path="/reset-password"
        element={<ResetPasswordPage />}
      />

      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />



      <Route
        path="/chat/:conversationId"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}