
import { ChevronDown, ChevronRight, FolderKanban, Plus, Users } from 'lucide-react'; // Added icons
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
  const [viewMode, setViewMode] = useState<ViewType>('list');
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);

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

  const handleNewProjectClick = () => {
    if (projects.length >= limits.maxProjects) {
      if (confirm(`Has alcanzado el límite de ${limits.maxProjects} proyectos de tu plan Gratis. \n\n¿Quieres actualizar a Pro para tener proyectos ilimitados?`)) {
        navigate('/pricing');
      }
      return;
    }
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
              <Button onClick={handleNewProjectClick}>
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

    if (viewMode === 'table') {
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

    return (
      <div className="space-y-6">
        {sortedClientIds.map(clientId => {
          const group = groupedProjects[clientId];
          const isExpanded = expandedClients.has(clientId);

          return (
            <div key={clientId} className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
              {/* Client Header */}
              <div
                className="flex items-center gap-2 px-4 py-3 bg-indigo-50/50 dark:bg-indigo-500/5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors border-b border-gray-100 dark:border-slate-800"
                onClick={() => toggleClient(clientId)}
              >
                <button className="text-gray-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400">
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{group.name}</h2>
                <span className="text-sm text-gray-500 dark:text-slate-400 ml-auto bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-slate-700">
                  {group.projects.length} proyectos
                </span>
              </div>

              {/* Projects Grid */}
              {isExpanded && (
                <div className="p-6 bg-gray-50/30 dark:bg-slate-950/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.projects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
            onClick: handleNewProjectClick
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
        />
      )}
    </div>
  );
}
