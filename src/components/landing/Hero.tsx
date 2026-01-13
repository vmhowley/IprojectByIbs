import { ArrowRight, ChevronRight, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Hero() {
    return (
        <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob"></div>
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-2000"></div>
                <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl mix-blend-multiply animate-blob animation-delay-4000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-medium mb-8 animate-fade-in-up">
                    <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
                    Nuevo: Gestión de Roadmap 2.0
                    <ChevronRight size={14} />
                </div>

                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight mb-8 leading-tight animate-fade-in-up animation-delay-100">
                    Gestiona proyectos con <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                        precisión quirúrgica
                    </span>
                </h1>

                <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
                    La plataforma todo-en-uno para agencias y equipos de desarrollo.
                    Centraliza tareas, colabora con clientes y entrega a tiempo, siempre.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up animation-delay-300">
                    <Link
                        to="/register"
                        className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-2xl overflow-hidden transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-1"
                    >
                        Comenzar Gratis
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <Link
                        to="/demo"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold text-gray-700 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md hover:-translate-y-1"
                    >
                        <Play size={20} className="fill-gray-700" />
                        Ver Demo en vivo
                    </Link>
                </div>

                {/* Dashboard Preview Mockup */}
                <div className="mt-20 relative mx-auto max-w-5xl rounded-2xl border border-gray-200/50 bg-gray-50/50 p-2 backdrop-blur-sm shadow-2xl animate-fade-in-up animation-delay-500">
                    <div className="rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm aspect-[16/9] flex items-center justify-center text-gray-400 bg-gradient-to-br from-gray-50 to-white">
                        {/* Placeholder for actual screenshot */}
                        <div className="text-center">
                            <p className="font-medium">Vista Dashboard Interactiva</p>
                            <p className="text-sm opacity-60">Gráficos, Roadmap y Tareas</p>
                        </div>
                    </div>
                    {/* Decorative blurs */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-3xl blur opacity-20 -z-10"></div>
                </div>
            </div>
        </div>
    );
}
