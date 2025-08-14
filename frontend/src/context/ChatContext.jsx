import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  fetchContacts,
  fetchMessages,
  sendMessage as apiSendMessage,
  markRead,
} from "../services/axios";
import socket from "@/services/socket";
import { toast } from "@/hooks/use-toast";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const lastLoadedWaIdRef = useRef(null);

  const updateContactAfterMessage = useCallback(
    (waId, message, unreadIncrement = 0) => {
      setContacts((prev) => {
        const updatedContacts = prev.map((contact) => {
          if (contact.waId === waId) {
            return {
              ...contact,
              lastMessagePreview: message,
              lastMessageAt: new Date().toISOString(),
              unread:
                contact.waId === currentChat?.waId
                  ? 0
                  : (contact.unread || 0) + unreadIncrement,
            };
          }
          return contact;
        });

        updatedContacts.sort(
          (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        );

        return updatedContacts;
      });
    },
    [currentChat?.waId]
  );

  const loadMessages = useCallback(async (waId) => {
    if (!waId || waId === lastLoadedWaIdRef.current) return;

    lastLoadedWaIdRef.current = waId;

    try {
      setLoadingMessages(true);
      const data = await fetchMessages(waId);
      setMessages(data.messages ?? data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const loadContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const data = await fetchContacts();
      setContacts(data.contacts ?? data);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (waId, text) => {
      const trimmed = text?.trim();
      if (!trimmed) return;

      const tempId = crypto.randomUUID();
      const tempMessage = {
        _id: tempId,
        text: trimmed,
        from_me: true,
        timestamp: new Date().toISOString(),
        status: "pending",
      };
      setMessages((prev) => [...prev, tempMessage]);

      try {
        const res = await apiSendMessage(waId, trimmed, {
          clientMessageId: tempId,
        });

        setMessages((prev) =>
          prev.map((m) =>
            m._id === tempId ? { ...res.message, status: "sent" } : m
          )
        );

        updateContactAfterMessage(waId, trimmed, 0);
      } catch (error) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? { ...m, status: "failed" } : m))
        );
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
      }
    },
    [updateContactAfterMessage]
  );

  const markCurrentChatRead = useCallback(async () => {
    if (!currentChat) return;
    try {
      const unreadIds = messages
        .filter((m) => !m.from_me && m.status !== "read")
        .map((m) => m._id);

      if (unreadIds.length) {
        await markRead(currentChat.waId, unreadIds);
        setMessages((prev) =>
          prev.map((m) =>
            unreadIds.includes(m._id) ? { ...m, status: "read" } : m
          )
        );
        setContacts((prev) =>
          prev.map((c) =>
            c.waId === currentChat.waId ? { ...c, unread: 0 } : c
          )
        );
      }
    } catch (e) {
      console.error("Failed to mark read:", e);
    }
  }, [currentChat, messages]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (currentChat) {
      loadMessages(currentChat.waId);
      markCurrentChatRead();
    }
  }, [currentChat, loadMessages, markCurrentChatRead]);

  useEffect(() => {
    socket.on("new_message", (msg) => {
      if (msg.wa_id === currentChat?.waId) {
        setMessages((prev) => [...prev, msg]);
        updateContactAfterMessage(msg.wa_id, msg.text, 0);
      } else {
        updateContactAfterMessage(msg.wa_id, msg.text, 1);
      }
    });
    return () => socket.off("new_message");
  }, [currentChat?.waId, updateContactAfterMessage]);

  useEffect(() => {
    socket.on("contact_updated", (updatedContact) => {
      setContacts((prev) =>
        prev.map((c) => (c.waId === updatedContact.waId ? updatedContact : c))
      );
    });
    return () => socket.off("contact_updated");
  }, []);

  useEffect(() => {
    socket.on(
      "conversation:update",
      ({ wa_id, last_message, last_timestamp }) => {
        updateContactAfterMessage(wa_id, last_message, 0);
      }
    );

    return () => socket.off("conversation:update");
  }, [updateContactAfterMessage]);

  const refreshMessages = useCallback(() => {
    if (currentChat?.waId) {
      loadMessages(currentChat.waId);
    }
  }, [currentChat?.waId, loadMessages]);

  return (
    <ChatContext.Provider
      value={{
        contacts,
        currentChat,
        setCurrentChat,
        messages,
        loading: loadingContacts || loadingMessages,
        sendMessage,
        refreshContacts: loadContacts,
        refreshMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within a ChatProvider");
  return ctx;
};
