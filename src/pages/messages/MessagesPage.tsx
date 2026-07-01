import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ChatUserList } from "../../components/chat/ChatUserList";
import { getConversations } from "../../api/messages";
import { getUserById } from "../../api/users";
import { ChatConversation, User } from "../../types";
import { MessageCircle } from "lucide-react";

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [participantMap, setParticipantMap] = useState<Record<string, User>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    getConversations()
      .then(async (convs) => {
        setConversations(convs);

        const participantIds = new Set<string>();
        convs.forEach((conv) => {
          conv.participants.forEach((id) => {
            if (id !== user.id) participantIds.add(id);
          });
        });

        const entries = await Promise.all(
          Array.from(participantIds).map(async (id) => {
            const u = await getUserById(id);
            return [id, u] as [string, User];
          }),
        );

        setParticipantMap(Object.fromEntries(entries));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [user]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading messages...</div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
      {conversations.length > 0 ? (
        <ChatUserList
          conversations={conversations}
          participantMap={participantMap}
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="bg-gray-100 p-6 rounded-full mb-4">
            <MessageCircle size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-medium text-gray-900">No messages yet</h2>
          <p className="text-gray-600 text-center mt-2">
            Start connecting with entrepreneurs and investors to begin
            conversations
          </p>
        </div>
      )}
    </div>
  );
};
