import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PanelLeftOpen } from "lucide-react";

import Sidebar from "@/features/chat/Sidebar";
import ChatWindow from "@/features/chat/ChatWindow";

export default function ChatPage()
{
  const { conversationId } = useParams();

  const [sidebarHidden, setSidebarHidden] = useState(false);

  const [viewport, setViewport] = useState({
    height: window.visualViewport?.height || window.innerHeight,
    offsetTop: window.visualViewport?.offsetTop || 0,
  });

  useEffect(() =>
  {
    const updateViewport = () =>
    {
      setViewport({
        height: window.visualViewport?.height || window.innerHeight,
        offsetTop: window.visualViewport?.offsetTop || 0,
      });
    };

    updateViewport();

    window.visualViewport?.addEventListener(
      "resize",
      updateViewport
    );

    window.visualViewport?.addEventListener(
      "scroll",
      updateViewport
    );

    return () =>
    {
      window.visualViewport?.removeEventListener(
        "resize",
        updateViewport
      );

      window.visualViewport?.removeEventListener(
        "scroll",
        updateViewport
      );
    };
  }, []);


  return (
    <div
      className="fixed left-0 top-0 flex w-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-fg)]"
      style={{
        height: `${viewport.height}px`,
        transform: `translateY(${viewport.offsetTop}px)`,
      }}
    >
      {!sidebarHidden && (
        <div
          className={`${conversationId ? "hidden md:flex" : "flex"
            } min-h-0 w-full shrink-0 md:w-[22rem]`}
        >
          <Sidebar
            onHideSidebar={() => setSidebarHidden(true)}
          />
        </div>
      )}

      {sidebarHidden && (
        <button
          type="button"
          onClick={() => setSidebarHidden(false)}
          className="glass-surface absolute left-4 top-24 z-50 hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-muted-fg)] hover:bg-[var(--color-hover)] hover:text-[var(--color-fg)] md:flex"
          title="Show sidebar"
        >
          <PanelLeftOpen size={17} />
        </button>
      )}

      <div
        className={`${conversationId ? "flex" : "hidden md:flex"
          } min-h-0 flex-1 overflow-hidden`}
      >
        <ChatWindow conversationId={conversationId} />
      </div>
    </div>
  );
}
