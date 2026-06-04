"use client";

import { useState } from "react";
import { NdStatus } from "@/types/nd";
import { NdStatusBadge } from "../NdStatusBadge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";

interface EditableStatusProps {
    status: NdStatus;
    onUpdate: (newStatus: NdStatus) => Promise<void>;
}

const STATUS_OPTIONS: NdStatus[] = [
    'drafting',
    'waiting_internal',
    'waiting_external',
    'issued',
    'escalated',
    'clear'
];

export function EditableStatus({ status, onUpdate }: EditableStatusProps) {
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    const handleSelect = async (newStatus: NdStatus) => {
        if (newStatus === status) return;

        setLoading(true);
        setOpen(false); // Close immediately for responsiveness
        try {
            await onUpdate(newStatus);
        } catch (error) {
            console.error("Failed to update status", error);
            // Ideally revert UI or show toast here, but for now simple error logging
        } finally {
            setLoading(false);
        }
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <button
                    className="flex items-center gap-1 hover:bg-white/5 rounded px-1 -ml-1 transition-colors outline-none focus:ring-1 focus:ring-caneris-cyan/50"
                    disabled={loading}
                >
                    <div className={loading ? "opacity-50" : ""}>
                        <NdStatusBadge status={status} />
                    </div>
                    {loading ? (
                        <Loader2 className="w-3 h-3 animate-spin text-white/50" />
                    ) : (
                        <ChevronDown className="w-3 h-3 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px] bg-[#1e293b] border-white/10">
                {STATUS_OPTIONS.map((s) => (
                    <DropdownMenuItem
                        key={s}
                        onClick={() => handleSelect(s)}
                        className="text-xs font-mono uppercase tracking-wide text-white hover:bg-white/10 cursor-pointer flex items-center justify-between"
                    >
                        {s.replace('_', ' ')}
                        {s === status && <span className="text-caneris-cyan text-[10px]">●</span>}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
