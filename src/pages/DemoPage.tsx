import { Link } from 'react-router-dom';
import { TicketsByClientChart } from '../components/dashboard/TicketsByClientChart';
import { TicketsByStatusChart } from '../components/dashboard/TicketsByStatusChart';
import { ProjectCard } from '../components/project/ProjectCard';
import { Logo } from '../components/ui/Logo';
import { MoneyTotals } from '../components/ui/Money';
import { TableView } from '../components/views/TableView';
import { Project } from '../types';
import { formatMoney, sortCurrencies } from '../utils/format';

// Invented sample data. A public page never shows real clients or prices.
const now = new Date().toISOString();
const inDays = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
};

export function DemoPage() {
    // Mock Data
    const mockProjects: Project[] = [
        {
            id: '1',
            name: 'Portal de citas',
            description: 'Citas en línea y recordatorios por correo para los pacientes.',
            status: 'active',
            client_id: 'client1',
            clients: { name: 'Clínica del Este' },
            created_at: now,
            updated_at: now,
            created_by: 'user1',
            priority: 'high',
            end_date: inDays(18),
            cost: 4800,
            currency: 'USD',
        },
        {
            id: '2',
            name: 'Catálogo y pedidos',
            description: 'Catálogo con existencias y pedidos para clientes al por mayor.',
            status: 'active',
            client_id: 'client2',
            clients: { name: 'Ferretería Ozama' },
            created_at: now,
            updated_at: now,
            created_by: 'user1',
            priority: 'medium',
            end_date: inDays(41),
            cost: 185000,
            currency: 'DOP',
        },
        {
            id: '3',
            name: 'App de socios',
            description: 'Consulta de ahorros y préstamos desde el teléfono.',
            status: 'on_hold',
            client_id: 'client3',
            clients: { name: 'Cooperativa Ahorra+' },
            created_at: now,
            updated_at: now,
            created_by: 'user1',
            priority: 'low',
            end_date: inDays(63),
            cost: 2150,
            currency: 'USD',
        }
    ];

    const mockStatusStats = {
        pending_analysis: 5,
        pending_approval: 3,
        approved: 7,
        ongoing: 12,
        completed: 20,
    };

    const mockClientStats = [
        { name: 'Clínica del Este', count: 15 },
        { name: 'Ferretería Ozama', count: 12 },
        { name: 'Cooperativa Ahorra+', count: 8 },
        { name: 'Colegio San Pablo', count: 6 },
        { name: 'Transporte Cibao', count: 4 }
    ];

    const mockLedger: { id: string; client: string; projects: number; totals: Record<string, number> }[] = [
        { id: 'c1', client: 'Clínica del Este', projects: 2, totals: { USD: 7300 } },
        { id: 'c2', client: 'Ferretería Ozama', projects: 1, totals: { DOP: 185000 } },
        { id: 'c3', client: 'Cooperativa Ahorra+', projects: 2, totals: { USD: 2150, DOP: 64000 } },
        { id: 'c4', client: 'Colegio San Pablo', projects: 1, totals: { DOP: 96500 } },
    ];

    const grand: Record<string, number> = {};
    mockLedger.forEach((row) => Object.entries(row.totals).forEach(([code, amount]) => (grand[code] = (grand[code] || 0) + amount)));

    return (
        <div className="flex min-h-dvh flex-col bg-desk text-ink">
            {/* Demo Banner */}
            <header className="border-b border-rule bg-paper">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-4">
                        <Link to="/" aria-label="ibPulse, página principal">
                            <Logo className="h-7" />
                        </Link>
                        <p className="text-sm text-ink-2">
                            <span className="font-semibold text-ink">Demostración.</span>{' '}
                            <span className="max-sm:hidden">Todo lo que ves son datos de ejemplo.</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to="/" className="rounded-control px-2 py-2 text-sm font-medium text-ink-2 hover:text-ink">
                            Salir
                        </Link>
                        <Link
                            to="/register"
                            className="inline-flex h-9 items-center rounded-control border border-brand bg-brand px-3.5 text-sm font-semibold text-on-brand hover:border-brand-strong hover:bg-brand-strong"
                        >
                            Crear cuenta real
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">
                <div>
                    <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink">Inicio</h1>
                    <p className="mt-1 text-sm text-ink-2">
                        Así se ve el tablero de un equipo con cinco clientes: 12 proyectos (8 activos), 27 de 47 tickets abiertos,{' '}
                        <span className="font-semibold text-st-red">1 vencido</span> y 3 esperan al cliente.
                    </p>
                </div>

                <section aria-labelledby="demo-ledger" className="space-y-2">
                    <h2 id="demo-ledger" className="text-[15px] font-semibold text-ink">Libro de cotizaciones</h2>
                    <TableView
                        caption="Cotizado por cliente (ejemplo)"
                        data={mockLedger}
                        columns={[
                            { header: 'Cliente', cell: (row) => <span className="font-medium text-ink">{row.client}</span> },
                            { header: 'Proyectos', align: 'right', cell: (row) => <span className="text-[13px] text-ink-2">{row.projects}</span> },
                            {
                                header: 'Cotizado',
                                align: 'right',
                                cell: (row) => <MoneyTotals totals={row.totals} className="items-end text-[13px]" />,
                            },
                        ]}
                        footer={
                            <tr className="rule-total">
                                <th scope="row" colSpan={2} className="px-4 py-2.5 text-left text-sm font-semibold text-ink">Total</th>
                                <td className="whitespace-nowrap px-4 py-2.5 text-right font-mono text-sm font-semibold tabular-nums text-ink">
                                    {sortCurrencies(Object.keys(grand)).map((code) => (
                                        <span key={code} className="block">{formatMoney(grand[code], code)}</span>
                                    ))}
                                </td>
                            </tr>
                        }
                    />
                    <p className="text-xs text-ink-3">Cada moneda en su línea: los dólares y los pesos nunca se suman entre sí.</p>
                </section>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <TicketsByStatusChart stats={mockStatusStats} />
                    <TicketsByClientChart stats={mockClientStats} />
                </div>

                <section aria-labelledby="demo-projects" className="space-y-2">
                    <h2 id="demo-projects" className="text-[15px] font-semibold text-ink">Proyectos activos</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {mockProjects.map((project, index) => (
                            <div key={project.id} className="relative">
                                {/* Overlay to indicate non-interactive in demo */}
                                <div className="absolute inset-0 z-10 cursor-default" title="Solo lectura en la demostración" />
                                <ProjectCard
                                    project={project}
                                    taskCount={[15, 9, 6][index]}
                                    completedTaskCount={[8, 3, 1][index]}
                                    showPrice
                                />
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
