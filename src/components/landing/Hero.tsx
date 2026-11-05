import { ArrowRight, Check, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMoney } from '../../utils/format';
import { StatusBadge } from '../ui/StatusBadge';

// Example rows for the preview. Invented names: never real client data on a public page.
const SAMPLE = [
    { client: 'Clínica del Este', project: 'Portal de citas', status: 'active', amount: 4800, currency: 'USD' },
    { client: 'Ferretería Ozama', project: 'Catálogo y pedidos', status: 'on_hold', amount: 185000, currency: 'DOP' },
    { client: 'Cooperativa Ahorra+', project: 'App de socios', status: 'active', amount: 2150, currency: 'USD' },
    { client: 'Colegio San Pablo', project: 'Notas en línea', status: 'completed', amount: 96500, currency: 'DOP' },
];

function sampleTotals() {
    const totals: Record<string, number> = {};
    SAMPLE.forEach((row) => (totals[row.currency] = (totals[row.currency] || 0) + row.amount));
    return totals;
}

/** The app's own ledger, drawn live with sample data, with a ticket waiting for the client on top. */
function ProductPreview() {
    const totals = sampleTotals();
    return (
        <div className="relative" aria-label="Vista de ejemplo de ibPulse" role="img">
            <div className="sheet overflow-hidden shadow-lift" aria-hidden="true">
                <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
                    <p className="text-sm font-semibold text-ink">Libro de cotizaciones</p>
                    <p className="text-xs text-ink-3">Datos de ejemplo</p>
                </div>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-rule bg-well">
                            <th className="caption px-4 py-1.5 text-left font-semibold">Cliente · proyecto</th>
                            <th className="caption hidden px-2 py-1.5 text-left font-semibold sm:table-cell">Estado</th>
                            <th className="caption px-4 py-1.5 text-right font-semibold">Precio</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                        {SAMPLE.map((row) => (
                            <tr key={row.client}>
                                <td className="px-4 py-2.5">
                                    <span className="block font-medium text-ink">{row.client}</span>
                                    <span className="block text-xs text-ink-3">{row.project}</span>
                                </td>
                                <td className="hidden px-2 py-2.5 sm:table-cell">
                                    <StatusBadge status={row.status} size="sm" />
                                </td>
                                <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono tabular-nums text-ink">
                                    {formatMoney(row.amount, row.currency)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="rule-total">
                            <th scope="row" className="px-4 py-2.5 text-left text-sm font-semibold text-ink">Total cotizado</th>
                            <td className="hidden sm:table-cell" />
                            <td className="px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                                <span className="block">{formatMoney(totals.USD, 'USD')}</span>
                                <span className="block">{formatMoney(totals.DOP, 'DOP')}</span>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* A ticket waiting for the client's answer, laid over the ledger's lower edge. */}
            <div
                className="sheet relative -mt-2 ml-auto mr-3 w-[18rem] rotate-[1.25deg] p-4 shadow-lift sm:-mr-4"
                aria-hidden="true"
            >
                <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-xs font-semibold text-ink-3">Ticket 12/40</p>
                    <StatusBadge status="pending_approval" size="sm" animate />
                </div>
                <p className="mt-1.5 text-sm font-semibold leading-snug text-ink">Ajustar el cálculo de la mora</p>
                <p className="mt-2 text-xs text-ink-2">Cooperativa Ahorra+ revisa la entrega desde su portal.</p>
                <div className="mt-3 flex gap-2">
                    <span className="inline-flex h-7 items-center gap-1 rounded-control border border-brand bg-brand px-2.5 text-xs font-semibold text-on-brand">
                        <Check size={13} /> Aprobar
                    </span>
                    <span className="inline-flex h-7 items-center gap-1 rounded-control border border-rule-strong/70 bg-paper px-2.5 text-xs font-semibold text-ink">
                        <RotateCcw size={12} /> Solicitar cambios
                    </span>
                </div>
            </div>
        </div>
    );
}

export function Hero() {
    return (
        <section className="border-b border-rule" aria-labelledby="hero-title">
            <div className="mx-auto grid grid-cols-1 max-w-6xl items-center gap-12 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16 lg:pb-24 lg:pt-20">
                <div>
                    <h1
                        id="hero-title"
                        className="text-[2.5rem] font-bold leading-[1.04] tracking-[-0.02em] text-ink [font-stretch:112%] sm:text-[3.4rem]"
                    >
                        Cada proyecto con su precio. Cada cliente con su cuenta.
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
                        ibPulse lleva los proyectos y tickets de tu equipo por cliente: quién pidió qué, en qué estado va,
                        cuándo vence y cuánto se cotizó. Dólares y pesos, cada uno en su línea.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-3">
                        <Link
                            to="/register"
                            className="group inline-flex h-11 items-center gap-2 rounded-control border border-brand bg-brand px-5 text-[15px] font-semibold text-on-brand hover:border-brand-strong hover:bg-brand-strong"
                        >
                            Crear cuenta gratis
                            <ArrowRight size={17} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                        <Link
                            to="/demo"
                            className="inline-flex h-11 items-center rounded-control border border-rule-strong/70 bg-paper px-5 text-[15px] font-semibold text-ink hover:border-ink hover:bg-well"
                        >
                            Ver la demo
                        </Link>
                    </div>
                    <p className="mt-4 text-sm text-ink-3">Gratis hasta 3 proyectos y 3 clientes. Sin tarjeta para empezar.</p>
                </div>

                <ProductPreview />
            </div>
        </section>
    );
}
