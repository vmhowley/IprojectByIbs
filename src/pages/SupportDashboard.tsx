import { ArrowLeft, CheckCircle, LifeBuoy, Send } from 'lucide-react';
import { KeyboardEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { ChatMessageItem } from '../components/chat/chat-message';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonRows } from '../components/ui/Skeleton';
import { useAuthContext } from '../contexts/AuthContext';
import { useChatScroll } from '../hooks/use-chat-scroll';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { SupportChat, SupportMessage, supportService } from '../services/supportService';
import { formatDate, timeAgo } from '../utils/format';

/** The support desk: open conversations on the left, the selected one on the right. */
export default function SupportDashboard() {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [chats, setChats] = useState<(SupportChat & { user_email?: string })[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const { containerRef, scrollToBottom } = useChatScroll();

    // Load chats on mount
    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'support_agent')) {
            navigate('/'); // Redirect non-support_agents
            return;
        }

        const loadChats = async () => {
            try {
                const openChats = await supportService.getAllOpenChats();
                setChats(openChats);
            } catch (error) {
                console.error('Failed to load chats', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadChats();

        // Subscribe to new chats
        const channel = supabase.channel('admin_support_chats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'support_chats' },
                () => loadChats() // Refresh list on any change
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, navigate]);

    // Load messages when chat selected
    useEffect(() => {
        if (!selectedChatId) return;

        const loadMessages = async () => {
            const msgs = await supportService.getMessages(selectedChatId);
            setMessages(msgs);
        };

        setMessages([]);
        loadMessages();

        // Subscribe to messages for this chat
        const channel = supabase.channel(`admin_chat:${selectedChatId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'support_messages',
                    filter: `chat_id=eq.${selectedChatId}`
                },
                (payload) => {
                    const newMsg = payload.new as SupportMessage;
                    setMessages((current) => (current.some((m) => m.id === newMsg.id) ? current : [...current, newMsg]));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChatId]);

    // Scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const text = newMessage.trim();
        if (!selectedChatId || !text || !user || sending) return;

        setSending(true);
        setNewMessage('');
        try {
            await supportService.sendMessage(selectedChatId, user.id, text);
        } catch (error) {
            console.error('Failed to send message', error);
            setNewMessage(text);
            toast.error('No se pudo enviar la respuesta.');
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

    const handleResolveChat = async () => {
        if (!selectedChatId) return;
        try {
            await supportService.resolveChat(selectedChatId);
            setSelectedChatId(null);
            setChats(prev => prev.filter(c => c.id !== selectedChatId));
            toast.success('Conversación resuelta');
        } catch (error) {
            console.error('Failed to resolve chat', error);
            toast.error('No se pudo marcar como resuelta.');
        }
    };

    const selectedChat = chats.find((c) => c.id === selectedChatId) || null;
    const customer = selectedChat?.user_email || 'Usuario';

    return (
        <div className="flex h-full min-h-0">
            {/* Sidebar: Chat List */}
            <aside
                aria-label="Cola de soporte"
                className={cn('flex w-full shrink-0 flex-col border-r border-rule bg-paper md:w-80', selectedChatId && 'max-md:hidden')}
            >
                <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-rule px-4">
                    <h1 className="text-[15px] font-semibold text-ink">Cola de soporte</h1>
                    <span className="text-xs tabular-nums text-ink-3">{chats.length} {chats.length === 1 ? 'abierta' : 'abiertas'}</span>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {isLoading ? (
                        <SkeletonRows rows={6} columns={1} />
                    ) : chats.length === 0 ? (
                        <p className="px-4 py-10 text-center text-sm text-ink-3">No hay conversaciones abiertas.</p>
                    ) : (
                        <ul className="divide-y divide-rule">
                            {chats.map(chat => {
                                const active = selectedChatId === chat.id;
                                return (
                                    <li key={chat.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedChatId(chat.id)}
                                            aria-current={active ? 'true' : undefined}
                                            className={cn(
                                                'flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus',
                                                active ? 'bg-focus/[0.08]' : 'hover:bg-ink/[0.03]'
                                            )}
                                        >
                                            <Avatar name={chat.user_email || '?'} size="sm" />
                                            <span className="min-w-0 flex-1">
                                                <span className={cn('block truncate text-sm text-ink', active ? 'font-semibold' : 'font-medium')}>
                                                    {chat.user_email || 'Usuario sin correo'}
                                                </span>
                                                <span className="block text-xs text-ink-3">Abierta {timeAgo(chat.created_at)}</span>
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </aside>

            {/* Main Area: Chat Window */}
            <section className={cn('flex min-w-0 flex-1 flex-col bg-desk', !selectedChatId && 'max-md:hidden')}>
                {selectedChatId ? (
                    <>
                        <div className="flex h-14 shrink-0 items-center gap-3 border-b border-rule bg-paper px-4">
                            <button
                                type="button"
                                onClick={() => setSelectedChatId(null)}
                                aria-label="Volver a la cola"
                                className="-ml-1 inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 hover:bg-ink/[0.06] hover:text-ink md:hidden"
                            >
                                <ArrowLeft size={16} />
                            </button>
                            <div className="min-w-0 flex-1">
                                <h2 className="truncate text-[15px] font-semibold text-ink">{customer}</h2>
                                {selectedChat && <p className="text-xs text-ink-3">Abierta el {formatDate(selectedChat.created_at, 'datetime')}</p>}
                            </div>
                            <Button variant="secondary" size="sm" onClick={handleResolveChat}>
                                <CheckCircle size={14} aria-hidden="true" />
                                Marcar resuelta
                            </Button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" ref={containerRef} aria-live="polite">
                            {messages.length === 0 ? (
                                <p className="py-8 text-center text-sm text-ink-3">Sin mensajes todavía.</p>
                            ) : (
                                messages.map((msg, index) => {
                                    const mine = msg.sender_id === user?.id;
                                    const fromCustomer = msg.sender_id === selectedChat?.user_id;
                                    const showHeader = index === 0 || messages[index - 1].sender_id !== msg.sender_id;
                                    return (
                                        <ChatMessageItem
                                            key={msg.id}
                                            message={{
                                                id: msg.id,
                                                content: msg.content,
                                                user: { name: fromCustomer ? customer : 'Soporte' },
                                                createdAt: msg.created_at,
                                                userId: msg.sender_id,
                                            }}
                                            isOwnMessage={mine}
                                            showHeader={showHeader}
                                        />
                                    );
                                })
                            )}
                        </div>

                        <form onSubmit={handleSendMessage} className="flex shrink-0 items-end gap-2 border-t border-rule bg-well p-3">
                            <label htmlFor="support-reply" className="sr-only">Respuesta para {customer}</label>
                            <textarea
                                id="support-reply"
                                rows={1}
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder="Escribe la respuesta…"
                                className="field max-h-40 min-h-9 resize-none py-2"
                            />
                            <Button type="submit" size="icon" aria-label="Enviar respuesta" disabled={!newMessage.trim()} isLoading={sending}>
                                {!sending && <Send size={16} />}
                            </Button>
                        </form>
                    </>
                ) : (
                    <EmptyState icon={LifeBuoy} title="Elige una conversación" className="m-auto">
                        Las conversaciones abiertas desde el botón de soporte aparecen en la cola.
                    </EmptyState>
                )}
            </section>
        </div>
    );
}
