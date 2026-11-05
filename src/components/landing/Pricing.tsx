import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { PLANS } from './plans';

export function Pricing() {
    return (
        <section id="precios" className="scroll-mt-20 border-b border-rule bg-paper" aria-labelledby="pricing-title">
            <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
                <div className="max-w-2xl">
                    <h2 id="pricing-title" className="text-3xl font-bold tracking-[-0.015em] text-ink [font-stretch:108%]">
                        Empieza gratis, pasa a Pro cuando crezcas
                    </h2>
                    <p className="mt-4 text-[15px] leading-relaxed text-ink-2">Sin tarjeta para empezar. Sin contratos a largo plazo.</p>
                </div>

                <div className="mt-10 grid grid-cols-1 max-w-4xl gap-5 md:grid-cols-2">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn('sheet flex flex-col p-6 sm:p-7', plan.featured && 'border-ink shadow-lift')}
                        >
                            <div className="flex items-baseline justify-between gap-3">
                                <h3 className="text-lg font-semibold text-ink">{plan.name}</h3>
                                {plan.featured && <span className="text-xs font-semibold text-brand">Recomendado para equipos</span>}
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
                            <Link
                                to="/register"
                                className={cn(
                                    'mt-7 inline-flex h-10 items-center justify-center rounded-control border px-4 text-sm font-semibold',
                                    plan.featured
                                        ? 'border-brand bg-brand text-on-brand hover:border-brand-strong hover:bg-brand-strong'
                                        : 'border-rule-strong/70 bg-paper text-ink hover:border-ink hover:bg-well'
                                )}
                            >
                                {plan.cta}
                            </Link>
                        </div>
                    ))}
                </div>

                <p className="mt-6 text-sm text-ink-2">
                    ¿Equipo grande o necesidades especiales?{' '}
                    <a href="mailto:support@ibsystems.srl" className="font-semibold text-ink underline-offset-2 hover:underline">
                        Escríbenos
                    </a>
                    .
                </p>
            </div>
        </section>
    );
}
