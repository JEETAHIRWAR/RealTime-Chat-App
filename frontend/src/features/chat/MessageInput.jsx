import { useEffect, useRef, useState } from "react";
import {
  Send,
  Smile,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import EmojiPicker from "emoji-picker-react";

import Button from "@/components/ui/Button";

import {
  emitTypingStart,
  emitTypingStop,
} from "@/socket/socket";

function formatFileSize(size = 0) {
  if (!size) return "";

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MessageInput({
  conversationId,
  onSend,
  onFileSend,
  disabled,
}) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");

  const typingRef = useRef(false);
  const timerRef = useRef(null);
  const taRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    setText("");
    setShowEmoji(false);
    setSelectedFile(null);
    setPreviewUrl("");
    setCaption("");
    typingRef.current = false;

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      emitTypingStop({ conversationId });
    };
  }, [conversationId]);

  const handleChange = (v) => {
    setText(v);

    if (!conversationId) return;

    if (!typingRef.current) {
      typingRef.current = true;
      emitTypingStart({ conversationId });
    }

    clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      typingRef.current = false;
      emitTypingStop({ conversationId });
    }, 1500);
  };

  const addEmoji = (emojiData) => {
    const emoji = emojiData?.emoji || "";

    setText((prev) => prev + emoji);
    taRef.current?.focus();

    if (conversationId) {
      emitTypingStart({ conversationId });
    }
  };

  const submit = (e) => {
    e?.preventDefault();

    const value = text.trim();

    if (!value || disabled) return;

    onSend(value);

    setText("");
    setShowEmoji(false);
    typingRef.current = false;

    emitTypingStop({ conversationId });

    taRef.current?.focus();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file || disabled) return;

    setSelectedFile(file);
    setCaption("");

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }

    e.target.value = "";
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(null);
    setPreviewUrl("");
    setCaption("");
  };

  const sendSelectedFile = () => {
    if (!selectedFile || disabled) return;

    onFileSend?.(selectedFile, caption.trim());

    closePreview();
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const isSelectedImage =
    selectedFile?.type?.startsWith("image/");

  return (
    <>
      {selectedFile && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white">
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
            <button
              type="button"
              onClick={closePreview}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/10"
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
              <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl bg-white/5 p-10 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10">
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

                  <div className="mt-1 text-sm text-white/70">
                    {formatFileSize(selectedFile.size)} ·{" "}
                    {selectedFile.type || "file"}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="mx-auto flex max-w-3xl items-center gap-3">
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="flex-1 rounded-xl bg-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/50"
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

      <form
        onSubmit={submit}
        className="relative flex items-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-card)] p-3"
      >
        {showEmoji && (
          <div className="absolute bottom-16 left-3 z-50">
            <EmojiPicker
              theme="dark"
              onEmojiClick={addEmoji}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
          tabIndex={-1}
        >
          <Smile size={18} />
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted-fg)] hover:bg-[var(--color-muted)]"
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
          placeholder="Type a message..."
          disabled={disabled}
          className="max-h-32 min-h-[40px] flex-1 resize-none rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />

        <Button
          type="submit"
          size="icon"
          className="h-10 w-10 rounded-full"
          disabled={!text.trim() || disabled}
        >
          <Send size={16} />
        </Button>
      </form>
    </>
  );
}