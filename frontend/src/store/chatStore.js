import { create } from "zustand";

const getId = (item) => item?._id || item?.id;

export const useChatStore = create((set) => ({
  conversations: [],
  activeId: null,
  messagesByConv: {},
  typingByConv: {},
  onlineUsers: new Set(),
  loadingConversations: false,

  setConversations: (list = []) =>
    set({ conversations: Array.isArray(list) ? list : [] }),

  setLoadingConversations: (value) =>
    set({ loadingConversations: value }),

  setActive: (id) =>
    set({ activeId: id }),

  setActiveConversation: (conversation) =>
    set({
      activeId: getId(conversation),
    }),

  setMessages: (convId, messages = []) =>
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [convId]: messages,
      },
    })),

  prependMessages: (convId, older = []) =>
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [convId]: [
          ...older,
          ...(s.messagesByConv[convId] || []),
        ],
      },
    })),

  appendMessage: (convId, message) =>
    set((s) =>
    {
      if (!convId || !message) return {};

      const existing = s.messagesByConv[convId] || [];

      const messageId = getId(message);

      if (
        messageId &&
        existing.some((m) => getId(m) === messageId)
      )
      {
        return {};
      }

      const nextMessages = [...existing, message];

      const conversations = s.conversations.map((c) =>
      {
        const cId = getId(c);

        if (cId?.toString() !== convId?.toString())
        {
          return c;
        }

        return {
          ...c,
          lastMessage: message,
          lastMessageAt:
            message.createdAt || new Date().toISOString(),
          updatedAt:
            message.createdAt || new Date().toISOString(),
        };
      });

      return {
        messagesByConv: {
          ...s.messagesByConv,
          [convId]: nextMessages,
        },
        conversations,
      };
    }),

  replaceMessage: (convId, tempId, real) =>
    set((s) => ({
      messagesByConv: {
        ...s.messagesByConv,
        [convId]: (s.messagesByConv[convId] || []).map((m) =>
          m.tempId === tempId ? { ...m, ...real } : m
        ),
      },
    })),

  updateMessageStatus: (messageId, status) =>
    set((s) =>
    {
      if (!messageId) return {};

      let changed = false;

      const messagesByConv = { ...s.messagesByConv };

      for (const convId in messagesByConv)
      {
        const messages = messagesByConv[convId] || [];

        const index = messages.findIndex(
          (m) =>
            getId(m)?.toString() ===
            messageId?.toString()
        );

        if (index !== -1)
        {
          const updatedMessages = [...messages];

          updatedMessages[index] = {
            ...updatedMessages[index],
            status,
          };

          messagesByConv[convId] = updatedMessages;

          changed = true;

          break;
        }
      }

      if (!changed) return {};

      return {
        messagesByConv,
      };
    }),


  updateMessageReactions: (
    convId,
    messageId,
    reactions = []
  ) =>
    set((s) =>
    {
      if (!convId || !messageId) return {};

      const convKey =
        Object.keys(s.messagesByConv).find(
          (key) =>
            key.toString() ===
            convId.toString()
        );

      if (!convKey) return {};

      return {
        messagesByConv: {
          ...s.messagesByConv,
          [convKey]: (
            s.messagesByConv[convKey] || []
          ).map((m) =>
            getId(m)?.toString() ===
              messageId?.toString()
              ? {
                ...m,
                reactions,
              }
              : m
          ),
        },
      };
    }),


  setTyping: (convId, userId, isTyping) =>
    set((s) =>
    {
      if (!convId || !userId) return {};

      const nextSet = new Set(s.typingByConv[convId] || []);

      if (isTyping) nextSet.add(userId.toString());
      else nextSet.delete(userId.toString());

      return {
        typingByConv: {
          ...s.typingByConv,
          [convId]: nextSet,
        },
      };
    }),

  setOnline: (userId, online) =>
    set((s) =>
    {
      const next = new Set(s.onlineUsers);

      if (online) next.add(userId?.toString());
      else next.delete(userId?.toString());

      return { onlineUsers: next };
    }),

  markConversationRead: (conversationId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        (c?._id || c?.id)?.toString() === conversationId?.toString()
          ? { ...c, unreadCount: 0 }
          : c
      ),
    })),


  setOnlineUsers: (users) =>
    set(() =>
    {
      const ids = Array.isArray(users)
        ? users
        : Object.keys(users || {});

      return {
        onlineUsers: new Set(ids.map(String)),
      };
    }),
}));