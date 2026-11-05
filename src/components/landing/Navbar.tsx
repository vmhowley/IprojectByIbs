import { Link } from 'react-router-dom';
import { Logo } from '../ui/Logo';

/** The letterhead of the public site: the mark, the sections and the way in. */
export function Navbar() {
    return (
        <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
                <Link to="/" aria-label="ibPulse, inicio" className="shrink-0">
                    <Logo className="h-6 sm:h-7" />
                </Link>

                <nav aria-label="Secciones" className="hidden items-center gap-7 md:flex">
                    <a href="#funciones" className="text-sm font-medium text-ink-2 hover:text-ink">Funciones</a>
                    <a href="#precios" className="text-sm font-medium text-ink-2 hover:text-ink">Precios</a>
                    <Link to="/demo" className="text-sm font-medium text-ink-2 hover:text-ink">Demo</Link>
                </nav>

                <div className="flex items-center gap-2 sm:gap-3">
                    <Link to="/login" className="whitespace-nowrap rounded-control px-2 py-2 text-sm font-medium text-ink-2 hover:text-ink">
                        Iniciar sesión
                    </Link>
                    <Link
                        to="/register"
                        className="inline-flex h-9 items-center whitespace-nowrap rounded-control border border-brand bg-brand px-3 text-sm font-semibold text-on-brand hover:border-brand-strong hover:bg-brand-strong sm:px-3.5"
                    >
                        Crear cuenta
                    </Link>
                </div>
            </div>
        </header>
    );
}
