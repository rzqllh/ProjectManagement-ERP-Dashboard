'use client';

import { useState, useMemo } from 'react';
import { TimelineEvent, TimelineEventType } from '@/types/timeline';
import {
    Clock,
    CheckCircle2,
    AlertTriangle,
    FileEdit,
    User,
    Calendar,
    Link as LinkIcon,
    Gavel,
    RefreshCw,
    Filter,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimelinePanelProps {
    events: TimelineEvent[];
    isLoading?: boolean;
    onRefresh?: () => void;
}

// Icon & Color Mapping
const getEventStyle = (type: TimelineEventType) => {
    switch (type) {
        case 'created':
            return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
        case 'status_changed':
            return { icon: RefreshCw, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
        case 'updated':
        case 'next_action_updated':
            return { icon: FileEdit, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
        case 'pic_changed':
            return { icon: User, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
        case 'deadline_changed':
            return { icon: Calendar, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
        case 'escalation_flagged':
            return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
        case 'linked_to_project':
            return { icon: LinkIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
        case 'decision_made':
        case 'decision_updated':
        case 'decision_status_changed':
            return { icon: Gavel, color: 'text-caneris-cyan', bg: 'bg-caneris-cyan/10', border: 'border-caneris-cyan/20' };
        case 'deleted':
            return { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
        default:
            return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };
    }
};

export function TimelinePanel({ events, isLoading, onRefresh }: TimelinePanelProps) {
    const [filter, setFilter] = useState<'all' | 'major'>('all');

    // Filter Logic
    const filteredEvents = useMemo(() => {
        if (filter === 'all') return events;
        return events.filter(e =>
            ['created', 'status_changed', 'escalation_flagged', 'decision_made', 'decision_status_changed'].includes(e.event_type)
        );
    }, [events, filter]);

    // Grouping Logic
    const groupedEvents = useMemo(() => {
        const groups: Record<string, TimelineEvent[]> = {
            'Today': [],
            'Yesterday': [],
            'This Week': [],
            'Older': []
        };

        filteredEvents.forEach(event => {
            const date = new Date(event.event_date);
            if (isToday(date)) {
                groups['Today'].push(event);
            } else if (isYesterday(date)) {
                groups['Yesterday'].push(event);
            } else if (isThisWeek(date)) {
                groups['This Week'].push(event);
            } else {
                groups['Older'].push(event);
            }
        });

        return groups;
    }, [filteredEvents]);

    const activeGroups = Object.entries(groupedEvents).filter(([_, list]) => list.length > 0);

    return (
        <div className="glass-card p-6 rounded-xl h-fit">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">Timeline</h3>
                    <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#94a3b8] font-mono">
                        {filteredEvents.length}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#64748b] hover:text-white">
                                <Filter className="w-3.5 h-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1e293b] border-white/10">
                            <DropdownMenuItem onClick={() => setFilter('all')} className="text-xs text-white hover:bg-white/10 cursor-pointer">
                                Show All Activity
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilter('major')} className="text-xs text-white hover:bg-white/10 cursor-pointer">
                                Major Events Only
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {onRefresh && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#64748b] hover:text-white"
                            onClick={onRefresh}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    )}
                </div>
            </div>

            {/* Timeline Stream */}
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-2.5 before:w-px before:bg-gradient-to-b before:from-white/10 before:to-transparent before:translate-x-0">
                {events.length === 0 ? (
                    <div className="text-xs text-[#64748b] pl-8 py-4">
                        No events recorded yet.
                    </div>
                ) : (
                    activeGroups.map(([label, groupEvents]) => (
                        <div key={label} className="relative">
                            {/* Group Label */}
                            <div className="sticky top-0 z-10 mb-4 pl-8">
                                <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider bg-[#0f172a]/95 px-2 py-1 rounded backdrop-blur-sm border border-white/5">
                                    {label}
                                </span>
                            </div>

                            {/* Events */}
                            <div className="space-y-6">
                                {groupEvents.map((event) => {
                                    const style = getEventStyle(event.event_type);
                                    const Icon = style.icon;

                                    return (
                                        <div key={event.id} className="relative pl-8 group">
                                            {/* Dot/Icon */}
                                            <span className={`absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center border bg-[#0f172a] ${style.border} group-hover:scale-110 transition-transform`}>
                                                <Icon className={`w-3 h-3 ${style.color}`} />
                                            </span>

                                            {/* Content */}
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-baseline justify-between gap-4">
                                                    <span className={`text-xs font-medium text-white/90 group-hover:text-white transition-colors`}>
                                                        {event.description}
                                                    </span>
                                                    <span className="text-[10px] text-[#64748b] font-mono shrink-0 whitespace-nowrap">
                                                        {format(new Date(event.event_date), 'HH:mm')}
                                                    </span>
                                                </div>

                                                {/* Metadata / Extra Details */}
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${style.bg} ${style.border} ${style.color} capitalize`}>
                                                        {event.event_type.replace(/_/g, ' ')}
                                                    </span>

                                                    {event.metadata?.user && (
                                                        <span className="text-[10px] text-[#64748b] flex items-center gap-1">
                                                            by {event.metadata.user === 'system' ? 'System' : event.metadata.user}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Change Diff (Optional: if we have old/new values) */}
                                                {event.metadata?.old && event.metadata?.new && (
                                                    <div className="mt-1 text-[10px] font-mono bg-black/20 p-1.5 rounded border border-white/5 text-[#94a3b8] flex items-center gap-2">
                                                        <span className="line-through opacity-50">{event.metadata.old}</span>
                                                        <ChevronRight className="w-3 h-3 text-[#64748b]" />
                                                        <span className="text-emerald-400/80">{event.metadata.new}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
