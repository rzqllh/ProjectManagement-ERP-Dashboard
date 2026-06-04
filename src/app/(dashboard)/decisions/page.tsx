'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Decision, DecisionStatus, DecisionPriority } from '@/types/decision';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Gavel, Filter, Search, ArrowUpRight, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { DecisionStatusBadge } from '@/components/decisions/DecisionStatusBadge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DecisionForm } from '@/components/decisions/DecisionForm';

// --- Badges ---

function DecisionPriorityBadge({ priority }: { priority: DecisionPriority }) {
    const config = {
        low: { label: 'Low', className: 'text-slate-400 border-slate-500/20' },
        medium: { label: 'Medium', className: 'text-amber-400 border-amber-500/20' },
        high: { label: 'High', className: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
        critical: { label: 'Critical', className: 'text-red-400 border-red-500/20 bg-red-500/10' },
    };
    const c = config[priority] || config['medium'];
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${c.className}`}>
            {c.label}
        </span>
    );
}

export default function DecisionsPage() {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [search, setSearch] = useState('');

    const fetchDecisions = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter !== 'all') params.append('status', statusFilter);
            if (priorityFilter !== 'all') params.append('priority', priorityFilter);

            const res = await fetch(`/api/decisions?${params.toString()}`);
            if (res.ok) {
                const json = await res.json();
                setDecisions(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, priorityFilter]);

    useEffect(() => {
        fetchDecisions();
    }, [fetchDecisions]);

    // Client-side search filtering
    const filteredDecisions = decisions.filter(d =>
        d.title.toLowerCase().includes(search.toLowerCase()) ||
        d.context.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/decisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                setIsCreateOpen(false);
                fetchDecisions();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-3">
                        <Gavel className="w-6 h-6 text-caneris-cyan" />
                        Decision Board
                    </h1>
                    <p className="text-sm text-[#94a3b8] mt-1">
                        Centralized log of all architectural and project decisions.
                    </p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90">
                            <Plus className="w-4 h-4 mr-2" />
                            Log Decision
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1e293b] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DecisionForm
                            onSubmit={handleCreateSubmit}
                            onCancel={() => setIsCreateOpen(false)}
                        // Fetch standard lists if needed, passing empty for now or implement fetching hook
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Toolbar */}
            <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full md:w-auto text-[#94a3b8]">
                    <Search className="w-4 h-4" />
                    <Input
                        placeholder="Search decisions..."
                        className="bg-transparent border-none h-8 w-full md:w-64 focus-visible:ring-0 px-0 placeholder:text-[#64748b]"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/10">
                        <Filter className="w-3.5 h-3.5 text-[#64748b]" />
                        <span className="text-xs text-[#94a3b8] font-mono uppercase">Filter</span>
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] h-9 bg-black/20 border-white/10 text-xs">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="proposed">Proposed</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="implemented">Implemented</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[140px] h-9 bg-black/20 border-white/10 text-xs">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="p-12 text-center text-[#64748b]">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-caneris-cyan" />
                    Loading decisions...
                </div>
            ) : filteredDecisions.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-xl text-center text-[#64748b]">
                    No decisions found matching your filters.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDecisions.map(decision => (
                        <div key={decision.id} className="glass-card p-5 rounded-xl border border-white/5 hover:border-caneris-cyan/30 transition-all hover:translate-y-[-2px] group relative">
                            {/* Link overlay */}
                            <Link href={`/decisions/${decision.id}`} className="absolute inset-0 z-0" />

                            <div className="relative z-10 pointer-events-none">
                                <div className="flex justify-between items-center mb-3">
                                    <DecisionStatusBadge status={decision.status} />
                                    <span className="text-[10px] text-[#64748b] font-mono flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {format(new Date(decision.created_at), 'MMM d')}
                                    </span>
                                </div>

                                <h3 className="text-base font-semibold text-white mb-2 line-clamp-2 leading-snug group-hover:text-caneris-cyan transition-colors">
                                    {decision.title}
                                </h3>

                                <div className="mb-2">
                                    <span className="text-[10px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded capitalize">
                                        {decision.decision_type}
                                    </span>
                                </div>

                                <p className="text-xs text-[#94a3b8] line-clamp-3 mb-4 min-h-[3rem]">
                                    {decision.context}
                                </p>

                                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                                    <DecisionPriorityBadge priority={decision.priority} />
                                    <div className="flex items-center gap-1 text-[10px] text-caneris-cyan font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Details <ArrowUpRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

