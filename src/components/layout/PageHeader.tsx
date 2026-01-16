import { LucideIcon, Search } from 'lucide-react';
import { ReactNode } from 'react';

interface Action {
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    search?: {
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    };
    actions?: Action[];
    children?: ReactNode;
}

export function PageHeader({ title, subtitle, search, actions, children }: PageHeaderProps) {
    return (
        <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
                </div>

                <div className="flex flex-1 md:justify-end items-center gap-3">
                    {search && (
                        <div className="relative flex-1 max-w-md">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder={search.placeholder || "Buscar..."}
                                value={search.value}
                                onChange={(e) => search.onChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm text-gray-900 dark:text-white"
                            />
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {actions?.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all active:scale-95 whitespace-nowrap ${action.variant === 'secondary'
                                        ? 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                                        : action.variant === 'outline'
                                            ? 'border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                                    }`}
                            >
                                <action.icon size={18} />
                                <span className="hidden sm:inline">{action.label}</span>
                            </button>
                        ))}
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
