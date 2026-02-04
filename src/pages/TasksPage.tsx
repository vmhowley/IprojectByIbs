
import { ChevronDown, ChevronRight, Folder, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TaskList } from '../components/task/TaskList';
import { Task } from '../lib/supabase';
import { supabase } from '../services/api';
import { ticketService } from '../services/ticketService';

// Extended Task type to include grouping info
interface ExtendedTask extends Task {
    clientName: string;
    projectName: string;
    assignedToName?: string;
}

interface GroupedByProject {
    projectName: string;
    projectAssigneeId?: string;
    projectAssigneeName?: string;
    tasks: ExtendedTask[];
}

interface GroupedByClient {
    clientName: string;
    projects: { [projectId: string]: GroupedByProject };
}

export function TasksPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [groupedTasks, setGroupedTasks] = useState<{ [clientId: string]: GroupedByClient }>({});
    const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const tickets = await ticketService.getAll();

            const groups: { [clientId: string]: GroupedByClient } = {};
            const allClientIds = new Set<string>();
            const allProjectIds = new Set<string>();
            const userIdsToFetch = new Set<string>();

            // First pass: Build structure and collect User IDs
            tickets.forEach(t => {
                const clientName = t.clients?.name || 'Cliente Sin Asignar';
                const clientId = t.client_id || 'unknown_client';
                const projectName = t.projects?.name || 'Proyecto Sin Asignar';
                const projectId = t.project_id || 'unknown_project';

                // Collect IDs
                if (t.assigned_to) userIdsToFetch.add(t.assigned_to);
                if (t.projects?.assignee) userIdsToFetch.add(t.projects.assignee);

                // Map Ticket to Task
                const task: ExtendedTask = {
                    id: t.id,
                    project_id: t.project_id,
                    task_number: t.ticket_number?.toString() || '0',
                    title: t.subject || 'Sin Asunto',
                    description: t.description,
                    status: t.status as any,
                    urgency: t.urgency as any,
                    category: t.request_type || null,
                    request_type: t.request_type || null,
                    department: t.department,
                    assigned_to: t.assigned_to,
                    date_added: t.date_added,
                    deadline: t.deadline,
                    tags: t.tags || [],
                    comment_count: t.comment_count,
                    created_at: t.created_at,
                    updated_at: t.updated_at,
                    clientName,
                    projectName
                };

                if (!groups[clientId]) {
                    groups[clientId] = {
                        clientName,
                        projects: {}
                    };
                    allClientIds.add(clientId);
                }

                if (!groups[clientId].projects[projectId]) {
                    groups[clientId].projects[projectId] = {
                        projectName,
                        projectAssigneeId: t.projects?.assignee,
                        tasks: []
                    };
                    allProjectIds.add(projectId);
                }

                groups[clientId].projects[projectId].tasks.push(task);
            });

            // Fetch profiles
            const { data: profiles } = await supabase
                .from('user_profiles')
                .select('id, name')
                .in('id', Array.from(userIdsToFetch));

            const profileMap = (profiles || []).reduce((acc, p) => ({
                ...acc,
                [p.id]: p.name
            }), {} as Record<string, string>);

            // Second pass: Enrich with names
            Object.values(groups).forEach(clientGroup => {
                Object.values(clientGroup.projects).forEach(projectGroup => {
                    if (projectGroup.projectAssigneeId && profileMap[projectGroup.projectAssigneeId]) {
                        projectGroup.projectAssigneeName = profileMap[projectGroup.projectAssigneeId];
                    }

                    projectGroup.tasks.forEach(task => {
                        if (task.assigned_to && profileMap[task.assigned_to]) {
                            task.assignedToName = profileMap[task.assigned_to];
                        }
                    });
                });
            });

            setGroupedTasks(groups);
            // Auto expand all by default
            setExpandedClients(allClientIds);
            setExpandedProjects(allProjectIds);

        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
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

    const toggleProject = (projectId: string) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId)) {
                next.delete(projectId);
            } else {
                next.add(projectId);
            }
            return next;
        });
    };

    const handleTaskSelect = (taskId: string) => {
        navigate(`/ticket/${taskId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    const sortedClientIds = Object.keys(groupedTasks).sort((a, b) =>
        groupedTasks[a].clientName.localeCompare(groupedTasks[b].clientName)
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Tareas</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Vista global de tareas organizadas por Cliente y Proyecto.
                    </p>
                </div>
            </div>

            <div className="space-y-6">
                {sortedClientIds.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white rounded-lg border border-gray-200">
                        No hay tareas encontradas.
                    </div>
                ) : (
                    sortedClientIds.map(clientId => {
                        const clientGroup = groupedTasks[clientId];
                        console.log(clientGroup);
                        const isClientExpanded = expandedClients.has(clientId);
                        const sortedProjectIds = Object.keys(clientGroup.projects).sort((a, b) =>
                            clientGroup.projects[a].projectName.localeCompare(clientGroup.projects[b].projectName)
                        );

                        return (
                            <div key={clientId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {/* Client Header */}
                                <div
                                    className="flex items-center gap-2 px-4 py-3 bg-indigo-50/50 cursor-pointer hover:bg-indigo-50 transition-colors border-b border-gray-100"
                                    onClick={() => toggleClient(clientId)}
                                >
                                    <button className="text-gray-400 hover:text-indigo-600">
                                        {isClientExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </button>
                                    <Users className="w-5 h-5 text-indigo-600" />
                                    <h2 className="text-lg font-semibold text-gray-900">{clientGroup.clientName}</h2>
                                    <span className="text-sm text-gray-500 ml-auto bg-white px-2 py-0.5 rounded-full border border-gray-200">
                                        {Object.values(clientGroup.projects).reduce((acc, p) => acc + p.tasks.length, 0)} {Object.values(clientGroup.projects).reduce((acc, p) => acc + p.tasks.length, 0) === 1 ? 'tarea' : 'tareas'}
                                    </span>
                                </div>

                                {isClientExpanded && (
                                    <div className="p-4 space-y-4 bg-gray-50/30">
                                        {sortedProjectIds.map(projectId => {
                                            const projectGroup = clientGroup.projects[projectId];
                                            const isProjectExpanded = expandedProjects.has(projectId);

                                            return (
                                                <div key={projectId} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
                                                    {/* Project Header */}
                                                    <div
                                                        className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                                                        onClick={() => toggleProject(projectId)}
                                                    >
                                                        <button className="text-gray-400 hover:text-gray-600">
                                                            {isProjectExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                        </button>
                                                        <Folder className="w-4 h-4 text-gray-500" />
                                                        <h3 className="text-md font-medium text-gray-800">{projectGroup.projectName}</h3>
                                                        <span className="text-xs text-gray-400 ml-auto">
                                                            {projectGroup.projectAssigneeName ? (
                                                                <span className="flex items-center gap-1">
                                                                    <span className="text-gray-500">Asignado a:</span>
                                                                    <span className="font-medium text-gray-700">{projectGroup.projectAssigneeName}</span>
                                                                </span>
                                                            ) : (
                                                                <span>{projectGroup.tasks.length} {projectGroup.tasks.length === 1 ? 'tarea' : 'tareas'}</span>
                                                            )}
                                                        </span>
                                                    </div>

                                                    {isProjectExpanded && (
                                                        <div className="p-0">
                                                            <TaskList
                                                                tasks={projectGroup.tasks}
                                                                selectedTaskId={null}
                                                                onTaskSelect={handleTaskSelect}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
