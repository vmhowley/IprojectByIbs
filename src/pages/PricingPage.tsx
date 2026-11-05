import { ArrowLeft, Check, CreditCard } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { PLANS } from '../components/landing/plans';
import { Button } from '../components/ui/Button';
import { Logo } from '../components/ui/Logo';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import { azulService } from '../services/azulService';
import { paymentService } from '../services/paymentService';

/** The plans and, for a signed-in free account, the way to pay for Pro. */
export function PricingPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState<'stripe' | 'azul' | null>(null);

    const handleUpgrade = async () => {
        if (!user) return;
        setLoading('stripe');
        try {
            // Try to initiate Stripe Checkout
            // TODO: Update this Price ID in Stripe to match the new $29/mo price point.
            // Currently using the old ID 'price_1SmwmgDbw8IJYnAuDCxfAYNQ' which charges $29.
            // On success the browser is redirected to Stripe Checkout.
            await paymentService.createCheckoutSession('price_1SmwmgDbw8IJYnAuDCxfAYNQ');
        } catch (error) {
            console.error('Upgrade failed:', error);

            // Robust Fallback for Local Development

            toast.error('No se pudo iniciar el pago. Escríbenos a support@ibsystems.srl.');
        } finally {
            setLoading(null);
        }
    };

    const handleAzul = async () => {
        if (!user) return;
        try {
            setLoading('azul');
            // Generate a temp order ID
            const orderId = `ord_${user.id.slice(0, 8)}_${Date.now()}`;
            // Initiate Azul Payment ($29.00 USD)
            await azulService.initiatePayment(orderId, 29);
        } catch (err) {
            console.error('Azul payment failed:', err);
            toast.error('No se pudo iniciar el pago con Azul. Inténtalo de nuevo.');
            setLoading(null);
        }
    };

    const isPro = user?.subscription_tier === 'pro';

    return (
        <div className="min-h-dvh bg-desk text-ink">
            <header className="border-b border-rule bg-paper">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
                    <Link to={user ? '/dashboard' : '/'} aria-label="ibPulse, inicio">
                        <Logo className="h-7" />
                    </Link>
                    {user ? (
                        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-2 hover:text-ink">
                            <ArrowLeft size={15} aria-hidden="true" />
                            Volver a ibPulse
                        </Link>
                    ) : (
                        <Link to="/login" className="text-sm font-medium text-ink-2 hover:text-ink">Iniciar sesión</Link>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-16">
                <h1 className="text-3xl font-bold tracking-[-0.015em] text-ink [font-stretch:108%] sm:text-4xl">Planes</h1>
                <p className="mt-3 text-[15px] text-ink-2">
                    {user ? <>Tu plan actual: <strong className="font-semibold text-ink">{isPro ? 'Pro' : 'Gratis'}</strong>.</> : 'Empieza gratis y pasa a Pro cuando lo necesites.'}
                </p>

                <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                    {PLANS.map((plan) => {
                        const isProPlan = plan.name === 'Pro';
                        const current = !!user && (isProPlan ? isPro : !isPro);
                        return (
                            /* FREE PLAN / PRO PLAN */
                            <section
                                key={plan.name}
                                aria-labelledby={`plan-${plan.name}`}
                                className={cn('sheet flex flex-col p-6 sm:p-7', isProPlan && 'border-ink shadow-lift')}
                            >
                                <div className="flex items-baseline justify-between gap-3">
                                    <h2 id={`plan-${plan.name}`} className="text-lg font-semibold text-ink">{plan.name}</h2>
                                    {current && (
                                        <span className="rounded-inner border border-st-green/60 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-wide text-st-green">
                                            Tu plan
                                        </span>
                                    )}
                                </div>
                                <p className="mt-3 flex items-baseline gap-1">
                                    <span className="text-4xl font-bold tabular-nums tracking-[-0.02em] text-ink [font-stretch:108%]">{plan.price}</span>
                                    <span className="text-sm text-ink-3">{plan.period}</span>
                                </p>
                                <p className="mt-2 text-sm text-ink-2">{plan.summary}</p>
                                <ul className="mt-6 flex-1 space-y-2.5 border-t border-rule pt-5">
                                    {plan.items.map((item) => (
                                        <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
                                            <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-st-green" />
                                            {item}
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-7 space-y-2">
                                    {!user ? (
                                        <Link
                                            to="/register"
                                            className={cn(
                                                'inline-flex h-10 w-full items-center justify-center rounded-control border px-4 text-sm font-semibold',
                                                isProPlan
                                                    ? 'border-brand bg-brand text-on-brand hover:border-brand-strong hover:bg-brand-strong'
                                                    : 'border-rule-strong/70 bg-paper text-ink hover:border-ink hover:bg-well'
                                            )}
                                        >
                                            {plan.cta}
                                        </Link>
                                    ) : !isProPlan ? (
                                        <p className="flex h-10 items-center justify-center rounded-control border border-dashed border-rule-strong/60 text-sm text-ink-3">
                                            {isPro ? 'Incluido en tu plan Pro' : 'Es tu plan actual'}
                                        </p>
                                    ) : isPro ? (
                                        <p className="flex h-10 items-center justify-center rounded-control border border-st-green/50 bg-st-green/[0.06] text-sm font-semibold text-st-green">
                                            Plan activo
                                        </p>
                                    ) : (
                                        <>
                                            <Button className="w-full" size="lg" onClick={handleUpgrade} isLoading={loading === 'stripe'} disabled={!!loading}>
                                                {loading !== 'stripe' && <CreditCard size={17} aria-hidden="true" />}
                                                Pagar con tarjeta
                                            </Button>
                                            <Button className="w-full" variant="secondary" onClick={handleAzul} isLoading={loading === 'azul'} disabled={!!loading}>
                                                Pagar con Azul
                                            </Button>
                                            <p className="pt-1 text-center text-xs text-ink-3">
                                                Cancela en cualquier momento. Sin contratos a largo plazo.
                                            </p>
                                        </>
                                    )}
                                </div>
                            </section>
                        );
                    })}
                </div>

                <p className="mt-8 text-sm text-ink-2">
                    ¿Equipo grande o necesidades especiales?{' '}
                    <a href="mailto:support@ibsystems.srl" className="font-semibold text-ink underline-offset-2 hover:underline">
                        support@ibsystems.srl
                    </a>
                </p>
            </main>
        </div>
    );
}
