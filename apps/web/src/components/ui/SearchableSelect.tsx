import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = query
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.sublabel?.toLowerCase().includes(query.toLowerCase()),
      )
    : options;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border border-steel-200 bg-white px-4 py-3 text-left text-base min-h-11',
          'focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          open && 'border-accent ring-2 ring-accent/20',
        )}
      >
        <span className={selected ? 'text-steel-900' : 'text-steel-400'}>
          {selected ? (
            <span>
              {selected.label}
              {selected.sublabel && (
                <span className="ml-1 text-sm text-steel-600">({selected.sublabel})</span>
              )}
            </span>
          ) : (
            placeholder
          )}
        </span>
        <span className="flex items-center gap-1">
          {value && (
            <span onClick={handleClear} className="rounded p-0.5 hover:bg-steel-100">
              <X className="h-3.5 w-3.5 text-steel-500" />
            </span>
          )}
          <ChevronDown className={cn('h-4 w-4 text-steel-500 transition-transform', open && 'rotate-180')} />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-steel-200 bg-white shadow-lg">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-md border border-steel-200 px-3 py-2 text-sm focus:border-accent focus:outline-none"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto pb-2">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-steel-500">No results</li>
            ) : (
              filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left text-sm hover:bg-steel-50',
                      option.value === value && 'bg-accent/10 font-medium text-accent',
                    )}
                  >
                    {option.label}
                    {option.sublabel && (
                      <span className="ml-1 text-xs text-steel-500">({option.sublabel})</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
