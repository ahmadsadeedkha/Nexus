import { apiFetch } from "./client";
import { Message, ChatConversation } from "../types";

export async function getConversations(): Promise<ChatConversation[]> {
  return apiFetch("/messages/conversations");
}

export async function getMessagesBetweenUsers(
  userId: string,
): Promise<Message[]> {
  return apiFetch(`/messages/${userId}`);
}

export async function sendMessage(
  receiverId: string,
  content: string,
): Promise<Message> {
  return apiFetch("/messages", {
    method: "POST",
    body: JSON.stringify({ receiverId, content }),
  });
}
