import { Check, Shield, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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
            const result = await paymentService.createCheckoutSession('price_1SehAPLncVlung4TsUbrx2yg'); // Use real Price ID when available

            // Check if we are in Mock Mode (no keys configured)
            if (typeof result === 'string' && result.includes('mock-url')) {
                await paymentService.mockUpgradeToPro(user.id);
                alert('¡Plan actualizado a PRO exitosamente! (Modo Simulación - Configura tus llaves para usar Stripe real)');
                navigate('/');
                window.location.reload();
            }
            // If result is undefined, Stripe JS has redirected the user.
        } catch (error) {
            console.error('Upgrade failed:', error);
            alert('Error al actualizar el plan');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { name: 'Proyectos Ilimitados', included: true },
        { name: 'Soporte Prioritario', included: true },
        { name: 'Análisis Avanzado', included: true },
        { name: 'Miembros de Equipo Ilimitados', included: true },
        { name: 'Funciones QA (Calidad)', included: true },
    ];

    const isPro = user?.subscription_tier === 'pro';

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                    Planes y Precios
                </h2>
                <p className="mt-4 text-xl text-gray-500">
                    Elige el plan que mejor se adapte a tu equipo.
                </p>
            </div>

            <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-2 lg:max-w-none">

                {/* FREE PLAN */}
                <div className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white">
                    <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
                        <div>
                            <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-gray-100 text-gray-800">
                                Gratis
                            </h3>
                        </div>
                        <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900">
                            $0
                            <span className="ml-1 text-2xl font-medium text-gray-500">/mes</span>
                        </div>
                        <p className="mt-5 text-lg text-gray-500">
                            Ideal para individuos y pequeños proyectos.
                        </p>
                    </div>
                    <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 space-y-6 sm:p-10 sm:pt-6">
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <div className="flex-shrink-0">
                                    <Check className="h-6 w-6 text-green-500" aria-hidden="true" />
                                </div>
                                <p className="ml-3 text-base text-gray-700">Hasta 3 Proyectos</p>
                            </li>
                            <li className="flex items-start">
                                <div className="flex-shrink-0">
                                    <Check className="h-6 w-6 text-green-500" aria-hidden="true" />
                                </div>
                                <p className="ml-3 text-base text-gray-700">Gestión de Tareas Básica</p>
                            </li>
                        </ul>
                        <div className="rounded-md shadow">
                            {isPro ? (
                                <button disabled className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50 cursor-default">
                                    Plan actual (Pro es mejor)
                                </button>
                            ) : (
                                <button disabled className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gray-400 cursor-default">
                                    Plan Actual
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* PRO PLAN */}
                <div className="flex flex-col rounded-lg shadow-lg overflow-hidden bg-white border-2 border-indigo-500 relative">
                    <div className="absolute top-0 right-0 -mr-1 -mt-1 w-32 h-32 overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-1 -mt-1 w-32 h-32 overflow-hidden">
                            {/* Ribbon could go here */}
                        </div>
                    </div>
                    <div className="px-6 py-8 bg-white sm:p-10 sm:pb-6">
                        <div className="flex justify-between items-center">
                            <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-indigo-100 text-indigo-600">
                                PRO
                            </h3>
                            <span className="flex items-center text-sm font-medium text-indigo-600">
                                <Shield className="mr-1 h-5 w-5" /> Recomendado
                            </span>
                        </div>
                        <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900">
                            $15
                            <span className="ml-1 text-2xl font-medium text-gray-500">/mes</span>
                        </div>
                        <p className="mt-5 text-lg text-gray-500">
                            Para equipos que necesitan crecer sin límites.
                        </p>
                    </div>
                    <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 space-y-6 sm:p-10 sm:pt-6">
                        <ul className="space-y-4">
                            {features.map((feature) => (
                                <li key={feature.name} className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <Check className="h-6 w-6 text-green-500" aria-hidden="true" />
                                    </div>
                                    <p className="ml-3 text-base text-gray-700">{feature.name}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="rounded-md shadow">
                            {isPro ? (
                                <button disabled className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-500 cursor-default">
                                    <Zap className="mr-2 h-5 w-5" /> Tu Plan Actual
                                </button>
                            ) : (
                                <button
                                    onClick={handleUpgrade}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
                                >
                                    {loading ? 'Procesando...' : 'Mejorar a PRO'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
