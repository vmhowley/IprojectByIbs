import { Link } from 'react-router-dom';
import Logo from '../../public/Logoibpulse.webp';

export function Navbar() {
    return (
        <nav className="fixed w-full z-50 transition-all duration-300 bg-white/30  backdrop-blur-md border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    <div className="flex items-center gap-2">
                        <img src={Logo} alt="ibPulse" className="w-60 h-20  object-center object-cover" />
                        <span className="font-bold text-2xl text-gray-900 tracking-tight"></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">Características</a>
                        <a href="#trust" className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">Clientes</a>
                        <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">Precios</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            Iniciar Sesión
                        </Link>
                        <Link
                            to="/register"
                            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-gray-900/20 hover:-translate-y-0.5"
                        >
                            Comenzar Gratis
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
