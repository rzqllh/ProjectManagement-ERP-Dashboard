'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { EditableStatus } from '@/components/nd/table/EditableStatus';
import { EditableText } from '@/components/nd/table/EditableText';
import { NdStatusBadge } from '@/components/nd/NdStatusBadge';
import { NdCategoryBadge } from '@/components/nd/NdCategoryBadge';
import { NdeRecord, NdStatus } from '@/types/nd';
import {
    Search, Plus, RefreshCw, LayoutGrid, List, Table2,
    Rows3, Columns3, ArrowUpDown, Calendar, User, Send,
    Target, AlertTriangle, CheckCircle2, Clock, FileText
} from 'lucide-react';

import { getAge, getEscalationStatus, getDeadlineInfo, getActionProgress, getRelativeTime } from '@/lib/nd-utils';

// --- Types ---
type ViewMode = 'grid' | 'table' | 'list' | 'compact' | 'kanban';
type SortOption = 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'status_clear' | 'status_active' | 'deadline_soon' | 'age_desc' | 'escalation_desc';

const VIEW_MODES: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'grid', label: 'Grid', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { key: 'table', label: 'Table', icon: <Table2 className="w-3.5 h-3.5" /> },
    { key: 'list', label: 'List', icon: <List className="w-3.5 h-3.5" /> },
    { key: 'compact', label: 'Compact', icon: <Rows3 className="w-3.5 h-3.5" /> },
    { key: 'kanban', label: 'Board', icon: <Columns3 className="w-3.5 h-3.5" /> },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
    { key: 'newest', label: 'Newest First' },
    { key: 'oldest', label: 'Oldest First' },
    { key: 'age_desc', label: 'Oldest (Age)' },
    { key: 'escalation_desc', label: 'Highest Risk' },
    { key: 'deadline_soon', label: 'Deadline Soon' },
    { key: 'name_asc', label: 'Name A-Z' },
    { key: 'name_desc', label: 'Name Z-A' },
    { key: 'status_active', label: 'Active First' },
    { key: 'status_clear', label: 'Clear First' },
];

const STATUS_ORDER: Record<string, number> = {
    escalated: 0,
    waiting_external: 1,
    waiting_internal: 2,
    drafting: 3,
    issued: 4,
    clear: 5,
};

