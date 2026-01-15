
import { CheckCircle, MessageCircle, Send, User as UserIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuthContext } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { SupportChat, SupportMessage, supportService } from '../services/supportService';

export default function SupportDashboard() {
    const { user } = useAuthContext();
    const navigate = useNavigate();
    const [chats, setChats] = useState<(SupportChat & { user_email?: string })[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<SupportMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Load chats on mount
    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/'); // Redirect non-admins
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
                    setMessages((current) => [...current, newMsg]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChatId]);

    // Scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChatId || !newMessage.trim() || !user) return;

        try {
            await supportService.sendMessage(selectedChatId, user.id, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message', error);
        }
    };

    const handleResolveChat = async () => {
        if (!selectedChatId) return;
        try {
            await supportService.resolveChat(selectedChatId);
            setSelectedChatId(null);
            setChats(prev => prev.filter(c => c.id !== selectedChatId));
        } catch (error) {
            console.error('Failed to resolve chat', error);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading support dashboard...</div>;

    return (
        <div className="flex h-full bg-gray-50">
            {/* Sidebar: Chat List */}
            <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Support Queue
                    </h2>
                    <p className="text-sm text-gray-500">{chats.length} open tickets</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No open chats</div>
                    ) : (
                        chats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => setSelectedChatId(chat.id)}
                                className={cn(
                                    "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                                    selectedChatId === chat.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        <UserIcon className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {chat.user_email || 'Unknown User'}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            Started {new Date(chat.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Area: Chat Window */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedChatId ? (
                    <>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="font-semibold text-lg">Chat Details</h3>
                                <p className="text-xs text-gray-500">ID: {selectedChatId}</p>
                            </div>
                            <Button variant="secondary" onClick={handleResolveChat} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Resolve Ticket
                            </Button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50" ref={scrollRef}>
                            {messages.map((msg) => {
                                const isAdmin = msg.sender_id === user?.id; // Assuming I am the admin viewer
                                // Or check if sender is the chat owner (user) vs me (admin)
                                // Better logic: if msg.sender_id === user.id it's ME (the admin answer)

                                return (
                                    <div
                                        key={msg.id}
                                        className={cn(
                                            "flex w-full",
                                            isAdmin ? "justify-end" : "justify-start"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "max-w-[70%] rounded-lg px-4 py-3 text-sm shadow-sm",
                                                isAdmin
                                                    ? "bg-blue-600 text-white rounded-br-none"
                                                    : "bg-white border border-gray-200 text-slate-900 rounded-bl-none"
                                            )}
                                        >
                                            {msg.content}
                                            <div className={cn("text-[10px] mt-1 opacity-70", isAdmin ? "text-blue-100" : "text-gray-400")}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <div className="p-4 border-t border-gray-200 bg-white">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a reply..."
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={!newMessage.trim()}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg">Select a chat to view messages</p>
                    </div>
                )}
            </div>
        </div>
    );
}
