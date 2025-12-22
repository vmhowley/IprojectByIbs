import { FolderKanban, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewProjectModal } from '../components/project/NewProjectModal';
import { ProjectCard } from '../components/project/ProjectCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ViewSwitcher, ViewType } from '../components/ui/ViewSwitcher';
import { BoardView } from '../components/views/BoardView';
import { TableView } from '../components/views/TableView';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { projectService } from '../services/projectService';
import { Project } from '../types';
import { ProjectBoardCard } from '../components/project/ProjectBoardCard';

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
      setIsLoading(true);
      const data = await projectService.getAll();
      setProjects(data);
      setFilteredProjects(data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (projectData: Partial<Project>) => {
    try {
      await projectService.create(projectData);
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando proyectos...</p>
          </div>
        </div>
      );
    }

    if (filteredProjects.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FolderKanban size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No se encontraron proyectos' : 'No hay proyectos'}
            </h3>
            <p className="text-gray-600 mb-4">
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

    // Default: List (which was the old 'grid' actually, or 'list')
    // The user had a Grid/List toggle before. "List" implies linear. "Grid" implies cards.
    // The new "List" should probably be the Grid of Cards (Visual List).
    // Or a ListView component?
    // Let's keep the Grid of Cards as the default "List" view for now as it's the main UI.
    // Actually, "List" usually means rows. "Board" means columns. "Grid" means Gallery.
    // The previous implementation had "Grid" (Gallery) and "List" (Stacked).
    // Let's map ViewSwitcher 'list' to the previous Grid/List UI? 
    // No, let's map 'list' to a clean stacked list or grid.
    // Let's treat 'list' as the Grid view (Gallery) because that's the most common "Project List" view.
    // Wait, the icons in ViewSwitcher are specific. 'List' icon = rows.
    // So 'list' should be rows.
    // But 'table' is also rows.
    // Maybe 'grid' should be added to ViewSwitcher if we want to keep the Gallery view.
    // Let's assume 'list' = Grid of Cards (Visual) because that's what ProjectCard usually is.
    // Actually, ViewSwitcher has `Grid3x3`. I used `List`, `Kanban`, `Table2`.
    // Let's update `ViewSwitcher` to include 'grid' if needed, or just map 'list' to Grid.
    // But 'list' icon is rows.
    // Let's map 'list' to the Grid view for now, as it's the main view, OR add 'grid' option.
    // The user asked for "Table, Board, List".
    // "Board" = Kanban. 
    // "Table" = Data Grid.
    // "List" = ?? Maybe simple list of cards?
    // Let's implement active/completed sections like before for "List" view.

    // Grouping for List/Grid view
    const activeProjects = filteredProjects.filter(p => p.status === 'active');
    const completedProjects = filteredProjects.filter(p => p.status === 'completed');
    const archivedProjects = filteredProjects.filter(p => !p.status || p.status === 'archived');

    return (
      <div className="space-y-8">
        {activeProjects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Activos ({activeProjects.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {completedProjects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Completados ({completedProjects.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {archivedProjects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Archivados ({archivedProjects.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {archivedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderKanban size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
              <p className="text-sm text-gray-600">
                Gestiona todos tus proyectos en un solo lugar
              </p>
            </div>
          </div>
          {user?.role !== 'guest' && (
            <Button onClick={() => setShowNewProjectModal(true)}>
              <Plus size={18} />
              Nuevo Proyecto
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar proyectos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ViewSwitcher currentView={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 border-l border-r border-gray-100 bg-gray-50/30">
        {renderContent()}
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
