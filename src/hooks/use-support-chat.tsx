
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { supportService, type SupportChat, type SupportMessage } from '../services/supportService';

interface UseSupportChatProps {
    userId: string | undefined;
}

export function useSupportChat({ userId }: UseSupportChatProps) {
    const [chat, setChat] = useState<SupportChat | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false); // Widget open state

    // Load or create chat session
    const initChat = useCallback(async () => {
        if (!userId) return;
        setIsLoading(true);
        try {
            const chatSession = await supportService.getOrCreateOpenChat(userId);
            setChat(chatSession);
            if (chatSession) {
                const history = await supportService.getMessages(chatSession.id);
                setMessages(history);
            }
        } catch (error) {
            console.error('Failed to init support chat', error);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Handle realtime subscription
    useEffect(() => {
        if (!chat) return;

        const channel = supabase.channel(`support_chat:${chat.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `chat_id=eq.${chat.id}`
                },
                (payload) => {
                    const newMessage = payload.new as SupportMessage;
                    setMessages((current) => {
                        if (current.some(m => m.id === newMessage.id)) {
                            return current;
                        }
                        return [...current, newMessage];
                    })
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [chat]);

    const sendMessage = useCallback(async (content: string) => {
        if (!chat || !userId) return;
        try {
            await supportService.sendMessage(chat.id, userId, content);
        } catch (error) {
            console.error('Failed to send message', error);
            throw error;
        }
    }, [chat, userId]);

    return {
        chat,
        messages,
        sendMessage,
        isLoading,
        initChat,
        isOpen,
        setIsOpen
    }
}
