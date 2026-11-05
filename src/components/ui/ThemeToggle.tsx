import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

/** Paper by day, carbon paper by night. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const label = isLight ? 'Cambiar a modo carbón (oscuro)' : 'Cambiar a modo papel (claro)';
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-control text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink',
        className
      )}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
