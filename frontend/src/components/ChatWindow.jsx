import { ArrowLeft, MoreVertical, Phone, Video } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import MessageBubble from "./MessageBubble";
import MessageComposer from "./MessageComposer";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChat } from "../context/ChatContext";
import { useEffect, useRef, useMemo } from "react";

export default function ChatWindow() {
  const isMobile = useIsMobile();
  const { currentChat, messages, loading, setCurrentChat } = useChat();
  const bottomRef = useRef(null);

  // Memoize a safe list of messages (guards against nulls)
  const safeMessages = useMemo(
    () =>
      Array.isArray(messages)
        ? messages.map((m) => ({
            _id: m._id ?? m.id ?? crypto.randomUUID(),
            text: m.text ?? "",
            from_me: !!m.from_me,
            timestamp: m.timestamp ?? new Date().toISOString(),
            status: m.status ?? "sent",
          }))
        : [],
    [messages]
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [safeMessages]);

  const handleBack = () => setCurrentChat(null);

  if (!currentChat) {
    return (
      <section className="flex h-full w-full flex-col items-center justify-center text-center px-6 bg-chat-pattern">
        <div className="max-w-md bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold">Welcome to your chats</h2>
          <p className="mt-2 text-muted-foreground">
            Select a conversation to start messaging. This is a WhatsApp
            Web-style interface built with React.
          </p>
        </div>
      </section>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <section className="flex h-full flex-1 flex-col bg-chat-pattern">
      <header className="header-glow border-b px-4 py-2 flex items-center gap-3 bg-background/80 backdrop-blur-sm">
        {isMobile && (
          <button
            onClick={handleBack}
            className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
            aria-label="Back to chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}

        <Sheet>
          <SheetTrigger asChild>
            <button
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              aria-label="Open profile"
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback
                  aria-label={`${currentChat?.name ?? "User"} avatar`}
                >
                  {(
                    currentChat?.name?.[0] ??
                    currentChat?.waId?.[0] ??
                    "?"
                  ).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="truncate font-medium">
                  {currentChat?.name ?? "Unknown"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  online • secure
                </p>
              </div>
            </button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[400px] sm:w-[540px]">
            <SheetHeader className="text-left">
              <SheetTitle>Profile Information</SheetTitle>
            </SheetHeader>

            <div className="mt-6 flex flex-col items-center space-y-3">
              <Avatar className="h-32 w-32">
                <AvatarFallback className="text-4xl">
                  {(
                    currentChat?.name?.[0] ??
                    currentChat?.waId?.[0] ??
                    "?"
                  ).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <span className="text-xl font-medium">
                {currentChat?.name ?? "Unknown"}
              </span>
              <span className="text-sm text-gray-500 font-normal">
                {currentChat?.waId}
              </span>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-1 ml-auto">
          <button
            className="h-9 w-9 rounded-full hover:bg-muted/60 inline-flex items-center justify-center transition-colors"
            aria-label="Voice call"
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            className="h-9 w-9 rounded-full hover:bg-muted/60 inline-flex items-center justify-center transition-colors"
            aria-label="Video call"
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            className="h-9 w-9 rounded-full hover:bg-muted/60 inline-flex items-center justify-center transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        <div className="mx-auto w-full px-4 py-4 space-y-2">
          {safeMessages.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No messages yet. Say hi!
            </div>
          ) : (
            safeMessages.map((message) => (
              <MessageBubble
                key={message._id}
                fromMe={message.from_me}
                time={new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                status={message.status}
              >
                {message.text}
              </MessageBubble>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <MessageComposer />
    </section>
  );
}
