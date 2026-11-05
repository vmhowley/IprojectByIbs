import { ArrowLeft, LucideIcon, Search } from 'lucide-react';
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';

interface Action {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
}

interface PageHeaderProps {
    title: ReactNode;
    subtitle?: ReactNode;
    /** Way back to the list this page belongs to. */
    back?: { to: string; label: string };
    /** Top-right box of the form: document type and number, totals. */
    meta?: ReactNode;
    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
    actions?: Action[];
    children?: ReactNode;
    /** Folder tabs along the bottom edge; the active one covers the rule. */
    tabs?: ReactNode;
    className?: string;
}

/** The head of the form: title, what it covers, and the actions for the whole page. */
export function PageHeader({ title, subtitle, back, meta, search, actions, children, tabs, className }: PageHeaderProps) {
    return (
        <header className={cn('border-b border-rule bg-desk px-4 pt-4 sm:px-6 sm:pt-5', tabs ? 'pb-0' : 'pb-4', className)}>
            {back && (
                <Link
                    to={back.to}
                    className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink"
                >
                    <ArrowLeft size={14} aria-hidden="true" />
                    {back.label}
                </Link>
            )}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink">{title}</h1>
                        {subtitle && <p className="mt-1 max-w-3xl text-sm text-ink-2">{subtitle}</p>}
                    </div>
                    {meta && <div className="shrink-0 lg:hidden">{meta}</div>}
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:justify-end">
                    {search && (
                        <div className="relative w-full sm:w-72">
                            <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
                            <input
                                type="search"
                                aria-label={search.placeholder || 'Buscar'}
                                placeholder={search.placeholder || 'Buscar…'}
                                value={search.value}
                                onChange={(e) => search.onChange(e.target.value)}
                                className="field h-9 pl-8"
                            />
                        </div>
                    )}
                    {children}
                    {actions?.map((action, index) => (
                        <Button
                            key={index}
                            onClick={action.onClick}
                            variant={action.variant === 'primary' || !action.variant ? 'primary' : 'secondary'}
                        >
                            <action.icon size={16} aria-hidden="true" />
                            {action.label}
                        </Button>
                    ))}
                    {meta && <div className="hidden lg:block">{meta}</div>}
                </div>
            </div>
            {tabs && <div className="mt-4">{tabs}</div>}
        </header>
    );
}

/** The numbered box in the top-right corner of a printed form. */
export function DocNumber({ label, value, className }: { label: string; value: ReactNode; className?: string }) {
    return (
        <div className={cn('rounded-control border border-rule-strong/60 bg-paper px-3 py-1.5 text-right', className)}>
            <p className="caption leading-none">{label}</p>
            <p className="mt-1 font-mono text-[15px] font-semibold leading-none text-ink tabular-nums">{value}</p>
        </div>
    );
}
