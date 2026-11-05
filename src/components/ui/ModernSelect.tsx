import { Check, ChevronDown } from 'lucide-react';
import { KeyboardEvent, ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { Popover } from './Popover';

interface Option {
    value: string;
    label: string;
    color?: string;
    icon?: ReactNode;
}

interface ModernSelectProps {
    value: string;
    options: Option[];
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    renderValue?: (value: string, option?: Option) => ReactNode;
    disabled?: boolean;
}

/** A select whose options can carry a stamp or an icon. Keyboard: arrows, Home, End, Enter, Escape. */
export function ModernSelect({
    value,
    options,
    onChange,
    label,
    placeholder = 'Seleccionar…',
    className = '',
    renderValue,
    disabled = false
}: ModernSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const listId = useId();
    const labelId = useId();

    const selectedIndex = options.findIndex(opt => opt.value === value);
    const selectedOption = options[selectedIndex];

    const close = useCallback(() => setIsOpen(false), []);

    useEffect(() => {
        if (isOpen) {
            setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
            requestAnimationFrame(() => listRef.current?.focus());
        }
    }, [isOpen, selectedIndex]);

    useEffect(() => {
        if (!isOpen || activeIndex < 0) return;
        listRef.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [isOpen, activeIndex]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
        buttonRef.current?.focus();
    };

    const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex(i => Math.min(options.length - 1, i + 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex(i => Math.max(0, i - 1));
        } else if (event.key === 'Home') {
            event.preventDefault();
            setActiveIndex(0);
        } else if (event.key === 'End') {
            event.preventDefault();
            setActiveIndex(options.length - 1);
        } else if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (options[activeIndex]) handleSelect(options[activeIndex].value);
        } else if (event.key === 'Tab') {
            setIsOpen(false);
        }
    };

    const onButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            setIsOpen(true);
        }
    };

    return (
        <div className={cn('relative', className)}>
            {label && (
                <span id={labelId} className="caption mb-1.5 block">
                    {label}
                </span>
            )}

            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && setIsOpen(open => !open)}
                onKeyDown={onButtonKeyDown}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-controls={isOpen ? listId : undefined}
                aria-labelledby={label ? labelId : undefined}
                className="field flex min-h-9 items-center justify-between gap-2 text-left"
            >
                <span className="flex min-w-0 items-center gap-2">
                    {renderValue ? (
                        renderValue(value, selectedOption)
                    ) : selectedOption ? (
                        <>
                            {selectedOption.icon}
                            <span className="truncate text-sm text-ink">{selectedOption.label}</span>
                        </>
                    ) : (
                        <span className="truncate text-sm text-ink-3">{placeholder}</span>
                    )}
                </span>
                <ChevronDown size={14} aria-hidden="true" className={cn('shrink-0 text-ink-3 transition-transform duration-150', isOpen && 'rotate-180')} />
            </button>

            <Popover anchorRef={buttonRef} open={isOpen} onClose={close} matchWidth className="min-w-[12rem]">
                <div
                    ref={listRef}
                    id={listId}
                    role="listbox"
                    tabIndex={-1}
                    aria-labelledby={label ? labelId : undefined}
                    aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
                    onKeyDown={onListKeyDown}
                    className="max-h-64 overflow-y-auto py-1 outline-none"
                >
                    {options.map((option, index) => {
                        const selected = value === option.value;
                        return (
                            <div
                                key={option.value}
                                id={`${listId}-${index}`}
                                data-index={index}
                                role="option"
                                aria-selected={selected}
                                onMouseEnter={() => setActiveIndex(index)}
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    'flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-ink',
                                    index === activeIndex && 'bg-ink/[0.06]',
                                    selected && 'font-semibold'
                                )}
                            >
                                {option.icon}
                                <span className="truncate">{option.label}</span>
                                {selected && <Check size={14} aria-hidden="true" className="ml-auto shrink-0 text-brand" />}
                            </div>
                        );
                    })}
                </div>
            </Popover>
        </div>
    );
}
