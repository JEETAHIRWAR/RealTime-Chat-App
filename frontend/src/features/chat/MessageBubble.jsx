import { useRef, useState } from "react";
import { motion } from "framer-motion";
import
{
  Check,
  CheckCheck,
  Clock,
  FileText,
  Download,
  Plus,
  Reply
} from "lucide-react";

import { emitMessageReaction } from "@/socket/socket";
import { useChatStore } from "@/store/chatStore";

const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function formatTime(ts)
{
  if (!ts) return "";

  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(size = 0)
{
  if (!size) return "";

  if (size < 1024 * 1024)
  {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageBubble({
  message,
  isMe,
  activeReactionMessage,
  setActiveReactionMessage, })
{
  const messageId =
    message._id || message.id || message.tempId;

  const showReactions =
    activeReactionMessage === messageId;

  const longPressTimer = useRef(null);
  const longPressTargetRef = useRef(null);
  const [reactionStyle, setReactionStyle] = useState({});
  const setReplyMessage =
    useChatStore((s) => s.setReplyMessage);

  const text = message.message || message.content || "";

  const fileUrl = message.fileUrl || "";
  const safeFileUrl = fileUrl ? encodeURI(fileUrl) : "";

  const isImage =
    message.messageType === "image" ||
    message.mimeType?.startsWith("image/") ||
    /\.(png|jpg|jpeg|webp|gif)$/i.test(fileUrl);

  const isFile =
    message.messageType === "file" ||
    (!!message.fileUrl && !isImage);

  const reactions = Array.isArray(message.reactions)
    ? message.reactions
    : [];


  const repliedMessage =
    message.replyTo || null;

  const repliedText =
    repliedMessage?.message ||
    repliedMessage?.fileName ||
    (repliedMessage?.messageType === "image"
      ? "Photo"
      : "");

  const openReactionBar = (e) =>
  {
    const rect =
      e?.currentTarget?.getBoundingClientRect?.();

    if (!rect)
    {
      setActiveReactionMessage(messageId);
      return;
    }

    const isNearTop =
      rect.top < 120;

    const top =
      isNearTop
        ? rect.bottom + 8
        : rect.top - 58;

    const left =
      isMe
        ? Math.max(12, rect.right - 420)
        : Math.max(12, rect.left);

    setReactionStyle({
      top,
      left,
    });

    setActiveReactionMessage(messageId);
  };

  const closeReactionBar = () =>
  {
    setActiveReactionMessage(null);
  };

  const handleReaction = (emoji) =>
  {
    emitMessageReaction({
      messageId: message._id || message.id,
      conversationId: message.conversationId,
      emoji,
    });

    closeReactionBar();
  };

  const startLongPress = () =>
  {
    longPressTimer.current = setTimeout(() =>
    {
      openReactionBar({
        currentTarget:
          longPressTargetRef.current,
      });
    }, 450);
  };

  const cancelLongPress = () =>
  {
    if (longPressTimer.current)
    {
      clearTimeout(longPressTimer.current);
    }
  };

  const renderStatus = () =>
  {
    if (!isMe) return null;

    if (message.status === "seen")
    {
      return <CheckCheck size={14} className="text-blue-400" />;
    }

    if (message.status === "delivered")
    {
      return <CheckCheck size={14} className="text-gray-300" />;
    }

    if (message.status === "sent")
    {
      return <Check size={14} />;
    }

    return <Clock size={14} />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex w-full ${isMe ? "justify-end" : "justify-start"
        }`}
      onClick={() =>
      {
        if (showReactions) closeReactionBar();
      }}
    >
      <div className="relative max-w-[78%]">
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={reactionStyle}
            className="fixed z-[9999] flex w-fit items-center gap-2 rounded-full bg-[#202c33] px-3 py-2 shadow-2xl"
          >
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={(e) =>
                {
                  e.stopPropagation();
                  handleReaction(emoji);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full text-2xl transition hover:scale-125 active:scale-110"
              >
                {emoji}
              </button>
            ))}

            <button
              type="button"
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-[#2a3942] text-white"
              onClick={(e) =>
              {
                e.stopPropagation();

                setReplyMessage(message);

                closeReactionBar();
              }}
              title="Reply"
            >
              <Reply size={18} />
            </button>
          </motion.div>
        )}

        <div
          ref={longPressTargetRef}
          onDoubleClick={(e) => openReactionBar(e)}
          onContextMenu={(e) =>
          {
            e.preventDefault();
            openReactionBar(e);
          }}
          onTouchStart={startLongPress}
          onTouchEnd={cancelLongPress}
          onTouchMove={cancelLongPress}
          className={`rounded-2xl px-3.5 py-2 text-sm shadow-sm ${isMe
            ? "rounded-br-md bg-[var(--color-bubble-me)] text-[var(--color-primary-fg)]"
            : "rounded-bl-md bg-[var(--color-bubble-them)] text-[var(--color-fg)]"
            }`}
        >
          {repliedMessage && (
            <div
              className={`mb-2 rounded-xl border-l-4 px-3 py-2 text-xs ${isMe
                ? "border-white/70 bg-white/10"
                : "border-[var(--color-primary)] bg-[var(--color-muted)]"
                }`}
            >
              <div
                className={`mb-0.5 font-semibold ${isMe
                  ? "text-white/90"
                  : "text-[var(--color-primary)]"
                  }`}
              >
                Replying to
              </div>

              <div
                className={`line-clamp-2 break-words ${isMe
                  ? "text-white/75"
                  : "text-[var(--color-muted-fg)]"
                  }`}
              >
                {repliedText || "Message"}
              </div>
            </div>
          )}
          {isImage && safeFileUrl && (
            <a
              href={safeFileUrl}
              target="_blank"
              rel="noreferrer"
              className="relative mb-1 block overflow-hidden rounded-xl"
            >
              <img
                src={safeFileUrl}
                alt={message.fileName || "image"}
                className="block max-h-[360px] w-full max-w-[320px] rounded-xl object-cover"
              />

              <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white">
                <span>{formatTime(message.createdAt)}</span>
                {renderStatus()}
              </div>
            </a>
          )}

          {isFile && message.fileUrl && (
            <a
              href={message.fileUrl}
              target="_blank"
              rel="noreferrer"
              download
              className={`mb-2 flex items-center gap-3 rounded-xl p-3 ${isMe ? "bg-white/10" : "bg-[var(--color-muted)]"
                }`}
            >
              <FileText size={24} />

              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {message.fileName || text || "File"}
                </div>

                <div
                  className={`text-xs ${isMe
                    ? "text-white/70"
                    : "text-[var(--color-muted-fg)]"
                    }`}
                >
                  {formatFileSize(message.fileSize)}
                </div>
              </div>

              <Download size={18} />
            </a>
          )}

          {text && !isImage && (
            <div className="whitespace-pre-wrap break-words">
              {text}
            </div>
          )}

          {!isImage && (
            <div
              className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe
                ? "text-white/75"
                : "text-[var(--color-muted-fg)]"
                }`}
            >
              <span>{formatTime(message.createdAt)}</span>
              {renderStatus()}
            </div>
          )}
        </div>

        {reactions.length > 0 && (
          <div
            className={`relative -mt-1 flex ${isMe ? "justify-end pr-2" : "justify-start pl-2"
              }`}
          >
            <button
              type="button"
              onClick={openReactionBar}
              className="flex items-center gap-1 rounded-full border border-black/10 bg-[#202c33] px-2 py-0.5 text-xs shadow-md"
            >
              {reactions.slice(0, 3).map((reaction, index) => (
                <span key={reaction._id || index}>
                  {reaction.emoji}
                </span>
              ))}

              {reactions.length > 1 && (
                <span className="text-[10px] text-white/70">
                  {reactions.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}