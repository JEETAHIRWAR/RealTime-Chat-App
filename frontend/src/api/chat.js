import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) =>
{
  const token = localStorage.getItem("auth_token");

  if (token)
  {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const chatApi = {
  async getConversations()
  {
    const res = await api.get("/conversations");
    return res.data;
  },

  async searchUsers(query)
  {
    const res = await api.get(
      `/users/search?q=${encodeURIComponent(query)}`
    );

    return res.data;
  },

  async startConversation(userId)
  {
    const res = await api.post("/conversations/start", {
      userId,
    });

    return res.data;
  },

  async getMessages(conversationId, page = 1, limit = 20)
  {
    const res = await api.get(
      `/messages/${conversationId}?page=${page}&limit=${limit}`
    );

    return res.data;
  },
};

export default api;