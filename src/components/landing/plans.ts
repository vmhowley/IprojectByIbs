// The limits match useSubscription; the Pro price matches what the checkout charges.
export const PLANS = [
    {
        name: 'Gratis',
        price: 'US$0',
        period: '/mes',
        summary: 'Para empezar con tus primeros clientes.',
        items: ['Hasta 3 proyectos', 'Hasta 3 clientes', 'Hasta 3 miembros por proyecto', 'Tickets, tablero, agenda y cronograma', 'Precios y totales por cliente'],
        cta: 'Crear cuenta gratis',
        featured: false,
    },
    {
        name: 'Pro',
        price: 'US$29',
        period: '/mes',
        summary: 'Para el equipo que ya trabaja con varios clientes.',
        items: ['Proyectos, clientes y miembros sin límite', 'Mensajes directos con el equipo', 'Análisis en el tablero de inicio', 'Todo lo del plan Gratis'],
        cta: 'Crear cuenta y pasar a Pro',
        featured: true,
    },
];
