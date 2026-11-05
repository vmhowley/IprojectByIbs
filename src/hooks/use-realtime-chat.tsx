import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { DirectMessage, directMessageService } from '../services/directMessageService'
import type { ChatMessage } from '../types/ChatMessage'

export type { ChatMessage }

interface ChatPerson {
    id: string
    name: string
}

interface UseRealtimeChatProps {
    me: ChatPerson
    other: ChatPerson
}

function toChatMessage(message: DirectMessage, me: ChatPerson, other: ChatPerson): ChatMessage {
    const mine = message.sender_id === me.id
    return {
        id: message.id,
        content: message.content,
        user: { name: message.sender?.name || (mine ? me.name : other.name) },
        createdAt: message.created_at,
        userId: message.sender_id,
    }
}

/**
 * A direct conversation between two people, stored in `direct_messages`.
 * Loads the history, marks what the other person sent as read, and listens
 * for new messages from them.
 */
export function useRealtimeChat({ me, other }: UseRealtimeChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isConnected, setIsConnected] = useState(false)
    const [loading, setLoading] = useState(true)
    const meRef = useRef(me)
    const otherRef = useRef(other)
    meRef.current = me
    otherRef.current = other

    const markIncomingAsRead = useCallback(async (rows: DirectMessage[]) => {
        const unread = rows.filter((m) => m.receiver_id === meRef.current.id && !m.is_read).map((m) => m.id)
        if (unread.length === 0) return
        try {
            await directMessageService.markAsRead(unread)
            window.dispatchEvent(new Event('direct-messages-read'))
        } catch (error) {
            console.error('Failed to mark messages as read', error)
        }
    }, [])

    const loadHistory = useCallback(async () => {
        const rows = await directMessageService.getConversation(otherRef.current.id)
        setMessages(rows.map((m) => toChatMessage(m, meRef.current, otherRef.current)))
        markIncomingAsRead(rows)
    }, [markIncomingAsRead])

    // Load initial history
    useEffect(() => {
        setLoading(true)
        setMessages([])
        loadHistory()
            .catch((error) => {
                console.error('Failed to load conversation', error)
                toast.error('No se pudo cargar la conversación.')
            })
            .finally(() => setLoading(false))
    }, [other.id, loadHistory])

    // Handle realtime subscription
    useEffect(() => {
        const channel = directMessageService.subscribe(other.id, (row) => {
            if (row.sender_id !== otherRef.current.id || row.receiver_id !== meRef.current.id) return
            setMessages((current) =>
                current.some((m) => m.id === row.id)
                    ? current
                    : [...current, toChatMessage(row, meRef.current, otherRef.current)]
            )
            markIncomingAsRead([row])
        })
        // Track the connection so the composer can say when it is offline.
        const statusTimer = window.setInterval(() => {
            setIsConnected(channel.state === 'joined')
        }, 1000)
        setIsConnected(channel.state === 'joined')
        return () => {
            window.clearInterval(statusTimer)
            supabase.removeChannel(channel)
        }
    }, [other.id, markIncomingAsRead])

    const sendMessage = useCallback(
        async (content: string) => {
            const text = content.trim()
            if (!text) return
            const tempId = `pending-${Date.now()}`
            setMessages((current) => [
                ...current,
                {
                    id: tempId,
                    content: text,
                    user: { name: meRef.current.name },
                    createdAt: new Date().toISOString(),
                    userId: meRef.current.id,
                    pending: true,
                },
            ])
            try {
                await directMessageService.send(otherRef.current.id, text)
                // Replace the pending copy with the stored message.
                await loadHistory()
            } catch (error) {
                console.error('Failed to send message', error)
                setMessages((current) => current.filter((m) => m.id !== tempId))
                toast.error('No se pudo enviar el mensaje. Revisa tu conexión e inténtalo de nuevo.')
                throw error
            }
        },
        [loadHistory]
    )

    return { messages, sendMessage, isConnected, loading }
}
