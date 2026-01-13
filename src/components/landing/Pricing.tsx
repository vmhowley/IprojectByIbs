import { CheckCircle2 } from 'lucide-react';

export function Pricing() {
    return (
        <div id="pricing" className="py-24 bg-gray-900 text-white relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-indigo-400 font-semibold tracking-wide uppercase text-sm mb-3">Precios Simples</h2>
                    <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                        Comienza gratis, escala cuando quieras
                    </h3>
                    <p className="text-xl text-gray-400">
                        Sin tarjetas de crédito. Sin contratos a largo plazo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {/* Free Plan */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <h4 className="text-xl font-bold text-white mb-2">Starter</h4>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-white">$0</span>
                            <span className="text-gray-400">/mes</span>
                        </div>
                        <p className="text-gray-400 mb-8 text-sm">Para freelancers y proyectos personales.</p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                <CheckCircle2 size={18} className="text-indigo-400" /> 3 Proyectos
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                <CheckCircle2 size={18} className="text-indigo-400" /> 5 Clientes
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                <CheckCircle2 size={18} className="text-indigo-400" /> Tareas ilimitadas
                            </li>
                        </ul>
                        <button className="w-full py-3 px-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors">
                            Comenzar Gratis
                        </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="relative p-8 rounded-3xl bg-white/10 border border-indigo-500/50 backdrop-blur-md shadow-2xl shadow-indigo-500/20 transform scale-105">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            Más Popular
                        </div>
                        <h4 className="text-xl font-bold text-white mb-2">Pro</h4>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-white">$29</span>
                            <span className="text-gray-400">/mes</span>
                        </div>
                        <p className="text-gray-400 mb-8 text-sm">Para equipos en crecimiento.</p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-white">
                                <CheckCircle2 size={18} className="text-indigo-400" /> Proyectos Ilimitados
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white">
                                <CheckCircle2 size={18} className="text-indigo-400" /> Clientes Ilimitados
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white">
                                <CheckCircle2 size={18} className="text-indigo-400" /> Roadmap & Calendario
                            </li>
                            <li className="flex items-center gap-3 text-sm text-white">
                                <CheckCircle2 size={18} className="text-indigo-400" /> Soporte Prioritario
                            </li>
                        </ul>
                        <button className="w-full py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30">
                            Prueba Gratuita
                        </button>
                    </div>

                    {/* Enterprise Plan */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                        <h4 className="text-xl font-bold text-white mb-2">Enterprise</h4>
                        <div className="flex items-baseline gap-1 mb-6">
                            <span className="text-4xl font-bold text-white">Custom</span>
                        </div>
                        <p className="text-gray-400 mb-8 text-sm">Para grandes organizaciones.</p>
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                <CheckCircle2 size={18} className="text-indigo-400" /> Todo lo de Pro
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                <CheckCircle2 size={18} className="text-indigo-400" /> SSO & SAML
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-300">
                                <CheckCircle2 size={18} className="text-indigo-400" /> Manager de Cuenta
                            </li>
                        </ul>
                        <button className="w-full py-3 px-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors">
                            Contactar Ventas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
