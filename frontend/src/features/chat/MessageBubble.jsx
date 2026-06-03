import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import
{
  Check,
  CheckCheck,
  Clock,
  FileText,
  Download,
  Reply,
  Trash2,
  Copy,
  Forward,
  ChevronDown,
} from "lucide-react";

import
{
  emitMessageReaction,
  emitDeleteMessage,
} from "@/socket/socket";

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
  setActiveReactionMessage,
})
{
  const messageId = message._id || message.id || message.tempId;

  const showReactions = activeReactionMessage === messageId;

  const longPressTimer = useRef(null);
  const longPressTargetRef = useRef(null);
  const popupRef = useRef(null);

  const [reactionStyle, setReactionStyle] = useState({
    top: 0,
    left: 0,
  });

  const [showMenu, setShowMenu] = useState(false);

  const setReplyMessage = useChatStore((s) => s.setReplyMessage);

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

  const repliedMessage = message.replyTo || null;

  const repliedText =
    repliedMessage?.message ||
    repliedMessage?.fileName ||
    (repliedMessage?.messageType === "image" ? "Photo" : "");

  useEffect(() =>
  {
    const handleOutsideClick = (e) =>
    {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target)
      )
      {
        setShowMenu(false);
        setActiveReactionMessage(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () =>
    {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [setActiveReactionMessage]);

  const openActionPopup = (e) =>
  {
    e?.preventDefault?.();
    e?.stopPropagation?.();

    /*
    ========================================
    TOGGLE POPUP
    ========================================
    */
    if (activeReactionMessage === messageId && showMenu)
    {
      closePopup();
      return;
    }

    const rect =
      e?.currentTarget?.getBoundingClientRect?.();

    if (!rect)
    {
      setActiveReactionMessage(messageId);
      setShowMenu(true);
      return;
    }

    const top = Math.max(12, rect.top - 62);

    let left = isMe
      ? rect.right - 330
      : rect.left;

    left = Math.max(
      12,
      Math.min(left, window.innerWidth - 340)
    );

    setReactionStyle({
      top,
      left,
    });

    setActiveReactionMessage(messageId);
    setShowMenu(true);
  };

  const closePopup = () =>
  {
    setShowMenu(false);
    setActiveReactionMessage(null);
  };

  const handleReaction = (emoji) =>
  {
    emitMessageReaction({
      messageId: message._id || message.id,
      conversationId: message.conversationId,
      emoji,
    });

    closePopup();
  };

  const handleReply = () =>
  {
    setReplyMessage(message);
    closePopup();
  };

  const handleDeleteForMe = () =>
  {
    emitDeleteMessage({
      messageId: message._id || message.id,
      deleteForEveryone: false,
    });

    closePopup();
  };

  const handleDeleteForEveryone = () =>
  {
    emitDeleteMessage({
      messageId: message._id || message.id,
      deleteForEveryone: true,
    });

    closePopup();
  };

  const handleCopy = async () =>
  {
    try
    {
      await navigator.clipboard.writeText(text);
      closePopup();
    } catch
    {
      closePopup();
    }
  };

  const startLongPress = () =>
  {
    longPressTimer.current = setTimeout(() =>
    {
      openActionPopup({
        currentTarget: longPressTargetRef.current,
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
    >
      <div className="group relative max-w-[78%]">
        {showReactions && (
          <div
            ref={popupRef}
            style={{
              top: reactionStyle.top,
              left: reactionStyle.left,
            }}
            className="fixed z-[9999] flex flex-col items-start"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="mb-2 flex w-fit items-center gap-2 rounded-full bg-[#202c33] px-3 py-2 shadow-2xl"
            >
              {reactionEmojis.map((emoji) =>
              {
                const selected = reactions.some(
                  (r) => r.emoji === emoji
                );

                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={(e) =>
                    {
                      e.stopPropagation();
                      handleReaction(emoji);
                    }}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-2xl transition hover:scale-125 active:scale-110 ${selected
                        ? "bg-green-600 ring-2 ring-green-400"
                        : ""
                      }`}
                  >
                    {emoji}
                  </button>
                );
              })}

              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#2a3942] text-white"
                onClick={(e) =>
                {
                  e.stopPropagation();
                  handleReply();
                }}
                title="Reply"
              >
                <Reply size={18} />
              </button>
            </motion.div>

            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-60 overflow-hidden rounded-2xl border border-white/10 bg-[#202c33] py-2 text-sm text-white shadow-2xl"
              >
                <button
                  type="button"
                  onClick={handleReply}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#2a3942]"
                >
                  <Reply size={18} />
                  Reply
                </button>

                {text && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#2a3942]"
                  >
                    <Copy size={18} />
                    Copy
                  </button>
                )}

                <button
                  type="button"
                  onClick={closePopup}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#2a3942]"
                >
                  <Forward size={18} />
                  Forward
                </button>

                <div className="my-1 border-t border-white/10" />

                <button
                  type="button"
                  onClick={handleDeleteForMe}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#2a3942]"
                >
                  <Trash2 size={18} />
                  Delete for me
                </button>

                {isMe && (
                  <button
                    type="button"
                    onClick={handleDeleteForEveryone}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-red-400 hover:bg-[#2a3942]"
                  >
                    <Trash2 size={18} />
                    Delete for everyone
                  </button>
                )}
              </motion.div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={(e) =>
          {
            e.preventDefault();
            e.stopPropagation();

            if (
              activeReactionMessage === messageId &&
              showMenu
            )
            {
              closePopup();
              return;
            }

            openActionPopup(e);
          }}
          className={`absolute top-0 z-20 hidden h-6 w-6 items-center justify-center rounded-full shadow group-hover:flex ${isMe ? "-right-1" : "-left-1"
            }`}
        >
          <ChevronDown size={16} />
        </button>

        <div
          ref={longPressTargetRef}
          onDoubleClick={openActionPopup}
          onContextMenu={(e) =>
          {
            e.preventDefault();
            openActionPopup(e);
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

              {message.isEdited && (
                <span className="ml-2 text-[10px] opacity-70">
                  (edited)
                </span>
              )}
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
              onClick={openActionPopup}
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