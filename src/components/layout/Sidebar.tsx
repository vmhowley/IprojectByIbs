import {
  Bookmark,
  Calendar,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Crown,
  FolderKanban,
  Hash,
  HelpCircle,
  Home,
  Inbox,
  Map,
  Plus,
  Settings,
  Shield,
  Users,
  X
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSubscription } from '../../hooks/useSubscription';
import { supabase } from '../../lib/supabase';
import { channelService } from '../../services/channelService';
import { notificationService } from '../../services/notificationService';
import { Channel as TeamChannel } from '../../types/Channel';

interface SidebarProps {
  onNewProject?: () => void;
  isOpen?: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPro } = useSubscription();

  const [channels, setChannels] = useState<TeamChannel[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedSections, setExpandedSections] = useState({
    workspace: true,
    channels: true,
    engineering: false // Deprecated, keeping false
  });


  useEffect(() => {
    if (user && user.role !== 'guest') {
      loadChannels();
      loadUnreadCount();

      // Listen for project deletions to refresh
      const handleProjectDeleted = () => {
        // Reloading the page is the safest way to ensure sidebar consistency if we can't force a re-fetch of projects easily 
        // But let's try to just re-fetch if we had a project list in sidebar.
        // Actually Sidebar only has links. If the user was on the deleted project page, they are redirected.
        // But the Sidebar might have cached data if it had a projects list.
        // Current Sidebar doesn't list projects directly, it links to /projects.
        // However, if we added a "Recent Projects" section later, this would be useful.
        // For now, let's just log it or if we had a project list here, reload it.
        // Wait, the user complaint is "console error... cannot read what was deleted".
        // This implies the UI is trying to render the deleted item.
        // By dispatching this event, we can maybe trigger a reload of data if Sidebar was holding it.
        // Since Sidebar doesn't seem to hold project list state (only channels), this might be future proofing,
        // or maybe I missed where projects are listed.
        // Ah, Sidebar has "workspace -> projects" link. 
        // If `ProjectList` page is active, it will re-fetch on mount.
        // If the user meant the Sidebar *Channels* or *Recent*, we need to be careful.
        // Let's just keep the listener structure.
        console.log('Project deleted event received');
      };

      window.addEventListener('project-deleted', handleProjectDeleted);

      // Subscribe to notifications
      const sub = notificationService.subscribe(user.id, (_notification) => {
        // Simple increment on new notification
        setUnreadCount(prev => prev + 1);
      });

      return () => {
        sub.unsubscribe();
      }
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const loadChannels = async () => {
    try {
      const data = await channelService.getAll();
      setChannels(data);
    } catch (error) {
      console.error('Error loading channels:', error);
    }
  };

  const handleCreateChannel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt('Nombre del nuevo canal (ej. General):');
    if (!name) return;

    try {
      // Normalize: remove # if present
      const cleanName = name.replace(/^#/, '');
      await channelService.create(cleanName);
      loadChannels(); // Refresh
    } catch (error) {
      alert('Error creando canal');
      console.error(error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-md flex items-center justify-center text-white font-bold text-sm">
              IBS
            </div>
            <div>
              <h1 className="font-semibold text-sm text-gray-900">IBS Project Tracker</h1>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                Sincronizando
              </p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1 text-gray-500 hover:bg-gray-200 rounded-md"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          <div className="px-2 space-y-0.5 mb-4">
            <Link
              to="/dashboard"
              onClick={onClose}
              className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${isActive('/dashboard')
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Home size={18} />
              <span>Inicio</span>
            </Link>
            <Link
              to="/inbox"
              onClick={onClose}
              className={`flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors ${isActive('/inbox')
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <div className="flex items-center gap-2">
                <Inbox size={18} />
                <span>Notificaciones</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/saved"
              onClick={onClose}
              className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${isActive('/saved')
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-700 hover:bg-gray-100'
                }`}
            >
              <Bookmark size={18} />
              <span>Items guardados</span>
            </Link>
          </div>

          <div className="px-2 mb-4">
            <button
              onClick={() => toggleSection('workspace')}
              className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
            >
              <span>Área de trabajo</span>
              {expandedSections.workspace ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {expandedSections.workspace && (
              <div className="mt-1 space-y-0.5">
                <Link
                  to="/tasks"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <CheckSquare size={18} />
                  <span>Tareas</span>
                </Link>
                <Link
                  to="/projects"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <FolderKanban size={18} />
                  <span>Proyectos</span>
                </Link>
                <Link
                  to="/calendar"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Calendar size={18} />
                  <span>Calendario</span>
                </Link>
                <Link
                  to="/roadmaps"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Map size={18} />
                  <span>Mapas</span>
                </Link>
                {user?.role !== 'guest' && (
                  <Link
                    to="/clients"
                    onClick={onClose}
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Users size={18} />
                    <span>Clientes</span>
                  </Link>
                )}
              </div>
            )}
          </div>

          {user?.role !== 'guest' && (
            <div className="px-2 mb-4">
              <div className="flex items-center justify-between px-2 py-1 group">
                <button
                  onClick={() => toggleSection('channels')}
                  className="flex-1 flex items-center justify-between text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  <span>CANALES DE EQUIPO</span>
                  {expandedSections.channels ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                <button
                  onClick={handleCreateChannel}
                  title="Crear canal"
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-200 rounded text-gray-500 transition-opacity"
                >
                  <Plus size={14} />
                </button>
              </div>

              {expandedSections.channels && (
                <div className="mt-1 space-y-0.5">
                  {channels.length === 0 && (
                    <p className="px-2 py-1 text-xs text-gray-400 italic">No hay canales.</p>
                  )}
                  {channels.map(channel => (
                    <Link
                      key={channel.id}
                      to={`/channels/${channel.id}`}
                      onClick={onClose}
                      className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${isActive(`/channels/${channel.id}`) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                    >
                      <Hash size={16} className={isActive(`/channels/${channel.id}`) ? "text-indigo-500" : "text-gray-400"} />
                      <span>{channel.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="border-t border-gray-200">
          {/* Upgrade Plan Widget */}
          {!isPro && user?.role !== 'guest' && (
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 mx-3 my-3 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <Crown size={16} className="text-indigo-600" />
                <p className="text-xs font-semibold text-indigo-900">Plan Gratis</p>
              </div>
              <p className="text-xs text-indigo-700 mb-3 leading-relaxed">
                Desbloquea proyectos ilimitados y funciones premium.
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="w-full px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Actualizar a Pro
              </button>
            </div>
          )}

          <div className="px-2 pb-3 space-y-0.5">
            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={onClose}
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors font-medium"
              >
                <Shield size={18} />
                <span>Panel de Admin</span>
              </Link>
            )}
            {user?.role !== 'guest' && (
              <>
                <Link
                  to="/settings"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Settings size={18} />
                  <span>Configuraciones</span>
                </Link>
                <Link
                  to="/help"
                  onClick={onClose}
                  className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <HelpCircle size={18} />
                  <span>Ayuda & soporte</span>
                </Link>
              </>
            )}
          </div>

          <UserProfile isPro={isPro} />
        </div>
      </aside>
    </>
  );
}

function UserProfile({ isPro }: { isPro?: boolean }) {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700';
      case 'user':
        return 'bg-blue-100 text-blue-700';
      case 'guest':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Admin';
      case 'user':
        return 'Usuario';
      case 'guest':
        return 'Invitado';
      default:
        return role;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="border-t border-gray-200 p-3">
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="w-full flex items-start gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1  space-x-2 text-left">
            <p className="text-sm font-medium text-gray-900 ">{user.name}</p>
            {isPro && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white animate-pulse">
                PRO
              </span>
            )}

            <span className={`inline-block px-1.5 py-0.5 text-xs font-medium rounded ${getRoleBadgeColor(user.role)}`}>
              {getRoleLabel(user.role)}
            </span>
          </div>
        </button>

        {showMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <div className="p-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>

            <button
              onClick={async () => {
                if (!confirm('¿Quieres reclamar todos los proyectos antiguos como tuyos?')) return;
                const { error } = await supabase.from('projects').update({ created_by: user.id }).is('created_by', null);
                if (error) alert('Error: ' + error.message);
                else {
                  alert('Proyectos recuperados. Refrescando página...');
                  window.location.reload();
                }
              }}
              className="w-full px-3 py-2 text-left text-sm text-indigo-600 hover:bg-indigo-50 transition-colors border-b border-gray-100"
            >
              Recuperar proyectos antiguos
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
