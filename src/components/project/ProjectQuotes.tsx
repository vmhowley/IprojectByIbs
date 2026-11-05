import { Download, FileSpreadsheet, Lock, Plus, Receipt, Trash2 } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { quoteService } from '../../services/quoteService';
import { ProjectQuote } from '../../types/Project';
import { errorMessage } from '../../utils/errors';
import { fileKind, formatDate, formatFileSize } from '../../utils/format';
import { Button } from '../ui/Button';
import { confirmDialog } from '../ui/ConfirmDialog';
import { EmptyState } from '../ui/EmptyState';

interface ProjectQuotesProps {
  projectId: string;
  quotes: ProjectQuote[];
  onChange: (quotes: ProjectQuote[]) => void;
}

/** The documents behind the price: the quote sent to the client, seen only by admins. */
export function ProjectQuotes({ projectId, quotes, onChange }: ProjectQuotesProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be picked again.
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    const toastId = toast.loading('Subiendo cotización…');
    try {
      const quote = await quoteService.upload(projectId, file, file.name, file.type);
      onChange([quote, ...quotes]);
      toast.success('Cotización guardada', { id: toastId });
    } catch (error) {
      console.error('Error uploading quote:', error);
      toast.error('No se pudo subir la cotización: ' + errorMessage(error, 'error desconocido'), { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (quote: ProjectQuote) => {
    try {
      await quoteService.download(quote);
    } catch (error) {
      console.error('Error opening quote:', error);
      toast.error('No se pudo abrir la cotización.');
    }
  };

  const handleDelete = async (quote: ProjectQuote) => {
    const ok = await confirmDialog({
      title: 'Eliminar cotización',
      message: `Se eliminará «${quote.name}». No se puede deshacer.`,
      confirmText: 'Eliminar cotización',
    });
    if (!ok) return;
    try {
      await quoteService.remove(quote);
      onChange(quotes.filter((q) => q.id !== quote.id));
      toast.success('Cotización eliminada');
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('No se pudo eliminar la cotización.');
    }
  };

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-start gap-1.5 text-sm text-ink-2">
          <Lock size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
          El documento que se envió al cliente. Solo lo ven los administradores, igual que el precio.
        </p>
        <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
        <Button variant="secondary" onClick={() => inputRef.current?.click()} isLoading={uploading}>
          {!uploading && <Plus size={16} aria-hidden="true" />}
          Subir cotización
        </Button>
      </div>

      {quotes.length === 0 ? (
        <EmptyState icon={Receipt} title="Sin cotización">
          Sube el Excel, Word o PDF de la cotización. Queda enlazado a este proyecto y aparece en el libro de cotizaciones.
        </EmptyState>
      ) : (
        <ul className="sheet divide-y divide-rule">
          {quotes.map((quote) => (
            <li key={quote.id} className="flex items-start gap-3 px-4 py-3">
              <FileSpreadsheet size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handleDownload(quote)}
                  className="text-left font-medium text-ink wrap-anywhere hover:underline"
                >
                  {quote.name}
                </button>
                <p className="mt-1 text-xs text-ink-3">
                  <span className="font-mono">{fileKind(quote.name, quote.file_type)}</span>
                  {quote.file_size ? ` · ${formatFileSize(quote.file_size)}` : ''} · {formatDate(quote.created_at)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDownload(quote)}
                aria-label={`Descargar ${quote.name}`}
                title="Descargar"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-3 hover:bg-ink/[0.06] hover:text-ink"
              >
                <Download size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(quote)}
                aria-label={`Eliminar ${quote.name}`}
                title="Eliminar"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-3 hover:bg-st-red/10 hover:text-st-red"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
