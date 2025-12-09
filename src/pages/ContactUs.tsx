import { RealtimeChat } from '@/components/chat/realtime-chat';
import { Lock, MessageSquare, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { getUsers } from '../services/usersService';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const ContactUs = () => {
  const { user: currentUser } = useAuth();
  const { limits } = useSubscription();
  const navigate = useNavigate();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      // Filter out the current user from the list
      const otherUsers = data?.filter((u: UserProfile) => u.id !== currentUser?.id) || [];
      setUsers(otherUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoomId = (user1Id: string, user2Id: string) => {
    return `chat_${[user1Id, user2Id].sort().join('_')}`;
  };

  if (!currentUser) {
    return <div className="p-8 text-center text-gray-500">Inicia sesión para usar el chat.</div>;
  }

  if (!limits.hasChat) {
    return (
      <div className="flex h-[calc(100vh-6rem)] items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Función Premium</h2>
            <p className="mt-2 text-gray-600">
              El chat en tiempo real está disponible exclusivamente en el plan Pro.
            </p>
          </div>
          <Button className="w-full" onClick={() => navigate('/pricing')}>
            Actualizar a Pro
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4 p-4 bg-gray-50">
      {/* Sidebar - User List */}
      <div className="w-1/3 min-w-[250px] max-w-sm">
        <Card className="h-full flex flex-col p-0 overflow-hidden">
          <div className="p-4 border-b bg-white">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <User className="w-5 h-5" />
              Usuarios
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {loading ? (
              <div className="text-center p-4 text-gray-500">Cargando usuarios...</div>
            ) : users.length === 0 ? (
              <div className="text-center p-4 text-gray-500">
                <p className="mb-2">No tienes colaboradores aún.</p>
                <p className="text-xs">Invita personas a tus proyectos para añadirlas a tu red de chat.</p>
              </div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
                    ${selectedUser?.id === user.id
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'hover:bg-gray-100 text-gray-700'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold
                    ${selectedUser?.id === user.id ? 'bg-blue-200 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1">
        <Card className="h-full flex flex-col p-0 overflow-hidden">
          {selectedUser ? (
            <div className="flex flex-col h-full">
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-800">{selectedUser.name}</h2>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      En línea
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                {/* Use key to force re-render when switching users/rooms */}
                <RealtimeChat
                  key={getRoomId(currentUser.id, selectedUser.id)}
                  username={currentUser.name}
                  userId={currentUser.id}
                  roomName={getRoomId(currentUser.id, selectedUser.id)}
                  messages={[]}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Selecciona un usuario</h3>
              <p className="text-sm max-w-xs">Elige a alguien de la lista para comenzar a chatear en tiempo real.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};