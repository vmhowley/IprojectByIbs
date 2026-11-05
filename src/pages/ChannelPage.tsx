import { Hash, Send } from 'lucide-react';
import React, { KeyboardEvent, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { ChatMessageItem } from '../components/chat/chat-message';
import { Button } from '../components/ui/Button';
import { useChatScroll } from '../hooks/use-chat-scroll';
import { useAuth } from '../hooks/useAuth';
import { channelService } from '../services/channelService';
import { messageService } from '../services/messageService';
import { ChannelMessage } from '../types/Channel';

/** A team channel: one running conversation everyone in the company can read. */
export function ChannelPage() {
    const { channelId } = useParams<{ channelId: string }>();
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChannelMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [channelName, setChannelName] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const { containerRef, scrollToBottom } = useChatScroll();
    const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

    useEffect(() => {
        if (channelId) {
            loadChannel();
            loadMessages();
            subscribeToMessages();
        }

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
                subscriptionRef.current = null;
            }
        };
    }, [channelId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const loadChannel = async () => {
        try {
            const channels = await channelService.getAll();
            const current = channels.find(c => c.id === channelId);
            setChannelName(current?.name || '');
        } catch (err) {
            console.error(err);
        }
    };

    const loadMessages = async () => {
        if (!channelId) return;
        setLoading(true);
        try {
            const data = await messageService.getByChannel(channelId);
            setMessages(data);
        } catch (error) {
            console.error('Error loading messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        if (!channelId) return;

        // Unsubscribe previous if exists
        if (subscriptionRef.current) subscriptionRef.current.unsubscribe();

        subscriptionRef.current = messageService.subscribe(channelId, (msg) => {
            // The first load and the live feed can overlap; keep each message once.
            setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]));
        });
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = newMessage.trim();
        if (!text || !channelId || sending) return;

        setSending(true);
        setNewMessage('');
        try {
            await messageService.send(channelId, text);
        } catch (error) {
            console.error('Error sending message:', error);
            // Give the text back so nothing typed is lost.
            setNewMessage(text);
            toast.error('No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    // Enter sends, Shift+Enter adds a line.
    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const name = channelName || 'canal';

    return (
        <div className="flex h-full min-h-0 flex-col bg-paper">
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-rule px-4 sm:px-6">
                <Hash size={18} aria-hidden="true" className="text-ink-3" />
                <div className="min-w-0">
                    <h1 className="truncate text-[15px] font-semibold leading-tight text-ink">{channelName || 'Cargando…'}</h1>
                    <p className="text-xs text-ink-3">Canal del equipo · lo leen todos los de tu empresa</p>
                </div>
            </div>

            {/* Messages */}
            <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto bg-desk px-4 py-3 sm:px-6" aria-live="polite">
                {loading ? (
                    <p className="py-8 text-center text-sm text-ink-3">Cargando mensajes…</p>
                ) : messages.length === 0 ? (
                    <p className="mx-auto max-w-sm py-10 text-center text-sm text-ink-3">
                        Este es el comienzo de <span className="font-semibold text-ink-2">#{name}</span>. Escribe el primer mensaje abajo.
                    </p>
                ) : (
                    <div className="mx-auto max-w-4xl">
                        {messages.map((msg, index) => {
                            const showHeader = index === 0 || messages[index - 1].user_id !== msg.user_id;
                            return (
                                <ChatMessageItem
                                    key={msg.id}
                                    message={{
                                        id: msg.id,
                                        content: msg.content,
                                        user: { name: msg.user?.name || 'Usuario' },
                                        createdAt: msg.created_at,
                                        userId: msg.user_id,
                                    }}
                                    isOwnMessage={msg.user_id === user?.id}
                                    showHeader={showHeader}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="flex shrink-0 items-end gap-2 border-t border-rule bg-well p-3 sm:px-6">
                <label htmlFor="channel-composer" className="sr-only">
                    Mensaje para #{name}
                </label>
                <textarea
                    id="channel-composer"
                    rows={1}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={`Escribe en #${name}…`}
                    className="field max-h-40 min-h-9 resize-none py-2"
                />
                <Button type="submit" size="icon" aria-label="Enviar mensaje" disabled={!newMessage.trim()} isLoading={sending}>
                    {!sending && <Send size={16} />}
                </Button>
            </form>
        </div>
    );
}
