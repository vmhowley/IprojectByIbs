import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Inbox,
  Bookmark,
  CheckSquare,
  FolderKanban,
  Calendar,
  Map,
  Hash,
  FileText,
  Users,
  Layers,
  Play,
  ChevronDown,
  ChevronRight,
  Settings,
  HelpCircle
} from 'lucide-react';
import { Project } from '../../types';
import { projectService } from '../../services/projectService';

interface SidebarProps {
  onNewProject?: () => void;
}

export function Sidebar({ onNewProject }: SidebarProps) {
  const location = useLocation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expandedSections, setExpandedSections] = useState({
    workspace: true,
    channels: true,
    engineering: true
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectService.getAll();
      setProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className="w-60 bg-gray-50 border-r border-gray-200 flex flex-col h-screen">
      <div className="p-3 border-b border-gray-200">
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
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-2 space-y-0.5 mb-4">
          <Link
            to="/"
            className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
              isActive('/')
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Home size={18} />
            <span>Inicio</span>
          </Link>
          <Link
            to="/inbox"
            className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
              isActive('/inbox')
                ? 'bg-gray-200 text-gray-900'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Inbox size={18} />
            <span>Bandeja de entrada</span>
          </Link>
          <Link
            to="/saved"
            className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
              isActive('/saved')
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
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <CheckSquare size={18} />
                <span>Tareas</span>
              </Link>
              <Link
                to="/projects"
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <FolderKanban size={18} />
                <span>Proyectos</span>
              </Link>
              <Link
                to="/calendar"
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Calendar size={18} />
                <span>Calendario</span>
              </Link>
              <Link
                to="/roadmaps"
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Map size={18} />
                <span>Mapas</span>
              </Link>
            </div>
          )}
        </div>

        <div className="px-2 mb-4">
          <button
            onClick={() => toggleSection('channels')}
            className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            <span>Canal</span>
            {expandedSections.channels ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {expandedSections.channels && (
            <div className="mt-1 space-y-0.5">
              <button
                onClick={() => toggleSection('engineering')}
                className="flex items-center justify-between w-full px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Hash size={16} className="text-gray-500" />
                  <span>Canal</span>
                </div>
                {expandedSections.engineering ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              {expandedSections.engineering && (
                <div className="ml-6 space-y-0.5">
                  <Link
                    to="/engineering/docs"
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <FileText size={16} />
                    <span>Documentos</span>
                  </Link>
                  <Link
                    to="/engineering/teams"
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Users size={16} />
                    <span>Equipos</span>
                  </Link>
                  <Link
                    to="/engineering/initiatives"
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Layers size={16} />
                    <span>Iniciativas</span>
                  </Link>
                  <Link
                    to="/engineering/sprint"
                    className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <Play size={16} />
                    <span>Sprint activo</span>
                  </Link>
                </div>
              )}
              <Link
                to="/design"
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Hash size={16} className="text-gray-500" />
                <span>Diseño</span>
                <ChevronRight size={14} className="ml-auto text-gray-400" />
              </Link>
              <Link
                to="/marketing"
                className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Hash size={16} className="text-gray-500" />
                <span>Marketing</span>
                <ChevronRight size={14} className="ml-auto text-gray-400" />
              </Link>
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-gray-200">
        {/* Actualizar para version premium */}
        {/* <div className="p-3 bg-purple-50 mx-3 my-3 rounded-lg">
          <p className="text-xs text-gray-700 mb-2">
            There are <span className="font-semibold">6 days left</span> in your trial.
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Upgrade for unlimited access.
          </p>
          <button className="w-full px-3 py-1.5 bg-white border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
            Upgrade
          </button>
        </div> */}

        <div className="px-2 pb-3 space-y-0.5">
          <Link
            to="/settings"
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Settings size={18} />
            <span>Configuraciones</span>
          </Link>
          <Link
            to="/help"
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            <HelpCircle size={18} />
            <span>Ayuda & soporte</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
