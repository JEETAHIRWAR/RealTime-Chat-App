import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";
import { authApi } from "@/api/auth";
import { chatApi } from "@/api/chat";
import { useDebounce } from "@/hooks/useDebounce";
import { disconnectSocket } from "@/socket/socket";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useTheme } from "@/theme/useTheme";

function formatTime(ts) {
  if (!ts) return "";

  const d = new Date(ts);
  const today = new Date();

  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

function getLastMessageText(conversation) {
  if (
    conversation?.messageType === "image" ||
    conversation?.lastMessageType === "image" ||
    conversation?.lastMessage?.messageType === "image"
  ) {
    return "Photo";
  }

  if (
    conversation?.messageType === "file" ||
    conversation?.lastMessageType === "file" ||
    conversation?.lastMessage?.messageType === "file"
  ) {
    return "File";
  }

  if (typeof conversation?.lastMessage === "string") {
    return conversation.lastMessage;
  }

  return (
    conversation?.lastMessage?.content ||
    conversation?.lastMessage?.text ||
    conversation?.lastMessage?.message ||
    "Say hi"
  );
}

export default function Sidebar({ onHideSidebar }) {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { previewTheme, saveTheme, savedThemeId } = useTheme();

  const {
    user,
    refreshToken,
    logout,
  } = useAuthStore();

  const conversations = useChatStore((s) => s.conversations || []);
  const onlineUsers = useChatStore((s) => s.onlineUsers || new Set());
  const loadingConversations = useChatStore((s) => s.loadingConversations);

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const debounced = useDebounce(q, 300);
  const currentUserId = user?._id || user?.id;

  useEffect(() => {
    const loadConversations = async () => {
      try {
        useChatStore.getState().setLoadingConversations?.(true);

        const response = await chatApi.getConversations();

        useChatStore.getState().setConversations(response?.conversations || []);
      } catch (error) {
        console.log(
          "Load conversations error:",
          error.response?.data || error.message
        );
      } finally {
        useChatStore.getState().setLoadingConversations?.(false);
      }
    };

    loadConversations();
  }, []);

  const isOnline = (userId) => onlineUsers?.has?.(userId?.toString());

  useEffect(() => {
    if (!debounced?.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);

    chatApi
      .searchUsers(debounced)
      .then((response) => {
        const users = response?.users || response || [];
        const filteredUsers = users.filter(
          (u) => (u?._id || u?.id)?.toString() !== currentUserId?.toString()
        );

        setResults(filteredUsers);
      })
      .catch(() => {
        setResults([]);
      })
      .finally(() => {
        setSearching(false);
      });
  }, [debounced, currentUserId]);

  const toggleQuickTheme = () => {
    const nextTheme = savedThemeId === "arctic-white" ? "ocean-blue" : "arctic-white";

    previewTheme(nextTheme);
    saveTheme(nextTheme);
  };

  const startConversation = async (u) => {
    try {
      const response = await chatApi.startConversation(u?._id || u?.id);
      const conv = response?.conversation || response;
      const id = conv?._id || conv?.id;

      if (!id) {
        throw new Error("Conversation ID missing");
      }

      useChatStore.setState((state) => {
        const exists = state.conversations.some(
          (c) => (c?._id || c?.id)?.toString() === id?.toString()
        );

        return {
          conversations: exists
            ? state.conversations
            : [conv, ...state.conversations],
        };
      });

      navigate(`/chat/${id}`);
      setQ("");
      setResults([]);
    } catch (error) {
      console.error(error);
      toast.error("Could not start conversation");
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout(refreshToken);
    } catch (error) {
      console.log(
        "Logout API error:",
        error?.response?.data || error.message
      );
    } finally {
      disconnectSocket();
      logout();
      navigate("/login", { replace: true });
    }
  };

  const list = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const ta = new Date(
        a?.lastMessageAt ||
        a?.updatedAt ||
        a?.lastMessage?.createdAt ||
        0
      ).getTime();
      const tb = new Date(
        b?.lastMessageAt ||
        b?.updatedAt ||
        b?.lastMessage?.createdAt ||
        0
      ).getTime();

      return tb - ta;
    });
  }, [conversations]);

  return (
    <aside className="glass-surface flex h-full w-full flex-col border-r border-[var(--color-border)] md:w-[22rem]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[var(--shadow-card)]">
            <Sparkles size={20} />
          </div>

          <div>
            <div className="text-2xl font-bold tracking-tight">
              Pulse
            </div>

            <div className="text-xs text-[var(--color-muted-fg)]">
              Premium realtime chat
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onHideSidebar}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-hover)] hover:text-[var(--color-fg)] md:flex"
          title="Hide sidebar"
        >
          <MessageCircle size={17} />
        </button>
      </div>

      <div className="p-3.5">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-fg)]"
          />

          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people..."
            className="h-12 rounded-2xl bg-[var(--color-input)] pl-10 shadow-[var(--shadow-card)]"
          />
        </div>
      </div>

      {q && (
        <div className="border-b border-[var(--color-border)] px-2 pb-2">
          <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-muted-fg)]">
            {searching ? "Searching" : `Results (${results.length})`}
          </div>

          {results.length === 0 && !searching ? (
            <div className="px-2 py-3 text-sm text-[var(--color-muted-fg)]">
              No users found
            </div>
          ) : (
            results.map((u) => {
              const userId = u?._id || u?.id;

              return (
                <button
                  key={userId}
                  onClick={() => startConversation(u)}
                  className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-[var(--color-hover)]"
                >
                  <Avatar
                    name={u?.name}
                    src={u?.avatar}
                    size={38}
                    online={isOnline(userId)}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {u?.name}
                    </div>

                    <div className="truncate text-xs text-[var(--color-muted-fg)]">
                      {u?.email}
                    </div>
                  </div>

                  <Plus size={16} className="text-[var(--color-muted-fg)]" />
                </button>
              );
            })
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2.5 pb-2">
        {loadingConversations ? (
          <div className="space-y-2 p-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-2xl p-2"
              >
                <div className="h-11 w-11 rounded-full bg-[var(--color-muted)]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 rounded bg-[var(--color-muted)]" />
                  <div className="h-2 w-40 rounded bg-[var(--color-muted)]" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--color-muted-fg)]">
            <MessageCircle size={34} className="opacity-60" />
            No conversations yet. Search for someone to start chatting.
          </div>
        ) : (
          list.map((c) => {
            const id = c?._id || c?.id;
            const other =
              c?.participants?.find(
                (p) => (p?._id || p?.id)?.toString() !== currentUserId?.toString()
              ) || {};
            const otherUserId = other?._id || other?.id;
            const active = conversationId?.toString() === id?.toString();
            const unread = active
              ? 0
              : Number(c?.unreadCount || c?.unreadCounts?.[currentUserId] || 0);

            return (
              <motion.button
                key={id}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/chat/${id}`)}
                className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition ${
                  active
                    ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] shadow-[var(--shadow-card)]"
                    : "border-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]"
                }`}
              >
                <Avatar
                  name={other?.name || "Unknown"}
                  src={other?.avatar}
                  size={46}
                  online={isOnline(otherUserId)}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="truncate text-sm font-semibold">
                      {other?.name || "Unknown"}
                    </div>

                    <div className="shrink-0 text-[11px] text-[var(--color-muted-fg)]">
                      {formatTime(
                        c?.lastMessageAt ||
                        c?.lastMessage?.createdAt ||
                        c?.updatedAt
                      )}
                    </div>
                  </div>

                  <div className="truncate text-xs text-[var(--color-muted-fg)] group-hover:text-[var(--color-fg)]">
                    {getLastMessageText(c)}
                  </div>
                </div>

                {unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[11px] font-semibold text-[var(--color-primary-fg)] shadow-[var(--shadow-card)]">
                    {unread}
                  </span>
                )}
              </motion.button>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-[var(--color-border)] bg-[var(--color-card)]/55 p-4 backdrop-blur-xl">
        <Avatar
          name={user?.name || user?.email}
          src={user?.avatar}
          size={42}
        />

        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">
            {user?.name || "You"}
          </div>

          <div className="truncate text-xs text-[var(--color-muted-fg)]">
            {user?.email || user?.phone}
          </div>
        </div>

        <button
          onClick={toggleQuickTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-hover)] hover:text-[var(--color-fg)]"
          title="Quick theme"
        >
          <Sparkles size={16} />
        </button>

        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-hover)] hover:text-[var(--color-fg)]"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-hover)] hover:text-[var(--color-fg)]"
          title="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
