import { ArrowRight, BarChart2, CheckCircle, Globe, Layout, Shield, Users, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                IBS
                            </div>
                            <span className="font-bold text-xl text-gray-900">Project Tracker</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                                Iniciar Sesión
                            </Link>
                            <Link
                                to="/register"
                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
                            >
                                Registrarse
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden pt-16 pb-24 lg:pt-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight mb-8">
                            Gestiona tus proyectos con <span className="text-indigo-600">elegancia y control</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            La plataforma definitiva para equipos que buscan excelencia. Organiza tareas, colabora con clientes y entrega resultados a tiempo, todo en un solo lugar.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            >
                                Comenzar Gratis
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                to="/demo"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-all"
                            >
                                Ver Demo
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Background decoration */}
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -z-10 w-full h-full">
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-indigo-50 to-purple-50 blur-3xl opacity-60 rounded-full transform translate-x-1/3 -translate-y-1/4"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-blue-50 to-teal-50 blur-3xl opacity-60 rounded-full transform -translate-x-1/3 translate-y-1/4"></div>
                </div>
            </div>

            {/* Features Grid */}
            <div className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">Todo lo que necesitas para triunfar</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Herramientas potentes diseñadas para simplificar tu flujo de trabajo y potenciar la productividad de tu equipo.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Layout className="w-6 h-6 text-indigo-600" />}
                            title="Gestión Intuitiva"
                            description="Interfaz limpia y moderna que te permite visualizar el estado de todos tus proyectos de un vistazo."
                        />
                        <FeatureCard
                            icon={<Users className="w-6 h-6 text-purple-600" />}
                            title="Colaboración en Tiempo Real"
                            description="Mantén a tu equipo y clientes sincronizados. Comentarios, actualizaciones y notificaciones al instante."
                        />
                        <FeatureCard
                            icon={<BarChart2 className="w-6 h-6 text-blue-600" />}
                            title="Reportes Detallados"
                            description="Analíticas profundas para entender el rendimiento de tu equipo y el progreso de cada iniciativa."
                        />
                        <FeatureCard
                            icon={<Shield className="w-6 h-6 text-green-600" />}
                            title="Seguridad Avanzada"
                            description="Tus datos están protegidos con los más altos estándares de seguridad y control de acceso granular."
                        />
                        <FeatureCard
                            icon={<Globe className="w-6 h-6 text-teal-600" />}
                            title="Acceso Global"
                            description="Accede a tu espacio de trabajo desde cualquier lugar y dispositivo. Tu oficina va contigo."
                        />
                        <FeatureCard
                            icon={<Zap className="w-6 h-6 text-yellow-600" />}
                            title="Automatización Inteligente"
                            description="Deja que el sistema se encargue de las tareas repetitivas para que tú te enfoques en lo importante."
                        />
                    </div>
                </div>
            </div>

            {/* Social Proof / Trust */}
            <div className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-indigo-900 rounded-3xl p-8 md:p-16 text-center text-white overflow-hidden relative">
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Únete a equipos de alto rendimiento</h2>
                            <p className="text-indigo-200 text-lg mb-8 max-w-2xl mx-auto">
                                Descubre por qué las empresas líderes eligen IBS Project Tracker para gestionar sus iniciativas más críticas.
                            </p>
                            <div className="flex flex-wrap justify-center gap-8 text-indigo-300 font-semibold">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span>Soporte 24/7</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span>99.9% Uptime</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <span>Actualizaciones Semanales</span>
                                </div>
                            </div>
                        </div>

                        {/* Decorative circles */}
                        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 -translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 translate-x-1/2 translate-y-1/2"></div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                    IBS
                                </div>
                                <span className="font-bold text-xl text-gray-900">Project Tracker</span>
                            </div>
                            <p className="text-gray-500 text-sm">
                                Simplificando la gestión de proyectos para equipos modernos.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Producto</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Características</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Precios</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Integraciones</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Changelog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Compañía</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Sobre Nosotros</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Carreras</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Contacto</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacidad</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Términos</a></li>
                                <li><a href="#" className="hover:text-indigo-600 transition-colors">Seguridad</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-500">
                            © {new Date().getFullYear()} IBS Project Tracker. Todos los derechos reservados.
                        </p>
                        <div className="flex gap-6">
                            {/* Social icons could go here */}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
            <p className="text-gray-600 leading-relaxed">
                {description}
            </p>
        </div>
    );
}
