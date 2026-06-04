'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Stakeholder } from '@/types/stakeholder';
import { Input } from '@/components/ui/input';
import { Users, Loader2, Building2, X } from 'lucide-react';

interface StakeholderComboboxProps {
    /** Current display value (name string) */
    value: string;
    /** Called when the user types or selects */
    onValueChange: (name: string, stakeholderId?: string) => void;
    placeholder?: string;
    required?: boolean;
    className?: string;
    id?: string;
}

/**
 * Combobox that searches stakeholders by name.
 * On selection: sets both display name and stakeholder FK.
 * Allows freetext if no stakeholder matches (backward compat).
 */
export function StakeholderCombobox({
    value,
    onValueChange,
    placeholder = 'Search stakeholder or type name...',
    required = false,
    className = '',
    id,
}: StakeholderComboboxProps) {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<Stakeholder[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

    // Sync external value changes
    useEffect(() => {
        setQuery(value);
    }, [value]);

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Search stakeholders
    const search = useCallback(async (q: string) => {
        if (q.length < 2) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/stakeholders?search=${encodeURIComponent(q)}`);
            if (res.ok) {
                const json = await res.json();
                setResults(json.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        setSelectedId(undefined);
        onValueChange(val, undefined); // Clear FK on manual type

        // Debounced search
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            search(val);
            if (val.length >= 2) setIsOpen(true);
        }, 300);
    };

    const handleSelect = (stakeholder: Stakeholder) => {
        setQuery(stakeholder.name);
        setSelectedId(stakeholder.id);
        setIsOpen(false);
        onValueChange(stakeholder.name, stakeholder.id);
    };

    const handleClear = () => {
        setQuery('');
        setSelectedId(undefined);
        setResults([]);
        onValueChange('', undefined);
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-[#64748b]" />
                <Input
                    id={id}
                    placeholder={placeholder}
                    className={`pl-9 pr-8 bg-[#0f172a]/50 border-white/10 ${selectedId ? 'border-caneris-cyan/30' : ''} ${className}`}
                    value={query}
                    onChange={handleInputChange}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                    required={required}
                    autoComplete="off"
                />
                {query && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748b] hover:text-white"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Selected indicator */}
            {selectedId && (
                <div className="text-[10px] text-caneris-cyan font-mono mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-caneris-cyan" />
                    Linked to stakeholder
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl max-h-[200px] overflow-y-auto">
                    {loading ? (
                        <div className="p-3 text-center text-[#64748b] text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Searching...
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-3 text-center text-[#4b5563] text-xs">
                            No matching stakeholders. Name will be saved as text.
                        </div>
                    ) : (
                        results.map(s => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => handleSelect(s)}
                                className="w-full text-left p-2.5 hover:bg-white/5 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                            >
                                <div className="w-7 h-7 rounded-md bg-caneris-cyan/10 flex items-center justify-center shrink-0">
                                    <span className="text-[10px] font-bold text-caneris-cyan">
                                        {s.name.charAt(0)}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white truncate">{s.name}</div>
                                    <div className="text-[10px] text-[#64748b] flex items-center gap-1 truncate">
                                        <Building2 className="w-2.5 h-2.5" />
                                        {s.organization} — {s.role}
                                    </div>
                                </div>
                                <span className="text-[9px] font-mono text-[#4b5563] uppercase px-1.5 py-0.5 rounded bg-white/5 shrink-0">
                                    {s.category}
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
