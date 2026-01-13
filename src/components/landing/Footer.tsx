import Logo from '../../public/Logoibpulse.webp';

export function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <img src={Logo} alt="ibPulse" className="h-10 w-auto" />
                            <span className="font-bold text-xl text-gray-900">ibPulse</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed mb-6">
                            Simplificando la gestión de proyectos para equipos modernos que buscan excelencia y control.
                        </p>
                        <div className="flex gap-4">
                            {/* Social placeholders */}
                            <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"></div>
                            <div className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"></div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-6">Producto</h3>
                        <ul className="space-y-4 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Características</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Integraciones</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Roadmap</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Precios</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-6">Compañía</h3>
                        <ul className="space-y-4 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Sobre Nosotros</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Carreras</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Blog</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Contacto</a></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-6">Legal</h3>
                        <ul className="space-y-4 text-sm text-gray-600">
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Privacidad</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Términos</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Seguridad</a></li>
                            <li><a href="#" className="hover:text-indigo-600 transition-colors">Cookies</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        © {new Date().getFullYear()} IBS ibPulse. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <span className="hover:text-gray-900 cursor-pointer">Status</span>
                        <span className="hover:text-gray-900 cursor-pointer">API</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
