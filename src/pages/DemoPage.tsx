import { AlertCircle, CheckCircle, FolderKanban, Ticket as TicketIcon, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StatCard } from '../components/dashboard/StatCard';
import { TicketsByClientChart } from '../components/dashboard/TicketsByClientChart';
import { TicketsByStatusChart } from '../components/dashboard/TicketsByStatusChart';
import { ProjectCard } from '../components/project/ProjectCard';
import { Project } from '../types';

export function DemoPage() {
    // Mock Data
    const mockProjects: Project[] = [
        {
            id: '1',
            name: 'Rediseño E-commerce',
            description: 'Actualización completa de la plataforma de ventas online.',
            status: 'active',
            client_id: 'client1',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'user1',
            priority: 'high'
        },
        {
            id: '2',
            name: 'App Móvil iOS',
            description: 'Desarrollo de aplicación nativa para gestión de inventario.',
            status: 'active',
            client_id: 'client2',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'user1',
            priority: 'medium'
        },
        {
            id: '3',
            name: 'Migración a Nube',
            description: 'Migración de infraestructura legacy a AWS.',
            status: 'completed',
            client_id: 'client3',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'user1',
            priority: 'low'
        }
    ];

    const mockStats = {
        projects: {
            total: 12,
            active: 8
        },
        tickets: {
            total: 45,
            completed: 28
        },
        clients: {
            total: 5
        },
        inProgress: {
            total: 12
        }
    };

    const mockStatusStats = {
        pending_analysis: 5,
        pending_approval: 3,
        approved: 7,
        completed: 20,
        done: 8,
        in_progress: 12 // Adding this to match the expected type if needed, though TicketsByStatusChart might not use it directly depending on implementation
    };

    const mockClientStats = [
        { name: 'TechCorp', count: 15 },
        { name: 'InnovateInc', count: 12 },
        { name: 'GlobalSolutions', count: 8 },
        { name: 'StartUpX', count: 6 },
        { name: 'LocalBiz', count: 4 }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Demo Banner */}
            <div className="bg-indigo-600 text-white px-4 py-3 shadow-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Modo Demostración</span>
                        <span className="hidden sm:inline text-indigo-200 text-sm">- Estás viendo datos de ejemplo.</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/register" className="text-sm bg-white text-indigo-600 px-3 py-1.5 rounded-md font-semibold hover:bg-indigo-50 transition-colors">
                            Crear Cuenta Real
                        </Link>
                        <Link to="/" className="text-sm text-indigo-100 hover:text-white">
                            Salir
                        </Link>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-7xl mx-auto p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-600 mt-1">Resumen general de proyectos y solicitudes</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="Total Proyectos"
                            value={mockStats.projects.total}
                            icon={FolderKanban}
                            color="blue"
                            subtitle={`${mockStats.projects.active} activos`}
                        />
                        <StatCard
                            title="Total Solicitudes"
                            value={mockStats.tickets.total}
                            icon={TicketIcon}
                            color="purple"
                            subtitle={`${mockStats.tickets.completed} completadas`}
                        />
                        <StatCard
                            title="Clientes"
                            value={mockStats.clients.total}
                            icon={Users}
                            color="green"
                            subtitle="Clientes únicos"
                        />
                        <StatCard
                            title="En Progreso"
                            value={mockStats.inProgress.total}
                            icon={CheckCircle}
                            color="yellow"
                            subtitle="Solicitudes activas"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <TicketsByStatusChart stats={mockStatusStats} />
                        <TicketsByClientChart stats={mockClientStats} />
                    </div>

                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Proyectos Recientes</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockProjects.map((project) => (
                            <div key={project.id} className="relative group">
                                {/* Overlay to indicate non-interactive in demo */}
                                <div className="absolute inset-0 z-10 bg-white/0 group-hover:bg-white/10 transition-colors cursor-default" title="Solo lectura en modo demo" />
                                <ProjectCard
                                    project={project}
                                    taskCount={15}
                                    completedTaskCount={8}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
