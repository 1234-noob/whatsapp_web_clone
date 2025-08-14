import axios from "axios";

const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  `${window.location.protocol}//${window.location.hostname}:3000`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const normalized = {
      status: error.response?.status ?? 0,
      message:
        error.response?.data?.message ?? error.message ?? "Unknown error",
      data: error.response?.data,
    };
    return Promise.reject(normalized);
  }
);

export const fetchContacts = async (params = {}) => {
  // params: { q?: string, cursor?: string, limit?: number }
  const { data } = await api.get("/contacts", { params });

  return data;
};

export const fetchMessages = async (
  waId,
  { before, after, limit = 50 } = {}
) => {
  const params = {};

  if (before) params.before = before; // e.g., timestamp or messageId
  if (after) params.after = after;
  if (limit) params.limit = limit;
  const { data } = await api.get(`/contacts/${waId}/messages`, { params });

  return data;
};

export const sendMessage = async (waId, text, options = {}) => {
  console.log(waId, text);
  const {
    clientMessageId = crypto.randomUUID(),
    quotedMessageId,
    metadata,
    media,
  } = options;

  const payload = {
    wa_id: waId,
    text,
    client_message_id: clientMessageId,
    quoted_message_id: quotedMessageId,
    metadata,
    ...(media ? { media } : {}),
  };

  const { data } = await api.post("/messages", payload);
  console.log(data);
  return data;
};

export const markRead = async (waId, messageIds = []) => {
  const { data } = await api.post(`/messages/${waId}/read`, {
    message_ids: messageIds,
  });
  return data;
};

export default api;