// --- Main Component ---
export default function NdListingPage() {
    const router = useRouter();
    const [nds, setNds] = useState<NdeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [sortOpen, setSortOpen] = useState(false);

    const fetchNds = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            const res = await fetch(`/api/nd?${params.toString()}`);
            if (res.ok) {
                const json = await res.json();
                setNds(json.data);
            }
        } catch (error) {
            console.error('Failed to fetch NDs:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => { fetchNds(); }, [fetchNds]);

    const handleUpdate = async (id: string, data: Partial<NdeRecord>) => {
        setNds(prev => prev.map(n => n.id === id ? { ...n, ...data } : n));
        try {
            const res = await fetch(`/api/nd/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error("Update failed");
        } catch (error) {
            console.error(error);
            fetchNds();
        }
    };

    // Filter + Sort
    const processedNds = useMemo(() => {
        let result = nds.filter(nd =>
            nd.title.toLowerCase().includes(search.toLowerCase()) ||
            nd.nd_number.toLowerCase().includes(search.toLowerCase()) ||
            nd.pic.toLowerCase().includes(search.toLowerCase())
        );

        // Sort
        result = [...result].sort((a, b) => {
            switch (sortBy) {
                case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                case 'oldest': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'age_desc': return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'escalation_desc': {
                    const riskA = getEscalationStatus(a).level === 'escalated' ? 2 : getEscalationStatus(a).level === 'risk' ? 1 : 0;
                    const riskB = getEscalationStatus(b).level === 'escalated' ? 2 : getEscalationStatus(b).level === 'risk' ? 1 : 0;
                    return riskB - riskA;
                }
                case 'name_asc': return a.title.localeCompare(b.title);
                case 'name_desc': return b.title.localeCompare(a.title);
                case 'status_clear': return (STATUS_ORDER[b.status] ?? 99) - (STATUS_ORDER[a.status] ?? 99);
                case 'status_active': return (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
                case 'deadline_soon': {
                    const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
                    const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
                    return da - db;
                }
                default: return 0;
            }
        });

        return result;
    }, [nds, search, sortBy]);

    const statuses: NdStatus[] = ['drafting', 'waiting_internal', 'waiting_external', 'issued', 'escalated', 'clear'];

    return (
        <div className="space-y-5 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-1">
                        ND Records
                    </h1>
                    <p className="text-xs text-[#94a3b8] font-mono">
                        Manage Nota Dinas lifecycle and tracking &middot; {nds.length} records
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-mono" onClick={fetchNds}>
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                        REFRESH
                    </Button>
                    <Link href="/nd/new">
                        <Button size="sm" className="h-9 gap-2 bg-caneris-cyan text-black hover:bg-caneris-cyan/90 font-bold border-0">
                            <Plus className="w-4 h-4" />
                            NEW RECORD
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Toolbar: Search + Status Filter + View Mode + Sort */}
            <div className="glass-card p-4 rounded-xl space-y-4">
                {/* Row 1: Search + View/Sort controls */}
                <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
                    <div className="relative w-full lg:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                        <Input
                            placeholder="Search ND number, title, or PIC..."
                            className="pl-9 h-9 text-xs font-mono bg-[#0f172a]/50 border-white/10 focus:border-caneris-cyan/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Switcher */}
                        <div className="flex items-center bg-[#0f172a]/60 rounded-lg border border-white/5 p-0.5">
                            {VIEW_MODES.map(v => (
                                <button
                                    key={v.key}
                                    onClick={() => setViewMode(v.key)}
                                    title={v.label}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all ${viewMode === v.key
                                        ? 'bg-white/10 text-white shadow-sm'
                                        : 'text-[#64748b] hover:text-[#94a3b8]'
                                        }`}
                                >
                                    {v.icon}
                                    <span className="hidden sm:inline">{v.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setSortOpen(!sortOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0f172a]/60 border border-white/5 text-[10px] font-mono uppercase tracking-wider text-[#94a3b8] hover:text-white transition-colors"
                            >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                                {SORT_OPTIONS.find(s => s.key === sortBy)?.label}
                            </button>
                            {sortOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                                    <div className="absolute right-0 top-full mt-1 z-50 bg-[#1e293b] border border-white/10 rounded-lg shadow-xl py-1 min-w-[200px]">
                                        {SORT_OPTIONS.map(s => (
                                            <button
                                                key={s.key}
                                                onClick={() => { setSortBy(s.key); setSortOpen(false); }}
                                                className={`w-full text-left px-3 py-2 text-xs transition-colors ${sortBy === s.key
                                                    ? 'text-caneris-cyan bg-caneris-cyan/10'
                                                    : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
                                                    }`}
                                            >
                                                {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Row 2: Status filter pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-mono whitespace-nowrap transition-colors border ${statusFilter === 'all'
                            ? 'bg-white text-black border-white font-bold'
                            : 'bg-transparent text-[#94a3b8] border-white/10 hover:border-white/30'
                            }`}
                    >
                        ALL ({nds.length})
                    </button>
                    {statuses.map(status => {
                        const count = nds.filter(n => n.status === status).length;
                        return (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-mono whitespace-nowrap transition-colors border ${statusFilter === status
                                    ? 'bg-white/10 text-white border-white/30 font-bold'
                                    : 'bg-transparent text-[#94a3b8] border-white/10 hover:border-white/30'
                                    }`}
                            >
                                {status.replace('_', ' ').toUpperCase()} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            {loading && processedNds.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center text-xs text-[#64748b]">
                    <RefreshCw className="w-5 h-5 mx-auto mb-3 animate-spin text-caneris-cyan/50" />
                    Scanning records...
                </div>
            ) : processedNds.length === 0 ? (
                <div className="glass-card rounded-xl p-12 text-center">
                    <FileText className="w-8 h-8 mx-auto mb-3 text-[#334155]" />
                    <p className="text-sm text-[#64748b]">No records found</p>
                    <p className="text-xs text-[#475569] mt-1">Try adjusting your search or filters</p>
                </div>
            ) : (
                <>
                    {viewMode === 'grid' && <GridView nds={processedNds} onNavigate={(id) => router.push(`/nd/${id}`)} />}
                    {viewMode === 'table' && <TableView nds={processedNds} onNavigate={(id) => router.push(`/nd/${id}`)} onUpdate={handleUpdate} />}
                    {viewMode === 'list' && <ListView nds={processedNds} onNavigate={(id) => router.push(`/nd/${id}`)} />}
                    {viewMode === 'compact' && <CompactView nds={processedNds} onNavigate={(id) => router.push(`/nd/${id}`)} />}
                    {viewMode === 'kanban' && <KanbanView nds={processedNds} onNavigate={(id) => router.push(`/nd/${id}`)} />}
                </>
            )}
        </div>
    );
}

// ========================================================================
// VIEW COMPONENTS
// ========================================================================

interface ViewProps {
    nds: NdeRecord[];
    onNavigate: (id: string) => void;
    onUpdate?: (id: string, data: Partial<NdeRecord>) => Promise<void>;
}

// --- GRID VIEW (Default) ---
function GridView({ nds, onNavigate }: ViewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {nds.map(nd => {
                const deadline = getDeadlineInfo(nd.deadline);
                const progress = getActionProgress(nd.next_action);
                const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
                const age = getAge(nd.created_at);
                const risk = getEscalationStatus(nd);

                return (
                    <div
                        key={nd.id}
                        onClick={() => onNavigate(nd.id)}
                        className={`glass-card rounded-xl p-5 cursor-pointer group hover:bg-white/[0.04] transition-all hover:border-white/10 border space-y-4 relative overflow-hidden ${risk.level === 'escalated' ? 'border-red-500/30' :
                            risk.level === 'risk' ? 'border-amber-500/30' : 'border-transparent'
                            }`}
                    >
                        {/* Risk Indicator Strip */}
                        {risk.level !== 'none' && (
                            <div className={`absolute top-0 left-0 w-1 h-full ${risk.level === 'escalated' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                                }`} />
                        )}

                        {/* Top: ND Number + Status */}
                        <div className="flex items-start justify-between">
                            <div>
                                <span className="font-mono text-xs text-caneris-cyan font-medium group-hover:underline">
                                    {nd.nd_number}
                                </span>
                                <p className="text-sm font-semibold text-white mt-1 leading-snug line-clamp-2">
                                    {nd.title}
                                </p>
                            </div>
                            <NdStatusBadge status={nd.status} />
                        </div>

                        {/* Category + Risk/Age Badge */}
                        <div className="flex items-center gap-2">
                            <NdCategoryBadge category={nd.category} />
                            {risk.level !== 'none' && (
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${risk.level === 'escalated' ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                                    }`}>
                                    {risk.label}
                                </span>
                            )}
                        </div>

                        {/* Meta Row */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="flex items-center gap-1.5 text-[#94a3b8]">
                                <Target className="w-3 h-3 text-[#64748b]" />
                                <span className="truncate">{nd.pic.split('\n')[0]}</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${deadline.urgent ? 'text-red-400' : 'text-[#94a3b8]'}`}>
                                <Calendar className="w-3 h-3 text-[#64748b]" />
                                <span>{deadline.label}</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        {progress.total > 0 && (
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b]">
                                    <span>Actions</span>
                                    <span>{progress.done}/{progress.total} ({progressPct}%)</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-caneris-cyan rounded-full transition-all"
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-[10px] text-[#4b5563] font-mono pt-2 border-t border-white/5">
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                {age.label} old
                            </span>
                            <div className="flex items-center gap-1">
                                <Send className="w-2.5 h-2.5" />
                                <span>{nd.receiver.split('\n').filter(r => r.trim()).length} receivers</span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// --- TABLE VIEW ---
function TableView({ nds, onNavigate, onUpdate }: ViewProps) {
    return (
        <div className="glass-card rounded-xl overflow-hidden">
            <Table>
                <TableHeader className="bg-white/[0.02]">
                    <TableRow className="hover:bg-transparent border-white/5">
                        <TableHead className="w-[180px] text-[10px] font-mono uppercase tracking-wider text-[#64748b]">ND Number</TableHead>
                        <TableHead className="text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Title</TableHead>
                        <TableHead className="w-[80px] text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Age</TableHead>
                        <TableHead className="w-[140px] text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Status</TableHead>
                        <TableHead className="w-[180px] text-[10px] font-mono uppercase tracking-wider text-[#64748b]">PIC</TableHead>
                        <TableHead className="w-[120px] text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Next Action</TableHead>
                        <TableHead className="w-[120px] text-[10px] font-mono uppercase tracking-wider text-[#64748b]">Deadline</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {nds.map(nd => {
                        const deadline = getDeadlineInfo(nd.deadline);
                        const age = getAge(nd.created_at);
                        const risk = getEscalationStatus(nd);

                        return (
                            <TableRow
                                key={nd.id}
                                className={`hover:bg-white/[0.02] border-white/5 transition-colors ${risk.level !== 'none' ? 'bg-red-500/[0.02]' : ''}`}
                            >
                                <TableCell
                                    className="font-mono text-xs font-medium text-caneris-cyan hover:underline cursor-pointer"
                                    onClick={() => onNavigate(nd.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        {risk.level !== 'none' && (
                                            <AlertTriangle className={`w-3 h-3 ${risk.level === 'escalated' ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
                                        )}
                                        {nd.nd_number}
                                    </div>
                                </TableCell>
                                <TableCell onClick={() => onNavigate(nd.id)} className="cursor-pointer">
                                    <span className="text-sm font-medium text-white line-clamp-1">{nd.title}</span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-mono text-[#94a3b8]">{age.label}</span>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col gap-1">
                                        {onUpdate ? (
                                            <EditableStatus
                                                status={nd.status}
                                                onUpdate={(s) => onUpdate(nd.id, { status: s })}
                                            />
                                        ) : (
                                            <NdStatusBadge status={nd.status} />
                                        )}
                                        {risk.level !== 'none' && (
                                            <span className={`text-[9px] font-mono uppercase ${risk.level === 'escalated' ? 'text-red-400' : 'text-amber-400'}`}>
                                                {risk.label}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-xs">
                                    {onUpdate ? (
                                        <EditableText
                                            value={nd.pic}
                                            onUpdate={(v) => onUpdate(nd.id, { pic: v })}
                                            placeholder="Unassigned"
                                        />
                                    ) : (
                                        <span className="text-[#cbd5e1]">{nd.pic.split('\n')[0]}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-xs">
                                    {onUpdate ? (
                                        <EditableText
                                            value={nd.next_action || ""}
                                            onUpdate={(v) => onUpdate(nd.id, { next_action: v })}
                                            placeholder="Add action..."
                                            multiline={true}
                                        />
                                    ) : (
                                        <span className="text-[#64748b] truncate block max-w-[150px]">{nd.next_action}</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className={`text-xs font-mono ${deadline.urgent ? 'text-red-400' : 'text-[#94a3b8]'}`}>
                                        {deadline.label}
                                    </span>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

// --- LIST VIEW ---
function ListView({ nds, onNavigate }: ViewProps) {
    return (
        <div className="space-y-3">
            {nds.map(nd => {
                const deadline = getDeadlineInfo(nd.deadline);
                const progress = getActionProgress(nd.next_action);
                const progressPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
                const age = getAge(nd.created_at);
                const risk = getEscalationStatus(nd);

                return (
                    <div
                        key={nd.id}
                        onClick={() => onNavigate(nd.id)}
                        className={`glass-card rounded-xl p-5 cursor-pointer hover:bg-white/[0.04] transition-all border group relative overflow-hidden ${risk.level === 'escalated' ? 'border-red-500/30' :
                            risk.level === 'risk' ? 'border-amber-500/30' : 'border-transparent hover:border-white/10'
                            }`}
                    >
                        {risk.level !== 'none' && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${risk.level === 'escalated' ? 'bg-red-500' : 'bg-amber-500'}`} />
                        )}

                        <div className="flex items-start gap-6 pl-2">
                            {/* Left: Info */}
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="font-mono text-xs text-caneris-cyan font-medium group-hover:underline shrink-0">
                                        {nd.nd_number}
                                    </span>
                                    <NdStatusBadge status={nd.status} />
                                    {risk.level !== 'none' && (
                                        <span className={`text-[10px] font-mono font-bold ${risk.level === 'escalated' ? 'text-red-400' : 'text-amber-400'}`}>
                                            ⚠ {risk.label}
                                        </span>
                                    )}
                                    <NdCategoryBadge category={nd.category} />
                                </div>
                                <h3 className="text-sm font-semibold text-white leading-snug">
                                    {nd.title}
                                </h3>
                                <div className="flex items-center gap-6 text-xs text-[#94a3b8] flex-wrap">
                                    <div className="flex items-center gap-1.5">
                                        <User className="w-3 h-3 text-[#64748b]" />
                                        <span>{nd.sender}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Target className="w-3 h-3 text-[#64748b]" />
                                        <span>{nd.pic.split('\n')[0]}</span>
                                    </div>
                                    <div className={`flex items-center gap-1.5 ${deadline.urgent ? 'text-red-400' : ''}`}>
                                        <Calendar className="w-3 h-3 text-[#64748b]" />
                                        <span>{deadline.label}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[#64748b]">
                                        <Clock className="w-3 h-3" />
                                        <span>{age.label} old</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Progress */}
                            {progress.total > 0 && (
                                <div className="shrink-0 flex flex-col items-end gap-1">
                                    <span className="text-[10px] font-mono text-[#64748b]">{progress.done}/{progress.total}</span>
                                    <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-caneris-cyan rounded-full" style={{ width: `${progressPct}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// --- COMPACT VIEW ---
function CompactView({ nds, onNavigate }: ViewProps) {
    return (
        <div className="glass-card rounded-xl overflow-hidden divide-y divide-white/5">
            {nds.map(nd => {
                const deadline = getDeadlineInfo(nd.deadline);
                const age = getAge(nd.created_at);
                const risk = getEscalationStatus(nd);

                return (
                    <div
                        key={nd.id}
                        onClick={() => onNavigate(nd.id)}
                        className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-white/[0.03] transition-colors group border-l-2 ${risk.level === 'escalated' ? 'border-l-red-500' :
                            risk.level === 'risk' ? 'border-l-amber-500' : 'border-l-transparent'
                            }`}
                    >
                        <NdStatusBadge status={nd.status} />
                        <span className="font-mono text-[11px] text-caneris-cyan font-medium group-hover:underline shrink-0 w-[200px] truncate">
                            {nd.nd_number}
                        </span>
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                            <span className="text-sm text-white truncate">{nd.title}</span>
                            {risk.level !== 'none' && (
                                <AlertTriangle className={`w-3 h-3 ${risk.level === 'escalated' ? 'text-red-500' : 'text-amber-500'}`} />
                            )}
                        </div>
                        <span className="text-xs text-[#94a3b8] shrink-0 w-[60px] font-mono text-right">{age.label}</span>
                        <span className={`text-xs font-mono shrink-0 w-[90px] text-right ${deadline.urgent ? 'text-red-400' : 'text-[#64748b]'}`}>
                            {deadline.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// --- KANBAN VIEW ---
function KanbanView({ nds, onNavigate }: ViewProps) {
    const columns: { status: NdStatus; label: string; color: string }[] = [
        { status: 'drafting', label: 'Drafting', color: 'border-slate-500' },
        { status: 'waiting_internal', label: 'Waiting Internal', color: 'border-blue-500' },
        { status: 'waiting_external', label: 'Waiting External', color: 'border-amber-500' },
        { status: 'issued', label: 'Issued', color: 'border-emerald-500' },
        { status: 'escalated', label: 'Escalated', color: 'border-rose-500' },
        { status: 'clear', label: 'Clear', color: 'border-teal-500' },
    ];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4">
            {columns.map(col => {
                const colNds = nds.filter(nd => nd.status === col.status);
                return (
                    <div key={col.status} className="min-w-[280px] w-[280px] shrink-0">
                        <div className={`glass-card rounded-t-xl p-3 border-t-2 ${col.color}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono uppercase tracking-wider text-[#94a3b8]">
                                    {col.label}
                                </span>
                                <span className="text-[10px] font-mono bg-white/5 px-2 py-0.5 rounded-full text-[#64748b]">
                                    {colNds.length}
                                </span>
                            </div>
                        </div>
                        <div className="glass-card rounded-b-xl p-2 space-y-2 min-h-[200px]">
                            {colNds.length === 0 ? (
                                <div className="p-4 text-center text-[10px] text-[#334155]">Empty</div>
                            ) : (
                                colNds.map(nd => {
                                    const deadline = getDeadlineInfo(nd.deadline);
                                    return (
                                        <div
                                            key={nd.id}
                                            onClick={() => onNavigate(nd.id)}
                                            className="p-3 bg-white/[0.02] rounded-lg cursor-pointer hover:bg-white/[0.06] border border-transparent hover:border-white/10 transition-all group space-y-2"
                                        >
                                            <span className="font-mono text-[10px] text-caneris-cyan group-hover:underline">
                                                {nd.nd_number}
                                            </span>
                                            <p className="text-xs font-medium text-white leading-snug line-clamp-2">
                                                {nd.title}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] text-[#64748b]">
                                                <span className="truncate max-w-[120px]">{nd.pic.split('\n')[0]}</span>
                                                <span className={deadline.urgent ? 'text-red-400' : ''}>{deadline.label}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
