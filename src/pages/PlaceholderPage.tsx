import { isRouteErrorResponse, Link, useLocation, useRouteError } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';

/**
 * Shown for addresses that do not exist and for errors while rendering a page.
 * Inside the app it sits in the layout; on its own it carries the letterhead.
 */
export function PlaceholderPage({ standalone = false }: { standalone?: boolean }) {
  const location = useLocation();
  const error = useRouteError();
  const isError = !!error && !(isRouteErrorResponse(error) && error.status === 404);

  if (isError) console.error(error);

  const title = isError ? 'Algo salió mal al abrir esta página' : 'Esta página no existe';
  const detail = isError
    ? 'Recarga la página. Si vuelve a pasar, escríbenos desde Ayuda y soporte con la dirección de abajo.'
    : 'Puede que el enlace esté incompleto o que lo que buscas se haya movido.';

  return (
    <div className={standalone || isError ? 'flex min-h-dvh flex-col bg-desk' : 'flex min-h-full flex-col'}>
      {(standalone || isError) && (
        <div className="border-b border-rule bg-paper px-6 py-3">
          <Link to="/" aria-label="ibPulse, inicio">
            <Logo className="h-6" />
          </Link>
        </div>
      )}
      <div className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="sheet w-full max-w-md border-t-2 border-t-brand p-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-semibold text-ink">{title}</h1>
            <span className="shrink-0 rounded-inner border border-rule-strong/60 px-2 py-1 font-mono text-xs font-semibold text-ink-2">
              {isError ? 'ERROR' : '404'}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{detail}</p>
          <p className="mt-4 truncate rounded-inner bg-well px-2.5 py-1.5 font-mono text-xs text-ink-3">{location.pathname}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/dashboard"
              className="inline-flex h-9 items-center rounded-control border border-brand bg-brand px-3.5 text-sm font-semibold text-on-brand hover:bg-brand-strong"
            >
              Ir al inicio
            </Link>
            {isError && (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-9 items-center rounded-control border border-rule-strong/70 bg-paper px-3.5 text-sm font-semibold text-ink hover:border-ink"
              >
                Recargar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
