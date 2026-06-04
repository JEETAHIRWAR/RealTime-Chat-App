import { useEffect, useRef, useState } from "react";
import
{
  Send,
  Smile,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  XCircle,
  Edit3,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import Button from "@/components/ui/Button";
import { useChatStore } from "@/store/chatStore";

import
{
  emitTypingStart,
  emitTypingStop,
  emitEditMessage,
} from "@/socket/socket";

function formatFileSize(size = 0)
{
  if (!size) return "";

  if (size < 1024 * 1024)
  {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageInput({
  conversationId,
  onSend,
  onFileSend,
  disabled,
})
{
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");

  const replyMessage =
    useChatStore((s) => s.replyMessage);

  const editMessage =
    useChatStore((s) => s.editMessage);

  const clearReplyMessage =
    useChatStore((s) => s.clearReplyMessage);

  const clearEditMessage =
    useChatStore((s) => s.clearEditMessage);

  const typingRef = useRef(false);
  const timerRef = useRef(null);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const emojiRef = useRef(null);
  const previewUrlRef = useRef("");

  useEffect(() =>
  {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() =>
  {
    queueMicrotask(() =>
    {
      setText("");
      setShowEmoji(false);
      setSelectedFile(null);
      setPreviewUrl("");
      setCaption("");
    });

    typingRef.current = false;
    clearEditMessage();

    return () =>
    {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (previewUrlRef.current)
      {
        URL.revokeObjectURL(previewUrlRef.current);
      }

      emitTypingStop({ conversationId });
    };
  }, [conversationId, clearEditMessage]);

  useEffect(() =>
  {
    if (!editMessage)
    {
      return;
    }

    queueMicrotask(() =>
    {
      setText(
        editMessage.message ||
        editMessage.content ||
        ""
      );

      setShowEmoji(false);
      setSelectedFile(null);
      setPreviewUrl("");
      setCaption("");
    });

    requestAnimationFrame(() =>
    {
      taRef.current?.focus();
    });
  }, [editMessage]);

  useEffect(() =>
  {
    const handleClickOutside = (e) =>
    {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(e.target)
      )
      {
        setShowEmoji(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    document.addEventListener(
      "touchstart",
      handleClickOutside
    );

    return () =>
    {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

      document.removeEventListener(
        "touchstart",
        handleClickOutside
      );
    };
  }, []);

  const handleChange = (v) =>
  {
    setText(v);

    if (!conversationId) return;

    if (!typingRef.current)
    {
      typingRef.current = true;
      emitTypingStart({ conversationId });
    }

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() =>
    {
      typingRef.current = false;
      emitTypingStop({ conversationId });
    }, 1500);
  };

  const addEmoji = (emojiData) =>
  {
    const emoji = emojiData?.emoji || "";

    setText((prev) => prev + emoji);

    if (conversationId)
    {
      emitTypingStart({ conversationId });
    }
  };

  const submit = (e) =>
  {
    e?.preventDefault();

    const value = text.trim();

    if (!value || disabled) return;

    if (editMessage)
    {
      const messageId =
        editMessage._id ||
        editMessage.id;

      if (messageId)
      {
        emitEditMessage({
          messageId,
          newMessage: value,
        });
      }

      clearEditMessage();
      setText("");
      setShowEmoji(false);
      typingRef.current = false;
      emitTypingStop({ conversationId });

      setTimeout(() =>
      {
        taRef.current?.focus();
      }, 50);

      return;
    }

    onSend(value, replyMessage);

    clearReplyMessage();

    setText("");
    setShowEmoji(false);
    typingRef.current = false;

    emitTypingStop({ conversationId });

    // if (!/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent))
    // {
    //   taRef.current?.focus();
    // }

    emitTypingStop({ conversationId });

    setTimeout(() =>
    {
      taRef.current?.focus();
    }, 50);
  };

  const handleFileChange = (e) =>
  {
    const file = e.target.files?.[0];

    if (!file || disabled || editMessage) return;

    setSelectedFile(file);
    setCaption("");

    if (file.type.startsWith("image/"))
    {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else
    {
      setPreviewUrl("");
    }

    e.target.value = "";
  };

  const closePreview = () =>
  {
    if (previewUrl)
    {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setCaption("");
  };

  const sendSelectedFile = () =>
  {
    if (!selectedFile || disabled || editMessage) return;

    onFileSend?.(
      selectedFile,
      caption.trim(),
      replyMessage
    );

    clearReplyMessage();

    closePreview();
  };

  const onKey = (e) =>
  {
    if (e.key === "Enter" && !e.shiftKey)
    {
      e.preventDefault();
      submit();
    }
  };

  const isSelectedImage =
    selectedFile?.type?.startsWith("image/");

  const toggleEmojiPicker = (e) =>
  {
    e.preventDefault();
    e.stopPropagation();

    taRef.current?.blur();

    if (document.activeElement)
    {
      document.activeElement.blur();
    }

    setShowEmoji((prev) => !prev);
  };

  const cancelEdit = () =>
  {
    clearEditMessage();
    setText("");
    setShowEmoji(false);
    typingRef.current = false;
    emitTypingStop({ conversationId });

    setTimeout(() =>
    {
      taRef.current?.focus();
    }, 50);
  };

  const previewText =
    editMessage?.message ||
    editMessage?.content ||
    "";

  return (
    <>
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-overlay)] text-[var(--color-fg)] backdrop-blur-2xl">
          <div className="glass-surface flex h-16 items-center gap-3 border-b border-[var(--color-reaction-border)] px-5">
            <button
              type="button"
              onClick={closePreview}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-overlay-soft)]"
            >
              <X size={24} />
            </button>

            <div className="min-w-0 flex-1 truncate font-semibold">
              {selectedFile.name}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-6">
            {isSelectedImage && previewUrl ? (
              <img
                src={previewUrl}
                alt={selectedFile.name}
                className="max-h-[70vh] max-w-[80vw] rounded-xl object-contain"
              />
            ) : (
              <div className="glass-surface flex max-w-md flex-col items-center gap-4 rounded-3xl border border-[var(--color-border)] p-10 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--color-overlay-soft)]">
                  {isSelectedImage ? (
                    <ImageIcon size={48} />
                  ) : (
                    <FileText size={48} />
                  )}
                </div>

                <div>
                  <div className="text-xl font-semibold">
                    No preview available
                  </div>

                  <div className="mt-1 text-sm text-[var(--color-muted-fg)]">
                    {formatFileSize(selectedFile.size)} ·{" "}
                    {selectedFile.type || "file"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="glass-surface border-t border-[var(--color-reaction-border)] p-4">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 py-3 text-sm outline-none placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-primary)]"
              />

              <Button
                type="button"
                onClick={sendSelectedFile}
                className="h-12 w-12 rounded-full"
                size="icon"
              >
                <Send size={18} />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-surface relative z-30 shrink-0 border-t border-[var(--color-border)]">
        {editMessage && (
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-secondary)]">
              <Edit3 size={17} />
            </div>

            <div className="min-w-0 flex-1 rounded-2xl border-l-4 border-[var(--color-primary)] bg-[var(--color-muted)]/80 px-3 py-2">
              <div className="text-xs font-semibold text-[var(--color-secondary)]">
                Editing message
              </div>

              <div className="truncate text-xs text-[var(--color-muted-fg)]">
                {previewText || "Message"}
              </div>
            </div>

            <button
              type="button"
              onClick={cancelEdit}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-hover)] hover:text-[var(--color-fg)]"
              aria-label="Cancel edit"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {replyMessage && (
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-3 py-2">
            <div className="min-w-0 flex-1 rounded-2xl border-l-4 border-[var(--color-primary)] bg-[var(--color-muted)]/80 px-3 py-2">
              <div className="text-xs font-semibold text-[var(--color-secondary)]">
                Replying to
              </div>

              <div className="truncate text-xs text-[var(--color-muted-fg)]">
                {replyMessage.message ||
                  replyMessage.fileName ||
                  "Message"}
              </div>
            </div>

            <button
              type="button"
              onClick={clearReplyMessage}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-hover)] hover:text-[var(--color-fg)]"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}


        <form
          onSubmit={submit}
          className="flex items-end gap-2 p-2.5 pb-[max(10px,env(safe-area-inset-bottom))] md:p-3"
        >
          <div ref={emojiRef} className="relative">
            {showEmoji && (
              <div className="absolute bottom-14 left-0 z-50 max-w-[90vw]">
                <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] shadow-[var(--shadow-menu)]">
                  <EmojiPicker
                    theme="dark"
                    onEmojiClick={addEmoji}
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onPointerDown={toggleEmojiPicker}
              className="flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-hover)] hover:text-[var(--color-fg)]"
              tabIndex={-1}
            >
              <Smile size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!!editMessage}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-hover)] hover:text-[var(--color-fg)] disabled:cursor-not-allowed disabled:opacity-40"
            tabIndex={-1}
          >
            <Paperclip size={18} />
          </button>

          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt,.zip"
          />

          <textarea
            ref={taRef}
            rows={1}
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={onKey}
            placeholder={editMessage ? "Edit message..." : "Type a message..."}
            disabled={disabled}
            className="max-h-32 min-h-[46px] flex-1 resize-none rounded-3xl border border-[var(--color-border)] bg-[var(--color-input)] px-4 py-3 text-sm shadow-[var(--shadow-card)] outline-none transition placeholder:text-[var(--color-input-placeholder)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />

          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 rounded-full shadow-[var(--shadow-card)]"
            disabled={!text.trim() || disabled}
            aria-label={editMessage ? "Update message" : "Send message"}
          >
            <Send size={16} />
          </Button>
        </form>
      </div>
    </>
  );
}
