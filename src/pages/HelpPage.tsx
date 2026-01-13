import { ChevronDown, ChevronUp, FileText, Mail, MessageCircle, Search } from 'lucide-react';
import { useState } from 'react';

interface FAQItem {
    question: string;
    answer: string;
}

const faqs: FAQItem[] = [
    {
        question: "¿Cómo creo un nuevo proyecto?",
        answer: "Ve a la sección 'Proyectos' en el menú lateral o desde el inicio, y haz clic en el botón 'Nuevo Proyecto'. Completa los detalles como nombre, cliente y fechas."
    },
    {
        question: "¿Cómo puedo restablecer mi contraseña?",
        answer: "Si olvidaste tu contraseña, cierra sesión y haz clic en '¿Olvidaste tu contraseña?' en la pantalla de inicio de sesión. Recibirás un correo con las instrucciones."
    },
    {
        question: "¿Cómo agrego miembros a mi equipo?",
        answer: "Actualmente, la gestión de usuarios la realiza el administrador del sistema. Contacta a soporte para agregar nuevos usuarios a tu organización."
    },
    {
        question: "¿Puedo exportar mis reportes?",
        answer: "Estamos trabajando en la función de exportación. Por ahora, puedes visualizar los reportes directamente en el panel de control."
    },
    {
        question: "¿Qué es el ID de Caso de Uso?",
        answer: "Es un identificador único que puedes asignar a tus proyectos para relacionarlos con casos de uso o requerimientos externos de tu sistema de gestión."
    }
];

export function HelpPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex-1 bg-gray-50 min-h-screen p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header Section */}
                <div className="text-center space-y-4">
                    <h1 className="text-3xl font-bold text-gray-900">Centro de Ayuda</h1>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        ¿Tienes preguntas? Estamos aquí para ayudarte. Busca en nuestras preguntas frecuentes o contacta directamente a nuestro equipo.
                    </p>

                    <div className="relative max-w-xl mx-auto mt-6">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm transition-all"
                            placeholder="Buscar '¿cómo crear tareas?'..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Soporte por Email</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Escríbenos y te responderemos en menos de 24 horas.
                        </p>
                        <a href="mailto:support@ibsystems.srl" className="text-blue-600 font-medium text-sm hover:underline">
                            support@ibsystems.srl
                        </a>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
                            <FileText className="w-6 h-6 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Documentación</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Guías detalladas sobre cómo utilizar todas las funciones.
                        </p>
                        <a href="/docs" className="text-purple-600 font-medium text-sm hover:underline">
                            Ver guías →
                        </a>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
                            <MessageCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Chat en Vivo</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Disponible de Lunes a Viernes, 9:00 AM - 6:00 PM.
                        </p>
                        <button className="text-green-600 font-medium text-sm hover:underline">
                            Iniciar chat
                        </button>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-900">Preguntas Frecuentes</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {filteredFaqs.length > 0 ? (
                            filteredFaqs.map((faq, index) => (
                                <div key={index} className="p-6 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setOpenIndex(openIndex === index ? null : index)}>
                                    <div className="flex items-start justify-between">
                                        <h3 className="text-base font-medium text-gray-900 pr-8">{faq.question}</h3>
                                        {openIndex === index ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                        )}
                                    </div>
                                    {openIndex === index && (
                                        <p className="mt-3 text-sm text-gray-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                                            {faq.answer}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center text-gray-500">
                                No se encontraron resultados para "{searchQuery}"
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
