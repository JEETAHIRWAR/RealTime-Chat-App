
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import
{
  Search,
  LogOut,
  Moon,
  Sun,
  MessageCircle,
  Plus,
  Settings,
  PanelLeftClose,
} from "lucide-react";
import { motion } from "framer-motion";

import Avatar from "@/components/ui/Avatar";
import Input from "@/components/ui/Input";


import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

import { chatApi } from "@/api/chat";
import { useDebounce } from "@/hooks/useDebounce";

import { toast } from "sonner";

function formatTime(ts)
{
  if (!ts) return "";

  const d = new Date(ts);
  const today = new Date();

  if (d.toDateString() === today.toDateString())
  {
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

export default function Sidebar({ onHideSidebar })
{
  const navigate = useNavigate();
  const { conversationId } = useParams();

  const { user, logout } = useAuthStore();

  const conversations = useChatStore(
    (s) => s.conversations || []
  );

  const onlineUsers = useChatStore(
    (s) => s.onlineUsers || new Set()
  );

  const loadingConversations = useChatStore(
    (s) => s.loadingConversations
  );

  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const debounced = useDebounce(q, 300);

  const [dark, setDark] = useState(
    document.documentElement.classList.contains("dark")
  );

  const currentUserId = user?._id || user?.id;


  useEffect(() =>
  {
    const loadConversations = async () =>
    {
      try
      {
        useChatStore
          .getState()
          .setLoadingConversations?.(true);

        const response = await chatApi.getConversations();

        useChatStore
          .getState()
          .setConversations(response?.conversations || []);
      } catch (error)
      {
        console.log(
          "Load conversations error:",
          error.response?.data || error.message
        );
      } finally
      {
        useChatStore
          .getState()
          .setLoadingConversations?.(false);
      }
    };

    loadConversations();
  }, []);

  const isOnline = (userId) =>
  {
    return onlineUsers?.has?.(userId?.toString());
  };

  useEffect(() =>
  {
    if (!debounced?.trim())
    {
      setResults([]);
      return;
    }

    setSearching(true);

    chatApi
      .searchUsers(debounced)
      .then((response) =>
      {
        const users = response?.users || response || [];

        const filteredUsers = users.filter(
          (u) =>
            (u?._id || u?.id)?.toString() !==
            currentUserId?.toString()
        );

        setResults(filteredUsers);
      })
      .catch(() =>
      {
        setResults([]);
      })
      .finally(() =>
      {
        setSearching(false);
      });
  }, [debounced, currentUserId]);

  const toggleTheme = () =>
  {
    const next = !dark;

    setDark(next);

    document.documentElement.classList.toggle("dark", next);

    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const startConversation = async (u) =>
  {
    try
    {
      const response = await chatApi.startConversation(
        u?._id || u?.id
      );

      const conv = response?.conversation || response;

      const id = conv?._id || conv?.id;

      if (!id)
      {
        throw new Error("Conversation ID missing");
      }

      useChatStore.setState((state) =>
      {
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
    } catch (error)
    {
      console.error(error);

      toast.error("Could not start conversation");
    }
  };

  const list = useMemo(() =>
  {
    return [...conversations].sort((a, b) =>
    {
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
    <aside className="flex h-full w-full flex-col border-r border-[var(--color-border)] bg-[var(--color-card)] md:w-80">

      {/* App Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
        <div>
          <div className="text-lg font-bold">
            Pulse
          </div>
          <div className="text-xs text-[var(--color-muted-fg)]">
            Realtime Chat
          </div>
        </div>

        <button
          type="button"
          onClick={onHideSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
          title="Hide sidebar"
        >
          <PanelLeftClose size={17} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-fg)]"
          />

          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search people..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Search Results */}
      {q && (
        <div className="border-b border-[var(--color-border)] px-2 pb-2">
          <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-muted-fg)]">
            {searching
              ? "Searching..."
              : `Results (${results.length})`}
          </div>

          {results.length === 0 && !searching ? (
            <div className="px-2 py-3 text-sm text-[var(--color-muted-fg)]">
              No users found
            </div>
          ) : (
            results.map((u) =>
            {
              const userId = u?._id || u?.id;

              return (
                <button
                  key={userId}
                  onClick={() => startConversation(u)}
                  className="flex w-full items-center gap-3 rounded-[var(--radius)] p-2 text-left hover:bg-[var(--color-muted)]"
                >
                  <Avatar
                    name={u?.name}
                    src={u?.avatar}
                    size={36}
                    online={isOnline(userId)}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {u?.name}
                    </div>

                    <div className="truncate text-xs text-[var(--color-muted-fg)]">
                      {u?.email}
                    </div>
                  </div>

                  <Plus
                    size={16}
                    className="text-[var(--color-muted-fg)]"
                  />
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {loadingConversations ? (
          <div className="space-y-2 p-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3 rounded-[var(--radius)] p-2"
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
            <MessageCircle
              size={32}
              className="opacity-50"
            />

            No conversations yet. Search for someone to start
            chatting.
          </div>
        ) : (
          list.map((c) =>
          {
            const id = c?._id || c?.id;

            const other =
              c?.participants?.find(
                (p) =>
                  (p?._id || p?.id)?.toString() !==
                  currentUserId?.toString()
              ) || {};

            const otherUserId =
              other?._id || other?.id;



            const active =
              conversationId?.toString() ===
              id?.toString();

            const lastMessageText =
              typeof c?.lastMessage === "string"
                ? c.lastMessage
                : c?.lastMessage?.content ||
                c?.lastMessage?.text ||
                c?.lastMessage?.message ||
                "Say hi 👋";

            const unread =
              active
                ? 0
                : Number(
                  c?.unreadCount ||
                  c?.unreadCounts?.[currentUserId] ||
                  0
                );

            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/chat/${id}`)}
                className={`flex w-full items-center gap-3 rounded-[var(--radius)] p-2.5 text-left transition ${active
                  ? "bg-[var(--color-accent)]"
                  : "hover:bg-[var(--color-muted)]"
                  }`}
              >
                <Avatar
                  name={other?.name || "Unknown"}
                  src={other?.avatar}
                  size={44}
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

                  <div className="truncate text-xs text-[var(--color-muted-fg)]">
                    {lastMessageText || "Say hi 👋"}
                  </div>
                </div>

                {Number(unread) > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary)] px-1.5 text-[11px] font-semibold text-[var(--color-primary-fg)]">
                    {unread}
                  </span>
                )}
              </motion.button>
            );
          })
        )}
      </div>


      {/* Bottom Profile */}
      <div className="flex items-center gap-3 border-t border-[var(--color-border)] p-4">
        <Avatar
          name={user?.name || user?.email}
          src={user?.avatar}
          size={40}
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
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
          title="Toggle theme"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
          title="Settings"
        >
          <Settings size={16} />
        </button>

        <button
          onClick={() =>
          {
            logout();
            navigate("/login");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--color-muted)]"
          title="Log out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
