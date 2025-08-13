import React, { useState, useEffect } from "react";
import { Search, MessageSquarePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useChat } from "../../context/ChatContext";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

export default function ChatList() {
  const { contacts, currentChat, setCurrentChat, loading } = useChat();
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredContacts, setFilteredContacts] = useState([]);

  useEffect(() => {
    if (contacts) {
      setFilteredContacts(
        contacts.filter((contact) =>
          contact.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
  }, [contacts, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">Loading...</div>
    );
  }

  return (
    <div className="flex h-full bg-background flex-col">
      <div className="p-4 flex bg-background w-full justify-between items-center h-20">
        <div className="text-whatsapp-green font-medium font-sans text-2xl">
          WhatsApp
        </div>
        <div>
          <div className="w-full">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:opacity-90 transition"
                  aria-label="Start new chat"
                >
                  <MessageSquarePlus className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="sm:min-w-[48%] xl:min-w-[29%]"
                hideOverlay={true}
              >
                <SheetHeader>
                  <SheetTitle>Start a new chat</SheetTitle>
                  <SheetDescription>
                    Search for people to start a new conversation
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search contacts"
                        className="pl-9 bg-secondary/60 focus-visible:ring-brand"
                        aria-label="Search contacts"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <nav className="flex-1 mt-4 overflow-y-auto">
                    {filteredContacts.map((contact) => {
                      const active = contact.wa_id === currentChat?.wa_id;
                      return (
                        <button
                          key={contact.wa_id}
                          onClick={() => setCurrentChat(contact)}
                          className={`w-full gap-3 px-4 py-3 flex items-center text-left border-b hover:bg-muted/60 transition ${
                            active ? "bg-muted" : "bg-card"
                          }`}
                          aria-current={active ? "page" : undefined}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarFallback
                              aria-label={`${contact.name} avatar`}
                            >
                              {contact.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="truncate font-medium">
                                {contact.name}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      <header className="header-glow border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search or start new chat"
              className="pl-9 bg-secondary/60 focus-visible:ring-brand"
              aria-label="Search chats"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <nav className="flex-1 overflow-y-auto">
        {filteredContacts.map((contact) => {
          const active = contact.wa_id === currentChat?.wa_id;
          return (
            <button
              key={contact.wa_id}
              onClick={() => setCurrentChat(contact)}
              className={`w-full gap-3 px-4 py-3 flex items-center text-left border-b hover:bg-muted/60 transition ${
                active ? "bg-muted" : "bg-card"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback aria-label={`${contact.name} avatar`}>
                  {contact.name[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="truncate font-medium">{contact.name}</p>
                  <span className="ml-2 text-xs text-muted-foreground shrink-0">
                    {new Date(contact.last_timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm text-muted-foreground">
                    {contact.last_message}
                  </p>
                  {contact.unread_count > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-brand-foreground">
                      {contact.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
