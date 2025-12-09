import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function PricingPage() {
    const navigate = useNavigate();

    const plans = [
        {
            name: 'Gratis',
            price: '$0',
            description: 'Perfecto para empezar',
            features: [
                'Hasta 2 proyectos',
                'Gestión básica de tareas',
                'Sin acceso a chat',
                'Sin gestión de clientes',
            ],
            cta: 'Plan Actual',
            current: true,
        },
        {
            name: 'Pro',
            price: '$29',
            interval: '/mes',
            description: 'Para profesionales y equipos',
            features: [
                'Proyectos ilimitados',
                'Chat en tiempo real',
                'Gestión completa de clientes',
                'Soporte prioritario',
                'Análisis avanzados',
            ],
            cta: 'Actualizar a Pro',
            highlight: true,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
            <div className="max-w-3xl w-full text-center mb-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Planes y Precios</h1>
                <p className="text-xl text-gray-600">
                    Elige el plan que mejor se adapte a tus necesidades.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl w-full">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`bg-white rounded-2xl shadow-xl overflow-hidden border-2 ${plan.highlight ? 'border-indigo-600' : 'border-transparent'
                            }`}
                    >
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                            <div className="mt-4 flex items-baseline">
                                <span className="text-4xl font-extrabold text-gray-900">
                                    {plan.price}
                                </span>
                                {plan.interval && (
                                    <span className="text-gray-500 ml-1">{plan.interval}</span>
                                )}
                            </div>
                            <p className="mt-4 text-gray-500">{plan.description}</p>

                            <ul className="mt-8 space-y-4">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-center">
                                        <div className="flex-shrink-0">
                                            <Check className="h-6 w-6 text-green-500" />
                                        </div>
                                        <p className="ml-3 text-base text-gray-700">{feature}</p>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8">
                                <Button
                                    className={`w-full py-3 px-6 rounded-lg text-lg font-medium transition-colors ${plan.highlight
                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                        }`}
                                    onClick={() => {
                                        if (plan.highlight) {
                                            // Here we would integrate Stripe
                                            alert('Integración de pagos próximamente...');
                                        } else {
                                            navigate('/dashboard');
                                        }
                                    }}
                                >
                                    {plan.cta}
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                    Volver al Dashboard
                </Button>
            </div>
        </div>
    );
}
