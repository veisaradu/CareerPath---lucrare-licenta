import API from "./auth";

export interface ChatSession {
  id: number;
  topic: string | null;
  created_at: string;
  related_job: number | null;
  related_recommendation: number | null;
}

export interface ChatMessage {
  id: number;
  session: number;
  sender: "user" | "ai";
  message: string;
  timestamp: string;
}

export const getSessions = async (): Promise<ChatSession[]> => {
  const { data } = await API.get<
    { results: ChatSession[] } | ChatSession[]
  >("/chats/");
  return Array.isArray(data) ? data : data.results;
};

export const createSession = async (): Promise<ChatSession> => {
  const { data } = await API.post<ChatSession>("/chats/", {});
  return data;
};

export const getMessages = async (
  sessionId: number
): Promise<ChatMessage[]> => {
  const { data } = await API.get<
    { results: ChatMessage[] } | ChatMessage[]
  >("/messages/", { params: { session: sessionId } });
  const list = Array.isArray(data) ? data : data.results;
  return list.filter((m) => m.session === sessionId);
};

export const sendMessage = async (
  sessionId: number,
  message: string
): Promise<ChatMessage> => {
  const { data } = await API.post<ChatMessage>(
    `/chats/${sessionId}/send/`,
    { message }
  );
  return data;
};