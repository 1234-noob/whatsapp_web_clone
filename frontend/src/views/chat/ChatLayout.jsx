import { useIsMobile } from "@/hooks/use-mobile";
import { useChat } from "../../context/ChatContext";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";

export default function ChatLayout() {
  const isMobile = useIsMobile();
  const { currentChat, loading } = useChat();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen max-h-screen">
      {/* Sidebar / Chat list */}
      <aside
        className={`${
          isMobile && currentChat ? "hidden" : "flex"
        } w-full md:w-[350px] lg:w-[400px] border-r bg-background flex-col`}
        aria-label="Chat list"
      >
        <ChatList />
      </aside>

      {/* Main chat area */}
      <main
        className={`${
          isMobile && !currentChat ? "hidden" : "flex"
        } flex-1 bg-chat-pattern flex-col`}
        aria-label="Chat window"
      >
        <ChatWindow />
      </main>
    </div>
  );
}
