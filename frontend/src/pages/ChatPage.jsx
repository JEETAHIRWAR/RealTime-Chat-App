import { useState } from "react";
import { useParams } from "react-router-dom";
import { PanelLeftOpen } from "lucide-react";

import Sidebar from "@/features/chat/Sidebar";
import ChatWindow from "@/features/chat/ChatWindow";

export default function ChatPage() {
  const { conversationId } = useParams();

  const [sidebarHidden, setSidebarHidden] = useState(false);

  return (
    <div className="relative flex h-screen w-screen overflow-hidden">
      {!sidebarHidden && (
        <div
          className={`${
            conversationId ? "hidden md:flex" : "flex"
          } md:w-80 w-full`}
        >
          <Sidebar
            onHideSidebar={() => setSidebarHidden(true)}
          />
        </div>
      )}

      {sidebarHidden && (
        <button
          onClick={() => setSidebarHidden(false)}
          className="absolute left-4 top-24 z-50 hidden h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg hover:bg-[var(--color-muted)] md:flex"
          title="Show sidebar"
        >
          <PanelLeftOpen size={17} />
        </button>
      )}

      <div
        className={`${
          conversationId ? "flex" : "hidden md:flex"
        } flex-1`}
      >
        <ChatWindow conversationId={conversationId} />
      </div>
    </div>
  );
}








// import { useParams } from "react-router-dom";

// import Sidebar from "@/features/chat/Sidebar";
// import ChatWindow from "@/features/chat/ChatWindow";

// export default function ChatPage() {
//   const { conversationId } = useParams();

//   return (
//     <div className="flex h-screen w-screen overflow-hidden">
//       {/* SIDEBAR */}
//       <div
//         className={`${
//           conversationId ? "hidden md:flex" : "flex"
//         } md:w-80 w-full`}
//       >
//         <Sidebar />
//       </div>

//       {/* CHAT WINDOW */}
//       <div
//         className={`${
//           conversationId ? "flex" : "hidden md:flex"
//         } flex-1`}
//       >
//         <ChatWindow conversationId={conversationId} />
//       </div>
//     </div>
//   );
// }