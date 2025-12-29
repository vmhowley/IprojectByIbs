import { Bell, Check, CheckCheck, ChevronRight, Clock, Info, MessageSquare, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NProgress from '../lib/nprogress';
import { Notification, notificationService } from '../services/notificationService';


export const InboxPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();

        if (user) {
            const sub = notificationService.subscribe(user.id, (notification) => {
                setNotifications(prev => [notification, ...prev]);
            });
            return () => {
                sub.unsubscribe();
            };
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            NProgress.start();
            const data = await notificationService.getAll();
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
            NProgress.done();
        }
    };


    const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            // Call service directly, bypassing handleMarkAsRead to avoid event issues
            try {
                notificationService.markAsRead(notification.id); // fire and forget
                setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
            } catch (err) {
                console.error(err);
            }
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'assignment': return <User className="w-5 h-5 text-blue-500" />;
            case 'comment': return <MessageSquare className="w-5 h-5 text-green-500" />;
            case 'system': return <Info className="w-5 h-5 text-orange-500" />;
            case 'mention': return <User className="w-5 h-5 text-purple-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <Bell className="w-8 h-8 text-indigo-600" />
                        Notificaciones
                    </h1>
                    <p className="text-gray-500 mt-1">Mantente al día con lo que sucede en tus proyectos.</p>
                </div>

                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                        <CheckCheck size={16} />
                        Marcar todo como leído
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                {loading ? (
                    null
                ) : notifications.length === 0 ? (

                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Check className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Estás al día</h3>
                        <p className="text-gray-500 mt-1">No tienes nuevas notificaciones por ahora.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map(notification => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 flex gap-4 transition-colors relative group ${notification.link ? 'cursor-pointer hover:bg-gray-50' : ''
                                    } ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                            >
                                <div className={`mt-1 shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!notification.is_read ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                                    {getIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className={`text-sm font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-gray-400 whitespace-nowrap flex items-center gap-1">
                                            <Clock size={12} />
                                            {new Date(notification.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className={`text-sm mt-1 ${!notification.is_read ? 'text-gray-800' : 'text-gray-500'}`}>
                                        {notification.content}
                                    </p>
                                    {notification.link && (
                                        <p className="text-xs text-indigo-600 mt-2 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                            Ver detalles <ChevronRight size={12} />
                                        </p>
                                    )}
                                </div>

                                {!notification.is_read && (
                                    <button
                                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                                        title="Marcar como leído"
                                        className="shrink-0 self-center p-2 text-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
