import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export const fetchContacts = async () => {
  try {
    const response = await api.get("/contacts");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchMessages = async (waId) => {
  try {
    const response = await api.get(`/messages/${waId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;
