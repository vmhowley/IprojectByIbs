
import { Activity, ChevronDown, ChevronUp, FolderKanban, Plus, Zap } from 'lucide-react';
import { useEffect, useState } from 'react'; // Added useMemo
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { NewProjectModal } from '../components/project/NewProjectModal';
import { ProjectBoardCard } from '../components/project/ProjectBoardCard';
import { ProjectCard } from '../components/project/ProjectCard';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ViewSwitcher, ViewType } from '../components/ui/ViewSwitcher';
import { BoardView } from '../components/views/BoardView';
import { TableView } from '../components/views/TableView';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import NProgress from '../lib/nprogress';
import { projectService } from '../services/projectService';
import { Project } from '../types';


export function Projects() {
  const { user } = useAuth();
  const { limits } = useSubscription();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewType>('grid');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectDefaultClient, setNewProjectDefaultClient] = useState<string | undefined>();

  // New state for collapsible sections
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = projects.filter(project =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    } else {
      setFilteredProjects(projects);
    }
  }, [searchQuery, projects]);

  const loadProjects = async () => {
    try {
      NProgress.start();
      setIsLoading(true);
      const data = await projectService.getAll();
      setProjects(data);
      setFilteredProjects(data);

      // Auto-expand all clients by default
      const allClientIds = new Set(data.map(p => p.client_id || 'unassigned'));
      setExpandedClients(allClientIds);

    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
      NProgress.done();
    }
  };


  const handleCreateProject = async (projectData: Partial<Project>, files: File[]) => {
    try {
      // 1. Create Project
      const newProject = await projectService.create(projectData);

      // 2. Upload Files
      if (files.length > 0) {
        const { storageService } = await import('../services/storageService');
        const attachments = [];

        for (const file of files) {
          try {
            const { url } = await storageService.uploadFile(file, newProject.id);
            attachments.push({
              name: file.name,
              url,
              size: file.size,
              type: file.type
            });
          } catch (err) {
            console.error('Failed to upload file:', file.name, err);
            // Continue with other files
          }
        }

        // 3. Update Project with Attachments
        if (attachments.length > 0) {
          await projectService.update(newProject.id, { attachments });
        }
      }

      await loadProjects();
      setShowNewProjectModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };

  const handleNewProjectClick = (clientId?: string) => {
    if (projects.length >= limits.maxProjects) {
      if (confirm(`Has alcanzado el límite de ${limits.maxProjects} proyectos de tu plan Gratis. \n\n¿Quieres actualizar a Pro para tener proyectos ilimitados?`)) {
        navigate('/pricing');
      }
      return;
    }
    setNewProjectDefaultClient(clientId);
    setShowNewProjectModal(true);
  };

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return null;
    }


    if (filteredProjects.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FolderKanban size={64} className="text-gray-300 dark:text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos'}
            </h3>
            <p className="text-gray-600 dark:text-slate-400 mb-4">
              {searchQuery
                ? 'Intenta con otro término de búsqueda'
                : 'Comienza creando tu primer proyecto'}
            </p>
            {!searchQuery && user?.role !== 'guest' && (
              <Button onClick={() => handleNewProjectClick()}>
                <Plus size={18} />
                Crear Proyecto
              </Button>
            )}
          </div>
        </div>
      );
    }

    if (viewMode === 'board') {
      const columns = [
        {
          id: 'active',
          title: 'Activos',
          items: filteredProjects.filter(p => p.status === 'active'),
        },
        {
          id: 'completed',
          title: 'Completados',
          items: filteredProjects.filter(p => p.status === 'completed'),
        },
        {
          id: 'archived',
          title: 'Archivados',
          items: filteredProjects.filter(p => !p.status || p.status === 'archived'),
        },
      ];

      return (
        <BoardView
          columns={columns}
          renderItem={(project) => (
            <ProjectBoardCard key={project.id} project={project} />
          )}
        />
      );
    }

    if (viewMode === 'list') {
      return (
        <TableView
          data={filteredProjects}
          onRowClick={(project) => navigate(`/project/${project.id}`)}
          columns={[
            { header: 'Nombre', accessorKey: 'name', className: 'font-medium text-gray-900' },
            {
              header: 'Estado',
              cell: (p) => <StatusBadge status={p.status || 'active'} /> // Assuming status exists
            },
            {
              header: 'Cliente',
              cell: (p) => p.clients?.name || '-'
            },
            {
              header: 'Tareas',
              cell: (p) => `${p.stats?.completed_tasks || 0}/${p.stats?.total_tasks || 0}`
            },
            {
              header: 'Fecha Creación',
              cell: (p) => new Date(p.created_at).toLocaleDateString()
            }
          ]}
        />
      );
    }

    // Default: List (Grid) organized by Client

    // Group Projects by Client
    const groupedProjects = filteredProjects.reduce((groups, project) => {
      const clientId = project.client_id || 'unassigned';

      let clientName = project.clients?.name || 'Sin Cliente Asignado';

      // Customize labels
      if (clientId === 'unassigned') {
        clientName = 'Proyectos Personales';
      }

      if (user?.client_id && clientId === user.client_id) {
        clientName = `${clientName} (Vinculado)`;
      }

      if (!groups[clientId]) {
        groups[clientId] = {
          id: clientId,
          name: clientName,
          projects: []
        };
      }
      groups[clientId].projects.push(project);
      return groups;
    }, {} as Record<string, { id: string, name: string, projects: Project[] }>);

    const sortedClientIds = Object.keys(groupedProjects).sort((a, b) =>
      groupedProjects[a].name.localeCompare(groupedProjects[b].name)
    );

    const totalProjects = filteredProjects.length;
    const activeProjects = filteredProjects.filter(p => p.status === 'active').length;
    const completedProjects = filteredProjects.filter(p => p.status === 'completed').length;

    return (
      <div className="space-y-10 animate-in fade-in duration-500">

        {/* New: Stats Dashboard Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <FolderKanban size={80} className="text-indigo-500" />
            </div>
            <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">Total Proyectos</h3>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{totalProjects}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-500/10 w-fit px-2 py-1 rounded-full">
              <span>+2 esta semana</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={80} className="text-emerald-500" />
            </div>
            <h3 className="text-gray-500 dark:text-slate-400 text-sm font-medium mb-1">En Curso</h3>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">{activeProjects}</p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 w-fit px-2 py-1 rounded-full">
              <span>Activos ahora</span>
            </div>
          </div>

          <div className="bg-linear-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 opacity-20 transform rotate-12 group-hover:scale-110 transition-transform">
              <Zap size={100} />
            </div>
            <h3 className="text-indigo-100 text-sm font-medium mb-1">Productividad</h3>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-bold">{completedProjects}</p>
              <span className="mb-1.5 text-indigo-200 text-sm">completados</span>
            </div>
            <p className="mt-4 text-xs text-indigo-100/80 leading-relaxed max-w-[80%]">
              Mantén el ritmo! Has completado {completedProjects} proyectos este año.
            </p>
          </div>
        </div>

        {/* Categories / Clients Section */}
        <div className="space-y-12">
          {sortedClientIds.map(clientId => {
            const group = groupedProjects[clientId];
            const isExpanded = expandedClients.has(clientId);

            return (
              <div key={clientId} className="group/section">
                {/* Modern Section Header */}
                <div className="flex items-end justify-between mb-6 border-b border-gray-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                      {group.name}
                    </h2>
                    <span className="text-sm text-gray-400 font-medium self-center mt-1">({group.projects.length})</span>
                  </div>

                  <button
                    onClick={() => toggleClient(clientId)}
                    className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors flex items-center gap-1"
                  >
                    {isExpanded ? 'Ocultar' : 'Mostrar'}
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>

                {/* Projects Content */}
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 transition-all duration-300 ease-in-out ${isExpanded ? 'opacity-100' : 'hidden opacity-0'}`}
                >
                  {group.projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      taskCount={project.stats?.total_tasks || 0}
                      completedTaskCount={project.stats?.completed_tasks || 0}
                    />
                  ))}

                  {/* "Add New" Ghost Card */}
                  <button
                    onClick={() => handleNewProjectClick(clientId === 'unassigned' ? undefined : clientId)}
                    className="flex flex-col items-center justify-center h-full min-h-70 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all group/add gap-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover/add:bg-indigo-100 dark:group-hover/add:bg-indigo-500/20 transition-colors">
                      <Plus size={24} className="text-gray-400 group-hover/add:text-indigo-600 dark:group-hover/add:text-indigo-400" />
                    </div>
                    <span className="font-semibold text-gray-500 group-hover/add:text-indigo-600 dark:text-slate-400 dark:group-hover/add:text-indigo-400 transition-colors">Nuevo Proyecto</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
      <PageHeader
        title="Proyectos"
        subtitle="Gestiona todos tus proyectos en un solo lugar"
        search={{
          value: searchQuery,
          onChange: setSearchQuery,
          placeholder: "Buscar proyectos..."
        }}
        actions={user?.role !== 'guest' ? [
          {
            label: 'Crear Proyecto',
            icon: Plus,
            onClick: () => handleNewProjectClick()
          }
        ] : []}
      >
        <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
      </PageHeader>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </div>

      {showNewProjectModal && (
        <NewProjectModal
          onClose={() => setShowNewProjectModal(false)}
          onSubmit={handleCreateProject}
          defaultClientId={newProjectDefaultClient}
        />
      )}
    </div>
  );
}
