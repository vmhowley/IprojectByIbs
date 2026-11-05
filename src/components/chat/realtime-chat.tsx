import { ChatMessageItem } from '@/components/chat/chat-message'
import { Button } from '@/components/ui/Button'
import { useChatScroll } from '@/hooks/use-chat-scroll'
import { useRealtimeChat } from '@/hooks/use-realtime-chat'
import { Send } from 'lucide-react'
import { FormEvent, KeyboardEvent, useEffect, useState } from 'react'

interface ChatPerson {
    id: string
    name: string
}

interface RealtimeChatProps {
    me: ChatPerson
    other: ChatPerson
}

/**
 * Realtime chat component
 * @param me - The signed-in person
 * @param other - The person on the other side of the conversation
 * @returns The conversation and its composer
 */
export const RealtimeChat = ({ me, other }: RealtimeChatProps) => {
    const { containerRef, scrollToBottom } = useChatScroll()
    const { messages, sendMessage, isConnected, loading } = useRealtimeChat({ me, other })
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => {
        // Scroll to bottom whenever messages change
        scrollToBottom()
    }, [messages, scrollToBottom])

    const handleSendMessage = async (e?: FormEvent) => {
        e?.preventDefault()
        const text = newMessage.trim()
        if (!text || sending) return
        setSending(true)
        setNewMessage('')
        try {
            await sendMessage(text)
        } catch {
            // Give the text back so nothing typed is lost.
            setNewMessage(text)
        } finally {
            setSending(false)
        }
    }

    // Enter sends, Shift+Enter adds a line.
    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    return (
        <div className="flex h-full w-full flex-col">
            <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3" aria-live="polite">
                {loading ? (
                    <p className="py-8 text-center text-sm text-ink-3">Cargando conversación…</p>
                ) : messages.length === 0 ? (
                    <p className="mx-auto max-w-xs py-8 text-center text-sm text-ink-3">
                        Aún no hay mensajes con {other.name}. Escribe el primero abajo.
                    </p>
                ) : (
                    messages.map((message, index) => {
                        const prevMessage = index > 0 ? messages[index - 1] : null
                        const showHeader = !prevMessage || prevMessage.userId !== message.userId
                        return (
                            <ChatMessageItem
                                key={message.id}
                                message={message}
                                isOwnMessage={message.userId === me.id}
                                showHeader={showHeader}
                            />
                        )
                    })
                )}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-end gap-2 border-t border-rule bg-well p-3">
                <label htmlFor="dm-composer" className="sr-only">
                    Mensaje para {other.name}
                </label>
                <textarea
                    id="dm-composer"
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={`Escribe a ${other.name}…`}
                    className="field max-h-40 min-h-9 resize-none py-2"
                />
                <Button type="submit" size="icon" aria-label="Enviar mensaje" disabled={!newMessage.trim()} isLoading={sending}>
                    {!sending && <Send size={16} />}
                </Button>
            </form>
            {!isConnected && !loading && (
                <p className="border-t border-rule bg-well px-3 pb-2 text-xs text-ink-3">
                    Sin conexión en tiempo real: los mensajes nuevos aparecerán al recargar.
                </p>
            )}
        </div>
    )
}
