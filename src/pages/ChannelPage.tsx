import { Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { channelService } from '../services/channelService';
import { messageService } from '../services/messageService';
import { ChannelMessage } from '../types/Channel';

export function ChannelPage() {
    const { channelId } = useParams<{ channelId: string }>();
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChannelMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [channelName, setChannelName] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const subscriptionRef = useRef<any>(null);

    useEffect(() => {
        if (channelId) {
            loadChannel();
            loadMessages();
            subscribeToMessages();
        }

        return () => {
            if (subscriptionRef.current) {
                subscriptionRef.current.unsubscribe();
            }
        };
    }, [channelId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadChannel = async () => {
        try {
            const channels = await channelService.getAll();
            const current = channels.find(c => c.id === channelId);
            if (current) setChannelName(current.name);
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
            setMessages(prev => [...prev, msg]);
        });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !channelId) return;

        try {
            await messageService.send(channelId, newMessage.trim());
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Error enviando mensaje');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-white rounded-lg shadow-sm border border-gray-200 m-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900"># {channelName || 'Cargando...'}</h1>
                <p className="text-sm text-gray-500">Canal de tu equipo</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading ? (
                    <div className="text-center text-gray-400 mt-10">Cargando mensajes...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <p>Este es el comienzo del canal <strong>#{channelName}</strong>.</p>
                        <p>¡Sé el primero en escribir!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.user_id === user?.id;
                        const showAvatar = index === 0 || messages[index - 1].user_id !== msg.user_id;

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                                <div className={`flex max-w-[70%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                    {/* Avatar Placeholder */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${showAvatar ? (isMe ? 'bg-indigo-500' : 'bg-gray-400') : 'invisible'}`}>
                                        {msg.user?.name ? msg.user.name.substring(0, 2).toUpperCase() : 'U'}
                                    </div>

                                    <div className={`px-4 py-2 rounded-lg ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}>
                                        {showAvatar && !isMe && <p className="text-xs text-gray-500 mb-1 font-semibold">{msg.user?.name}</p>}
                                        <p className="text-sm">{msg.content}</p>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Enviar mensaje a #${channelName}`}
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                        <Send size={16} />
                    </button>
                </form>
            </div>
        </div>
    );
}
