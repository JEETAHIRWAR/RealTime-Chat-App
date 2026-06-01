import { create } from "zustand";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "auth_user";

export const useAuthStore = create((set, get) => ({
  token: null,
  refreshToken: null,
  user: null,
  ready: false,

  hydrate: () =>
  {
    try
    {
      const token = localStorage.getItem(TOKEN_KEY);
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      const user = userJson ? JSON.parse(userJson) : null;

      set({
        token,
        refreshToken,
        user,
        ready: true,
      });
    } catch
    {
      set({ ready: true });
    }
  },

  setAuth: ({ token, refreshToken, user }) =>
  {
    if (token) localStorage.setItem(TOKEN_KEY, token);

    if (refreshToken)
    {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    if (user)
    {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }

    set({
      token: token ?? get().token,
      refreshToken: refreshToken ?? get().refreshToken,
      user: user ?? get().user,
    });
  },

  logout: () =>
  {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    set({
      token: null,
      refreshToken: null,
      user: null,
      ready: true,
    });
  },
}));
