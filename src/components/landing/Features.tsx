import { BookOpen, CalendarRange, FileDown, KanbanSquare, LucideIcon, MessagesSquare, Mic, ShieldCheck, Wallet } from 'lucide-react';

const steps = [
    {
        title: 'Registra el cliente y el proyecto',
        description: 'Con su contacto, sus fechas y el precio cotizado en dólares o en pesos.',
    },
    {
        title: 'Lleva el trabajo en tickets',
        description: 'Cada pedido es un ticket con número, prioridad y fecha límite. Muévelos en el tablero.',
    },
    {
        title: 'El cliente aprueba la entrega',
        description: 'Desde su portal, sin correos. Tú ves lo cotizado por cliente y por moneda.',
    },
];

const features: { icon: LucideIcon; title: string; description: string }[] = [
    {
        icon: Wallet,
        title: 'Precios y totales por cliente',
        description: 'Cada proyecto lleva su precio. Los totales salen por cliente y por moneda, sin mezclar dólares y pesos. Solo los administradores los ven.',
    },
    {
        icon: KanbanSquare,
        title: 'Proyectos y tickets',
        description: 'Lista, fichas o tablero con arrastrar y soltar. Subtareas, objetos, archivos, comentarios y control de calidad en cada ticket.',
    },
    {
        icon: ShieldCheck,
        title: 'Portal del cliente',
        description: 'Tus clientes ven sus proyectos y tickets, y aprueban una entrega o piden cambios sin escribirte un correo.',
    },
    {
        icon: CalendarRange,
        title: 'Agenda y cronograma',
        description: 'Fechas límite, entregas y reuniones en un mismo calendario. El cronograma muestra seis meses de proyectos.',
    },
    {
        icon: Mic,
        title: 'Reuniones con resumen',
        description: 'Graba la reunión o sube el audio. La IA escribe el resumen, los pendientes y la transcripción.',
    },
    {
        icon: MessagesSquare,
        title: 'Mensajes y canales',
        description: 'Conversaciones directas y canales del equipo, en tiempo real, al lado del trabajo.',
    },
    {
        icon: BookOpen,
        title: 'Documentación',
        description: 'Manuales, especificaciones y entregables, generales o de cada proyecto, en un solo archivo.',
    },
    {
        icon: FileDown,
        title: 'Resumen en PDF',
        description: 'Exporta el tablero de inicio para la reunión de seguimiento con el cliente.',
    },
];

export function Features() {
    return (
        <>
            <section className="border-b border-rule bg-paper" aria-labelledby="steps-title">
                <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
                    <h2 id="steps-title" className="max-w-2xl text-3xl font-bold tracking-[-0.015em] text-ink [font-stretch:108%]">
                        Del pedido a la entrega, en el mismo lugar
                    </h2>
                    <ol className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-sheet border border-rule bg-rule md:grid-cols-3">
                        {steps.map((step, index) => (
                            <li key={step.title} className="bg-paper p-6">
                                <span className="font-mono text-sm font-semibold text-brand">{String(index + 1).padStart(2, '0')}</span>
                                <h3 className="mt-3 text-lg font-semibold text-ink">{step.title}</h3>
                                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{step.description}</p>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>

            <section id="funciones" className="scroll-mt-20 border-b border-rule" aria-labelledby="features-title">
                <div className="mx-auto grid grid-cols-1 max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16 lg:py-24">
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <h2 id="features-title" className="text-3xl font-bold tracking-[-0.015em] text-ink [font-stretch:108%]">
                            Lo que lleva ibPulse
                        </h2>
                        <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
                            Hecho para equipos y agencias que trabajan para varios clientes y necesitan saber, cada día, qué falta y cuánto vale.
                        </p>
                    </div>

                    <ul className="grid grid-cols-1 gap-x-10 sm:grid-cols-2">
                        {features.map(({ icon: Icon, title, description }) => (
                            <li key={title} className="border-t border-rule py-6">
                                <h3 className="flex items-center gap-2.5 text-base font-semibold text-ink">
                                    <Icon size={18} aria-hidden="true" className="shrink-0 text-brand" strokeWidth={1.75} />
                                    {title}
                                </h3>
                                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{description}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </>
    );
}
