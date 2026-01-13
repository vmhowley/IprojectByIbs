import { Book, ChevronRight, FileText, Layout, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface GuideSection {
    id: string;
    title: string;
    icon: React.ElementType;
    content: React.ReactNode;
}

export function DocumentationPage() {
    const [activeSection, setActiveSection] = useState<string>('intro');

    const sections: GuideSection[] = [
        {
            id: 'intro',
            title: 'Introducción',
            icon: Book,
            content: (
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold text-gray-900">Documentación de iBPulse</h1>
                    <p className="text-lg text-gray-600">
                        Bienvenido a la guía oficial de usuario. Aquí encontrarás todo lo que necesitas saber para gestionar tus proyectos, tareas y equipos de manera eficiente.
                    </p>
                    <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded-r-lg">
                        <p className="text-indigo-900">
                            <strong>Tip Pro:</strong> Usa el menú lateral para navegar rápidamente entre los diferentes temas.
                        </p>
                    </div>
                </div>
            )
        },
        {
            id: 'projects',
            title: 'Proyectos',
            icon: Layout,
            content: (
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Proyectos</h2>

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800">Crear un Nuevo Proyecto</h3>
                        <p className="text-gray-600">
                            Para crear un proyecto, ve a la sección "Proyectos" y haz clic en el botón "+ Crear Proyecto".
                        </p>
                        <ul className="list-disc ml-6 space-y-2 text-gray-600">
                            <li><strong>Nombre:</strong> El nombre visible del proyecto.</li>
                            <li><strong>Cliente:</strong> Selecciona el cliente asociado (opcional).</li>
                            <li><strong>N° Caso de Uso:</strong> (Opcional) Identificador externo para seguimiento.</li>
                            <li><strong>Fechas:</strong> Define el inicio y fin para el cronograma.</li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800">Estados del Proyecto</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="border p-4 rounded-lg">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase">En Progreso</span>
                                <p className="text-sm mt-2 text-gray-600">Trabajo activo en desarrollo.</p>
                            </div>
                            <div className="border p-4 rounded-lg">
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold uppercase">Completado</span>
                                <p className="text-sm mt-2 text-gray-600">Todos los entregables finalizados.</p>
                            </div>
                            <div className="border p-4 rounded-lg">
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold uppercase">En Pausa</span>
                                <p className="text-sm mt-2 text-gray-600">Detenido temporalmente.</p>
                            </div>
                            <div className="border p-4 rounded-lg">
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold uppercase">Cancelado</span>
                                <p className="text-sm mt-2 text-gray-600">Proyecto desestimado.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'tasks',
            title: 'Tareas y Tickets',
            icon: FileText,
            content: (
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-gray-900">Tareas y Tickets</h2>
                    <p className="text-gray-600">
                        Las tareas son la unidad base de trabajo. Puedes visualizarlas en formato Lista o Tablero Kanban.
                    </p>

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800">El Tablero Kanban</h3>
                        <p className="text-gray-600">
                            Arrastra y suelta las tareas entre columnas para actualizar su estado.
                        </p>
                        <ul className="list-disc ml-6 space-y-2 text-gray-600">
                            <li><strong>Backlog:</strong> Tareas pendientes por iniciar.</li>
                            <li><strong>En Progreso:</strong> Tareas en las que se está trabajando activamente.</li>
                            <li><strong>En Revisión:</strong> Tareas terminadas esperando validación.</li>
                            <li><strong>Hecho:</strong> Tareas completadas y aprobadas.</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'clients',
            title: 'Clientes',
            icon: Users,
            content: (
                <div className="space-y-8">
                    <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
                    <p className="text-gray-600">
                        Administra tu base de datos de clientes para asociar proyectos y contactos.
                        Ve a la sección "Clientes" en el menú lateral.
                    </p>
                </div>
            )
        }
    ];

    return (
        <div className="flex bg-gray-50 h-screen overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
                <div className="p-6">
                    <Link to="/help" className="text-sm text-gray-500 hover:text-indigo-600 flex items-center mb-6 transition-colors">
                        ← Volver a Ayuda
                    </Link>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                        Guías
                    </h3>
                    <nav className="space-y-1">
                        {sections.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeSection === section.id
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <section.icon className={`mr-3 h-5 w-5 ${activeSection === section.id ? 'text-indigo-500' : 'text-gray-400'
                                        }`} />
                                    {section.title}
                                </div>
                                {activeSection === section.id && (
                                    <ChevronRight className="h-4 w-4 text-indigo-500" />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-8 sm:p-12 min-h-[500px]">
                    {sections.find(s => s.id === activeSection)?.content}
                </div>
            </div>
        </div>
    );
}
