import { create } from "zustand";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  ready: false,

  hydrate: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      const user = userJson ? JSON.parse(userJson) : null;
      set({ token, user, ready: true });
    } catch {
      set({ ready: true });
    }
  },

  setAuth: ({ token, user }) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ token: token ?? get().token, user: user ?? get().user });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ token: null, user: null });
  },
}));
