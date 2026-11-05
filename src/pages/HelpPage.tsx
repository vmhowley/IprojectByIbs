import { BookOpen, ChevronDown, LifeBuoy, Mail } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { cn } from '../lib/utils';
import { normalizeText } from '../utils/tickets';

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "¿Cómo creo un nuevo proyecto?",
        answer: "En Proyectos pulsa «Nuevo proyecto», o usa el botón del mismo nombre al pie del menú lateral. Completa el nombre, el cliente y las fechas; el precio lo ponen los administradores."
    },
    {
        question: "¿Quién ve los precios?",
        answer: "Solo los administradores. El precio se pone en cada proyecto, con su moneda, y se suma por cliente en Clientes y en el libro de cotizaciones de Inicio. Nunca se suman monedas distintas."
    },
    {
        question: "¿Cómo aprueba un cliente una entrega?",
        answer: "Dale acceso en Clientes › Acceso al portal con el correo de su cuenta. Cuando un ticket está en «Aprobación del cliente», esa persona ve los botones Aprobar y Solicitar cambios."
    },
    {
        question: "¿Cómo puedo restablecer mi contraseña?",
        answer: "Si olvidaste tu contraseña, cierra sesión y haz clic en «¿Olvidaste tu contraseña?» en la pantalla de inicio de sesión. Recibirás un correo con las instrucciones."
    },
    {
        question: "¿Cómo agrego miembros a mi equipo?",
        answer: "Dentro de cada proyecto, «Miembros» invita por correo a quien ya tiene cuenta. Los roles los cambia un administrador en Usuarios y permisos, desde el menú de tu cuenta."
    },
    {
        question: "¿Puedo exportar mis reportes?",
        answer: "Sí. En Inicio, «Exportar PDF» descarga el resumen del tablero. Está disponible para administradores y agentes de soporte."
    },
    {
        question: "¿Qué es el ID de Caso de Uso?",
        answer: "Es un identificador único que puedes asignar a tus proyectos para relacionarlos con casos de uso o requerimientos externos de tu sistema de gestión."
    }
];

export function HelpPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [searchQuery, setSearchQuery] = useState('');

    const term = normalizeText(searchQuery.trim());
    const filteredFaqs = faqs.filter(faq => !term || normalizeText(`${faq.question} ${faq.answer}`).includes(term));

    return (
        <div className="flex min-h-full flex-col">
            {/* Header Section */}
            <PageHeader
                title="Ayuda"
                subtitle="Respuestas rápidas sobre ibPulse y las formas de hablar con nuestro equipo."
                search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Buscar en las preguntas' }}
            />

            <div className="grid grid-cols-1 max-w-5xl items-start gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
                {/* FAQ Section */}
                <section className="sheet overflow-hidden" aria-labelledby="faq-title">
                    <h2 id="faq-title" className="border-b border-rule px-5 py-3 text-[15px] font-semibold text-ink">
                        Preguntas frecuentes
                    </h2>
                    {filteredFaqs.length > 0 ? (
                        <ul className="divide-y divide-rule">
                            {filteredFaqs.map((faq, index) => {
                                const open = openIndex === index || !!term;
                                return (
                                    <li key={faq.question}>
                                        <h3>
                                            <button
                                                type="button"
                                                aria-expanded={open}
                                                aria-controls={`faq-${index}`}
                                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                                className="flex w-full items-start justify-between gap-4 px-5 py-3.5 text-left text-sm font-medium text-ink outline-none hover:bg-ink/[0.02] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
                                            >
                                                {faq.question}
                                                <ChevronDown size={16} aria-hidden="true" className={cn('mt-0.5 shrink-0 text-ink-3 transition-transform', open && 'rotate-180')} />
                                            </button>
                                        </h3>
                                        {open && (
                                            <p id={`faq-${index}`} className="max-w-[68ch] px-5 pb-4 text-sm leading-relaxed text-ink-2">
                                                {faq.answer}
                                            </p>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="px-5 py-10 text-center text-sm text-ink-3">
                            Ninguna pregunta habla de «{searchQuery}». Escríbenos y te ayudamos.
                        </p>
                    )}
                </section>

                {/* Quick Actions */}
                <aside className="sheet divide-y divide-rule" aria-label="Contacto">
                    <div className="px-5 py-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <LifeBuoy size={15} aria-hidden="true" className="text-ink-3" />
                            Chat en vivo
                        </p>
                        <p className="mt-1 text-[13px] text-ink-2">Disponible de lunes a viernes, de 9:00 a. m. a 6:00 p. m.</p>
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new Event('open-support-chat'))}
                            className="mt-2 text-[13px] font-semibold text-ink underline-offset-2 hover:underline"
                        >
                            Iniciar chat
                        </button>
                    </div>
                    <div className="px-5 py-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <Mail size={15} aria-hidden="true" className="text-ink-3" />
                            Soporte por correo
                        </p>
                        <p className="mt-1 text-[13px] text-ink-2">Escríbenos y te responderemos en menos de 24 horas.</p>
                        <a href="mailto:support@ibsystems.srl" className="mt-2 inline-block text-[13px] font-semibold text-ink underline-offset-2 hover:underline">
                            support@ibsystems.srl
                        </a>
                    </div>
                    <div className="px-5 py-4">
                        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <BookOpen size={15} aria-hidden="true" className="text-ink-3" />
                            Documentación
                        </p>
                        <p className="mt-1 text-[13px] text-ink-2">Manuales y guías del equipo, generales o de cada proyecto.</p>
                        <Link to="/documentation" className="mt-2 inline-block text-[13px] font-semibold text-ink underline-offset-2 hover:underline">
                            Ver documentación
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}
