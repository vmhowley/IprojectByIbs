import { Check, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { azulService } from '../services/azulService';
import { paymentService } from '../services/paymentService';

export function PricingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleUpgrade = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Try to initiate Stripe Checkout
            // TODO: Update this Price ID in Stripe to match the new $29/mo price point. 
            // Currently using the old ID 'price_1SmwmgDbw8IJYnAuDCxfAYNQ' which charges $29.
            const result = await paymentService.createCheckoutSession('price_1SmwmgDbw8IJYnAuDCxfAYNQ');

            // Check if we are in Mock Mode (no keys configured)
            if (typeof result === 'string' && result.includes('mock-url')) {
                await paymentService.mockUpgradeToPro(user.id);
                alert('¡Plan actualizado a PRO exitosamente! (Modo Simulación - Configura tus llaves para usar Stripe real)');
                navigate('/');
                window.location.reload();
            }
            // If result is undefined, Stripe JS has redirected the user.
        } catch (error: any) {
            console.error('Upgrade failed:', error);

            // Robust Fallback for Local Development


            alert('Error al actualizar el plan. Por favor contacta soporte.');
        } finally {
            setLoading(false);
        }
    };

    const isPro = user?.subscription_tier === 'pro';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Planes Simples y Transparentes
                </h2>
                <p className="mt-4 text-xl text-gray-500">
                    Comienza gratis y escala con tu equipo sin sorpresas.
                </p>
            </div>

            <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-2 lg:max-w-none">

                {/* FREE PLAN */}
                <div className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white hover:shadow-xl transition-shadow duration-300">
                    <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
                        <div>
                            <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-gray-100 text-gray-800">
                                Starter
                            </h3>
                        </div>
                        <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900">
                            $0
                            <span className="ml-1 text-2xl font-medium text-gray-500">/mes</span>
                        </div>
                        <p className="mt-5 text-lg text-gray-500">
                            Perfecto para freelancers y pequeños equipos que están comenzando.
                        </p>
                    </div>
                    <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 space-y-6 sm:p-10 sm:pt-6">
                        <ul className="space-y-4">
                            {[
                                'Hasta 3 Proyectos Activos',
                                'Hasta 3 Clientes',
                                'Hasta 3 Miembros de Equipo',
                                '100 MB de Almacenamiento',
                                'Tableros Kanban Básicos',
                                'Soporte Comunitario'
                            ].map((feature) => (
                                <li key={feature} className="flex items-start">
                                    <div className="shrink-0">
                                        <Check className="h-6 w-6 text-green-500" aria-hidden="true" />
                                    </div>
                                    <p className="ml-3 text-base text-gray-700">{feature}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="rounded-md shadow">
                            {isPro ? (
                                <button disabled className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 cursor-default">
                                    Tu plan actual es superior
                                </button>
                            ) : (
                                <button disabled className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-gray-700 bg-gray-200 cursor-default">
                                    Plan Actual
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* PRO PLAN */}
                <div className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white border-2 border-indigo-500 relative transform scale-105 z-10">
                    <div className="absolute top-0 right-0 -mr-1 -mt-1 w-32 h-32 overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-1 -mt-1 w-32 h-32 overflow-hidden">
                            {/* Ribbon */}
                        </div>
                    </div>
                    <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
                        <div className="flex justify-between items-center">
                            <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-indigo-100 text-indigo-600">
                                Business
                            </h3>
                            <span className="flex items-center text-sm font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                <Shield className="mr-1 h-5 w-5" /> Mejor Valor
                            </span>
                        </div>
                        <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900">
                            $29
                            <span className="ml-1 text-2xl font-medium text-gray-500">/mes</span>
                        </div>
                        <p className="mt-5 text-lg text-gray-500">
                            Potencia total para equipos en crecimiento sin límites de usuarios.
                        </p>
                    </div>
                    <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-indigo-50 space-y-6 sm:p-10 sm:pt-6">
                        <ul className="space-y-4">
                            {[
                                'Proyectos Ilimitados',
                                'Miembros de Equipo Ilimitados',
                                '100 GB de Almacenamiento',
                                'Análisis y Reportes Avanzados',
                                'Integraciones (Slack, GitHub)',
                                'Soporte Prioritario 24/7',
                                'Funciones de QA & Testing'
                            ].map((feature) => (
                                <li key={feature} className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <Check className="h-6 w-6 text-green-600" aria-hidden="true" />
                                    </div>
                                    <p className="ml-3 text-base text-gray-800 font-medium">{feature}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="rounded-md shadow">
                            {isPro ? (
                                <button disabled className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-500 cursor-default">
                                    <Zap className="mr-2 h-5 w-5" /> Plan Activo
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={handleUpgrade}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
                                    >
                                        {loading ? 'Procesando...' : 'Pagar con Tarjeta (Stripe)'}
                                    </button>

                                    <button
                                        onClick={async () => {
                                            if (!user) return;
                                            try {
                                                setLoading(true);
                                                // Generate a temp order ID
                                                const orderId = `ord_${user.id.slice(0, 8)}_${Date.now()}`;
                                                // Initiate Azul Payment ($29.00 USD)
                                                await azulService.initiatePayment(orderId, 29);
                                            } catch (err) {
                                                alert('Error iniciando pago con Azul');
                                                setLoading(false);
                                            }
                                        }}
                                        disabled={loading}
                                        className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 transition shadow hover:shadow-md"
                                    >
                                        Pagar con Azul
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-center text-gray-500 mt-2">
                            Cancela en cualquier momento. Sin contratos a largo plazo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
