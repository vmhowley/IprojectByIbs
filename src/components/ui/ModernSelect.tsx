import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Option {
    value: string;
    label: string;
    color?: string;
    icon?: React.ReactNode;
}

interface ModernSelectProps {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    renderValue?: (value: string, option?: Option) => React.ReactNode;
    disabled?: boolean;
}

export function ModernSelect({
    value,
    options,
    onChange,
    label,
    placeholder = 'Select...',
    className = '',
    renderValue,
    disabled = false
}: ModernSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm transition-all text-left group
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'hover:border-gray-300 hover:bg-gray-50'}
                `}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {renderValue ? (
                        renderValue(value, selectedOption)
                    ) : (
                        selectedOption ? (
                            <span className="text-sm font-medium text-gray-700 truncate">{selectedOption.label}</span>
                        ) : (
                            <span className="text-sm text-gray-400 truncate">{placeholder}</span>
                        )
                    )}
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="max-h-60 overflow-y-auto py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors ${value === option.value ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700'
                                    }`}
                            >
                                {option.icon}
                                <span className="truncate">{option.label}</span>
                                {value === option.value && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
