import { BarChart3, Calendar, Clock, Layout, MessageSquare, Users } from 'lucide-react';

const features = [
    {
        icon: <Layout className="w-6 h-6 text-white" />,
        color: "bg-indigo-500",
        title: "Gestión Centralizada",
        description: "Tableros Kanban, Listas y Vistas de detalle. Todo tu flujo de trabajo en una sola vista unificada."
    },
    {
        icon: <Users className="w-6 h-6 text-white" />,
        color: "bg-violet-500",
        title: "Portal de Clientes",
        description: "Dales a tus clientes acceso controlado para ver el progreso, comentar y aprobar entregables."
    },
    {
        icon: <Calendar className="w-6 h-6 text-white" />,
        color: "bg-pink-500",
        title: "Roadmap & Calendario",
        description: "Planifica a largo plazo con diagramas de Gantt y vistas de calendario sincronizadas."
    },
    {
        icon: <MessageSquare className="w-6 h-6 text-white" />,
        color: "bg-orange-500",
        title: "Comunicación Contextual",
        description: "Olvídate de los correos dispersos. Comenta directamente en las tareas y tickets."
    },
    {
        icon: <Clock className="w-6 h-6 text-white" />,
        color: "bg-teal-500",
        title: "Control de Tiempos",
        description: "Registra horas por tarea y proyecto para mantener la rentabilidad bajo control."
    },
    {
        icon: <BarChart3 className="w-6 h-6 text-white" />,
        color: "bg-blue-500",
        title: "Reportes Avanzados",
        description: "Analíticas en tiempo real sobre velocidad del equipo, cuellos de botella y cumplimiento."
    }
];

export function Features() {
    return (
        <div id="features" className="py-24 bg-white relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">Características Potentes</h2>
                    <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                        Todo lo que necesitas para escalar
                    </h3>
                    <p className="text-xl text-gray-600 leading-relaxed">
                        Hemos destilado las mejores prácticas de gestión de proyectos en una suite de herramientas intuitivas.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, idx) => (
                        <div key={idx} className="group p-8 rounded-3xl bg-gray-50 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300">
                            <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform duration-300`}>
                                {feature.icon}
                            </div>
                            <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                                {feature.title}
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
