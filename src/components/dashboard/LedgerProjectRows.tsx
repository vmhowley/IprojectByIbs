import { FileSpreadsheet, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '../../types';
import { ProjectQuote } from '../../types/Project';
import { formatMoney } from '../../utils/format';

interface LedgerProjectRowsProps {
  projects: Project[];
  /** The ledger's currency columns, in order. */
  currencies: string[];
  quotesByProject: Map<string, ProjectQuote[]>;
  /** The project whose quote is being uploaded, if any. */
  uploadingId: string | null;
  onDownload: (quote: ProjectQuote) => void;
  onUpload: (projectId: string) => void;
}

/** A client's projects inside the quote ledger: each price with the quote behind it. */
export function LedgerProjectRows({ projects, currencies, quotesByProject, uploadingId, onDownload, onUpload }: LedgerProjectRowsProps) {
  return (
    <>
      {projects.map((project) => {
        const quotes = quotesByProject.get(project.id) || [];
        const currency = (project.currency || 'USD').toUpperCase();
        const priced = project.cost !== null && project.cost !== undefined;
        return (
          <tr key={project.id} className="bg-well/60">
            <td className="py-2 pl-10 pr-4 align-top">
              <Link to={`/project/${project.id}?tab=quote`} className="block text-[13px] font-medium text-ink wrap-anywhere hover:underline">
                {project.name}
              </Link>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {quotes.map((quote) => (
                  <button
                    key={quote.id}
                    type="button"
                    onClick={() => onDownload(quote)}
                    title={`Descargar ${quote.name}`}
                    className="inline-flex max-w-full items-center gap-1 rounded-inner border border-rule bg-raised px-1.5 py-0.5 text-[11px] font-medium text-ink-2 hover:border-rule-strong hover:text-ink"
                  >
                    <FileSpreadsheet size={12} aria-hidden="true" className="shrink-0" />
                    <span className="truncate">{quote.name}</span>
                  </button>
                ))}
                {quotes.length === 0 && (
                  <button
                    type="button"
                    onClick={() => onUpload(project.id)}
                    disabled={uploadingId !== null}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-strong hover:underline disabled:opacity-50"
                  >
                    <Plus size={12} aria-hidden="true" />
                    {uploadingId === project.id ? 'Subiendo…' : 'Subir cotización'}
                  </button>
                )}
                {!priced && <span className="text-[11px] text-ink-3">sin precio</span>}
              </div>
            </td>
            <td className="hidden sm:table-cell" />
            {currencies.map((code) => (
              <td key={code} className="whitespace-nowrap px-4 py-2 text-right align-top font-mono text-[13px] tabular-nums text-ink-2">
                {priced && currency === code ? formatMoney(Number(project.cost), code) : ''}
              </td>
            ))}
          </tr>
        );
      })}
    </>
  );
}
