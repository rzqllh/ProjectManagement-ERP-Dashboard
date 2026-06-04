import { NdStatus } from '@/types/nd';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<NdStatus, { label: string; className: string }> = {
    'drafting': {
        label: 'Drafting',
        className: 'text-slate-500 bg-slate-500/10 border-slate-500/20'
    },
    'waiting_internal': {
        label: 'Waiting Internal',
        className: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    'waiting_external': {
        label: 'Waiting External',
        className: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    'issued': {
        label: 'Issued',
        className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    'clear': {
        label: 'Clear',
        className: 'text-teal-400 bg-teal-500/10 border-teal-500/20'
    },
    'escalated': {
        label: 'Escalated',
        className: 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse'
    }
};

export function NdStatusBadge({ status, className }: { status: NdStatus | string; className?: string }) {
    const config = STATUS_CONFIG[status as NdStatus] || { label: status, className: 'text-gray-500 bg-gray-500/10' };

    return (
        <span className={cn(
            "px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-mono font-medium border",
            config.className,
            className
        )}>
            {config.label}
        </span>
    );
}
