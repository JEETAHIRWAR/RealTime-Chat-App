import { api } from "./axios";

export const chatApi = {
  async getConversations()
  {
    const res = await api.get("/api/conversations");
    return res.data;
  },

  async searchUsers(query)
  {
    const res = await api.get(
      `/api/users/search?q=${encodeURIComponent(query)}`
    );

    return res.data;
  },

  async startConversation(userId)
  {
    const res = await api.post("/api/conversations/start", {
      userId,
    });

    return res.data;
  },

  async getMessages(conversationId, page = 1, limit = 20)
  {
    const res = await api.get(
      `/api/messages/${conversationId}?page=${page}&limit=${limit}`
    );

    return res.data;
  },

  async uploadFile(file)
  {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post("/api/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  }
};