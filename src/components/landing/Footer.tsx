import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

export function Footer() {
    return (
        <footer className="bg-desk">
            <div className="mx-auto grid grid-cols-1 max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
                <div>
                    <Logo className="h-7" />
                    <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-2">
                        Simplificando la gestión de proyectos para equipos modernos que buscan excelencia y control.
                    </p>
                </div>

                <nav aria-label="Producto">
                    <h3 className="caption">Producto</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                        <li><a href="#funciones" className="text-ink-2 hover:text-ink">Funciones</a></li>
                        <li><a href="#precios" className="text-ink-2 hover:text-ink">Precios</a></li>
                        <li><Link to="/demo" className="text-ink-2 hover:text-ink">Demo</Link></li>
                    </ul>
                </nav>

                <nav aria-label="Cuenta y contacto">
                    <h3 className="caption">Cuenta</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                        <li><Link to="/login" className="text-ink-2 hover:text-ink">Iniciar sesión</Link></li>
                        <li><Link to="/register" className="text-ink-2 hover:text-ink">Crear cuenta</Link></li>
                        <li><a href="mailto:support@ibsystems.srl" className="text-ink-2 hover:text-ink">support@ibsystems.srl</a></li>
                    </ul>
                </nav>
            </div>

            <div className="border-t border-rule">
                <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-ink-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p>© {new Date().getFullYear()} IBS ibPulse. Todos los derechos reservados.</p>
                    <p className="font-semibold tracking-[0.08em]">BY IBSYSTEMS.SRL</p>
                </div>
            </div>
        </footer>
    );
}
