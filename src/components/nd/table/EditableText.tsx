"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Loader2, PenLine } from "lucide-react";

interface EditableTextProps {
    value: string;
    onUpdate: (newValue: string) => Promise<void>;
    placeholder?: string;
    multiline?: boolean;
    className?: string;
}

export function EditableText({
    value,
    onUpdate,
    placeholder = "Click to edit...",
    multiline = false,
    className = ""
}: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const [submitting, setSubmitting] = useState(false);
    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setDraft(value);
    }, [value]);

    // Handle outside click to save/cancel
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
                if (isEditing) {
                    save(); // Auto-save on blur-like behavior
                }
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isEditing, draft]); // eslint-disable-line react-hooks/exhaustive-deps

    const save = async () => {
        if (draft === value) {
            setIsEditing(false);
            return;
        }

        setSubmitting(true);
        try {
            await onUpdate(draft);
            setIsEditing(false);
        } catch (e) {
            console.error(e);
            // Keep editing on error? Or revert? keeping editing usually better UX
        } finally {
            setSubmitting(false);
        }
    };

    const cancel = () => {
        setDraft(value);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) { // Allow Shift+Enter for newline in textarea
            e.preventDefault();
            save();
        }
        if (e.key === "Escape") {
            cancel();
        }
    };

    if (isEditing) {
        return (
            <div ref={componentRef} className="relative group min-w-[120px]">
                {multiline ? (
                    <Textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[60px] text-xs resize-y bg-[#0f1014] border-caneris-cyan/50 focus:border-caneris-cyan p-2 pr-8"
                        autoFocus
                    />
                ) : (
                    <Input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="h-8 text-xs bg-[#0f1014] border-caneris-cyan/50 focus:border-caneris-cyan pr-8"
                        autoFocus
                    />
                )}

                <div className="absolute right-1 top-1 flex flex-col gap-1">
                    {submitting ? (
                        <Loader2 className="w-3 h-3 animate-spin text-caneris-cyan" />
                    ) : (
                        <button
                            onClick={(e) => { e.stopPropagation(); save(); }}
                            className="p-1 hover:bg-caneris-cyan/20 rounded text-caneris-cyan"
                            title="Save (Enter)"
                        >
                            <Check className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className={`group/edit cursor-text relative min-h-[24px] flex items-center hover:bg-white/[0.03] rounded px-1.5 -mx-1.5 transition-colors ${className}`}
        >
            <p className={`text-xs ${!value ? 'text-white/30 italic' : 'text-white/90'} line-clamp-2 break-words w-full`}>
                {value || placeholder}
            </p>
            <PenLine className="w-3 h-3 text-white/10 opacity-0 group-hover/edit:opacity-100 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
    );
}
