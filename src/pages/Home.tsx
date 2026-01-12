import { CheckCircle, FolderKanban, FolderPlus, Lock, Plus, Ticket as TicketIcon, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/dashboard/StatCard';
import { TicketsByClientChart } from '../components/dashboard/TicketsByClientChart';
import { TicketsByStatusChart } from '../components/dashboard/TicketsByStatusChart';
import { NewProjectModal } from '../components/project/NewProjectModal';
import { ProjectCard } from '../components/project/ProjectCard';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import NProgress from '../lib/nprogress';
import { projectService } from '../services/projectService';
import { ticketService } from '../services/ticketService';
import { Project, Ticket } from '../types';


export function Home() {
  const { user } = useAuth();
  const { limits } = useSubscription();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectStats, setProjectStats] = useState<Record<string, { total: number; completed: number }>>({});
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      NProgress.start();
      setLoading(true);
      // Load projects first
      const projectsData = await projectService.getAll();
      setProjects(projectsData);

      // If no projects, stop loading
      if (projectsData.length === 0) {
        setLoading(false);
        return;
      }

      // Load tickets for all projects in parallel
      const stats: Record<string, { total: number; completed: number }> = {};
      const allTicketsList: Ticket[] = [];

      // Use Promise.all to fetch tickets in parallel
      const ticketsPromises = projectsData.map(async (project) => {
        try {
          const projectTickets = await ticketService.getByProject(project.id);
          return { projectId: project.id, tickets: projectTickets };
        } catch (err) {
          console.warn(`Failed to load tickets for project ${project.id}`, err);
          return { projectId: project.id, tickets: [] };
        }
      });

      const results = await Promise.all(ticketsPromises);

      results.forEach(({ projectId, tickets }) => {
        allTicketsList.push(...tickets);
        stats[projectId] = {
          total: tickets.length,
          completed: tickets.filter((t) => t.status === 'completed' || t.status === 'done').length,
        };
      });

      setProjectStats(stats);
      setAllTickets(allTicketsList);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };


  const handleCreateProject = async (projectData: { name: string; description: string }) => {
    try {
      const data = await projectService.create(projectData);
      setProjects([data, ...projects]);
      setProjectStats({ ...projectStats, [data.id]: { total: 0, completed: 0 } });
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const statusStats = {
    pending_analysis: allTickets.filter(t => t.status === 'pending_analysis').length,
    pending_approval: allTickets.filter(t => t.status === 'pending_approval').length,
    approved: allTickets.filter(t => t.status === 'approved').length,
    completed: allTickets.filter(t => t.status === 'completed').length,
    done: allTickets.filter(t => t.status === 'done').length,
  };

  const clientStatsMap = allTickets.reduce((acc, ticket) => {
    if (ticket.client_id) {
      acc[ticket.client_id] = (acc[ticket.client_id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const clientStats = Object.entries(clientStatsMap).map(([name, count]) => ({ name, count }));

  const uniqueClients = new Set(projects.map(t => t.client_id).filter(Boolean)).size;
  const completedCount = statusStats.done + statusStats.completed;

  if (loading) {
    return null;
  }


  return (
    <div className="flex-1 overflow-y-auto ">
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Resumen general de proyectos y solicitudes</p>
          </div>
          {user?.role !== 'guest' && (
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={18} />
              Nuevo Proyecto
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Proyectos"
            value={projects.length}
            icon={FolderKanban}
            color="blue"
            subtitle={`${projects.filter(p => p.status === 'active').length} activos`}
          />
          <StatCard
            title="Total Solicitudes"
            value={allTickets.length}
            icon={TicketIcon}
            color="purple"
            subtitle={`${completedCount} completadas`}
          />
          <StatCard
            title="Clientes"
            value={uniqueClients}
            icon={Users}
            color="green"
            subtitle="Clientes únicos"
          />
          <StatCard
            title="En Progreso"
            value={statusStats.in_progress}
            icon={CheckCircle}
            color="yellow"
            subtitle="Solicitudes activas"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 relative">
          {!limits.hasAdvancedAnalytics && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200">
              <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-100 max-w-sm">
                <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Análisis Avanzados</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Obtén insights detallados sobre el rendimiento de tus proyectos con el plan Pro.
                </p>
                <button onClick={() => navigate('/pricing')} className="w-full">
                  Actualizar ahora
                </button>
              </div>
            </div>
          )}
          <div className={!limits.hasAdvancedAnalytics ? 'filter blur-sm select-none pointer-events-none' : ''}>
            <TicketsByStatusChart stats={statusStats} />
          </div>
          <div className={!limits.hasAdvancedAnalytics ? 'filter blur-sm select-none pointer-events-none' : ''}>
            <TicketsByClientChart stats={clientStats} />
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Proyectos Recientes</h2>
        </div>

        {projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                taskCount={projectStats[project.id]?.total || 0}
                completedTaskCount={projectStats[project.id]?.completed || 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-lg border border-gray-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <FolderPlus size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
            <p className="text-gray-600 mb-6">Comienza creando tu primer proyecto</p>
            {user?.role !== 'guest' && (
              <button
                onClick={() => setIsNewProjectModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                Crear Proyecto
              </button>
            )}
          </div>
        )}
      </div>

      {isNewProjectModalOpen && (
        <NewProjectModal
          onClose={() => setIsNewProjectModalOpen(false)}
          onSubmit={handleCreateProject}
        />
      )}
    </div>
  );
}
