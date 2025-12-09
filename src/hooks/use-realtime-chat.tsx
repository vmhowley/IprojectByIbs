'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { chatService } from '../services/chatService'
import type { ChatMessage } from '../types/ChatMessage'

interface UseRealtimeChatProps {
    roomName: string
    username: string
    userId: string
}

export function useRealtimeChat({ roomName, username, userId }: UseRealtimeChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isConnected, setIsConnected] = useState(false)

    // Load initial history
    useEffect(() => {
        if (!roomName) return;

        const loadHistory = async () => {
            const history = await chatService.getMessages(roomName);
            setMessages(history);
        };
        loadHistory();
    }, [roomName]);

    // Handle realtime subscription
    useEffect(() => {
        if (!roomName) return;

        const newChannel = supabase.channel(`room:${roomName}`)

        newChannel
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `room_id=eq.${roomName}`
                },
                (payload) => {
                    const newMessage = payload.new;
                    // Check if message is already in state (optimistic update might put it there, though we are not doing optimistic updates yet)
                    // But actually, we receive the raw DB row here.
                    const formattedMessage: ChatMessage = {
                        id: newMessage.id,
                        content: newMessage.content,
                        user: {
                            name: newMessage.user_name || 'Unknown',
                        },
                        createdAt: newMessage.created_at,
                    };

                    setMessages((current) => {
                        if (current.some(m => m.id === formattedMessage.id)) {
                            return current;
                        }
                        return [...current, formattedMessage];
                    })
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setIsConnected(true)
                } else {
                    console.error('Realtime not connected:', status);
                    setIsConnected(false)
                }
            })

        return () => {
            supabase.removeChannel(newChannel)
        }
    }, [roomName, supabase])

    const sendMessage = useCallback(
        async (content: string) => {
            if (!userId || !roomName) {
                console.error('Cannot send: Missing userId or roomName');
                return;
            }

            try {
                // We don't update local state optimistically here because we rely on the realtime subscription to confirm it was saved.
                // However, for better UX we could, but let's keep it simple and consistent.
                await chatService.sendMessage(roomName, userId, username, content);
            } catch (error: any) {
                console.error("Failed to send message", error);
                alert(`Error al enviar mensaje: ${error.message || error.toString()}`);
            }
        },
        [roomName, isConnected, username, userId]
    )

    return { messages, sendMessage, isConnected }
}
