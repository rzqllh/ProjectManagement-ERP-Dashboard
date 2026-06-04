'use client';

import { useState, useEffect, useCallback } from 'react';
import { Decision, DecisionStatus, DecisionPriority, DecisionType } from '@/types/decision';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Gavel, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { DecisionStatusBadge } from '@/components/decisions/DecisionStatusBadge';

// --- Badges ---

function DecisionPriorityBadge({ priority }: { priority: DecisionPriority }) {
    const config = {
        low: { label: 'Low Impact', className: 'text-slate-400 border-slate-500/20' },
        medium: { label: 'Medium Impact', className: 'text-amber-400 border-amber-500/20' },
        high: { label: 'High Impact', className: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
        critical: { label: 'Critical', className: 'text-red-400 border-red-500/20 bg-red-500/10' },
    };
    const c = config[priority] || config['medium'];
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${c.className}`}>
            {c.label}
        </span>
    );
}

// --- Component ---

export function DecisionPanel({ ndId }: { ndId: string }) {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newContext, setNewContext] = useState('');
    const [newPriority, setNewPriority] = useState<DecisionPriority>('medium');
    const [newType, setNewType] = useState<DecisionType>('technical');
    const [submitting, setSubmitting] = useState(false);

    const fetchDecisions = useCallback(async () => {
        try {
            // Use the standard API with filter
            const res = await fetch(`/api/decisions?nd_id=${ndId}`);
            if (res.ok) {
                const json = await res.json();
                setDecisions(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [ndId]);

    useEffect(() => {
        fetchDecisions();
    }, [fetchDecisions]);

    const handleCreate = async () => {
        if (!newTitle || !newContext) return;
        setSubmitting(true);
        try {
            const res = await fetch('/api/decisions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    related_nd_id: ndId,
                    title: newTitle,
                    context: newContext,
                    priority: newPriority,
                    decision_type: newType,
                    status: 'proposed',
                    pic: 'System User', // Default for quick add
                    tags: [],
                    attachment_links: []
                })
            });
            if (res.ok) {
                setNewTitle('');
                setNewContext('');
                setNewPriority('medium');
                setNewType('technical');
                setIsCreateOpen(false);
                fetchDecisions();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (id: string, status: DecisionStatus) => {
        // Optimistic update
        setDecisions(prev => prev.map(d => d.id === id ? { ...d, status } : d));
        try {
            await fetch(`/api/decisions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
        } catch (e) {
            console.error(e);
            fetchDecisions(); // Revert
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this decision log?')) return;
        setDecisions(prev => prev.filter(d => d.id !== id));
        try {
            await fetch(`/api/decisions/${id}`, { method: 'DELETE' });
        } catch (e) {
            console.error(e);
            fetchDecisions();
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-caneris-cyan" />
                        Decision Log
                    </h3>
                    <p className="text-xs text-[#94a3b8]">Track key decisions, approvals, and rejections.</p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90">
                            <Plus className="w-4 h-4 mr-2" />
                            Log Decision
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1e293b] border-white/10 text-white">
                        <DialogHeader>
                            <DialogTitle>Log New Decision</DialogTitle>
                            <DialogDescription>Record a key decision for this ND.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-[#94a3b8]">Title</label>
                                <Input
                                    placeholder="e.g. Adopt Next.js for Frontend"
                                    className="bg-black/20 border-white/10"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-[#94a3b8]">Context & Reasoning</label>
                                <Textarea
                                    placeholder="Why is this decision being made?"
                                    className="bg-black/20 border-white/10 min-h-[100px]"
                                    value={newContext}
                                    onChange={e => setNewContext(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-[#94a3b8]">Decision Type</label>
                                <Select value={newType} onValueChange={(v: any) => setNewType(v)}>
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                        <SelectItem value="technical">Technical</SelectItem>
                                        <SelectItem value="commercial">Commercial</SelectItem>
                                        <SelectItem value="governance">Governance</SelectItem>
                                        <SelectItem value="risk">Risk</SelectItem>
                                        <SelectItem value="strategic">Strategic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-mono text-[#94a3b8]">Priority / Impact</label>
                                <Select value={newPriority} onValueChange={(v: any) => setNewPriority(v)}>
                                    <SelectTrigger className="bg-black/20 border-white/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button
                                className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90"
                                onClick={handleCreate}
                                disabled={submitting}
                            >
                                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Log Decision
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {loading ? (
                <div className="p-8 text-center text-[#64748b]">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                    Loading decisions...
                </div>
            ) : decisions.length === 0 ? (
                <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-[#64748b]">
                    No decisions logged yet.
                </div>
            ) : (
                <div className="grid gap-3">
                    {decisions.map(decision => (
                        <div key={decision.id} className="glass-card p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <DecisionStatusBadge status={decision.status} />
                                        <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-purple-500/20 text-purple-400 capitalize bg-purple-500/5">
                                            {decision.decision_type}
                                        </span>
                                        <DecisionPriorityBadge priority={decision.priority} />
                                        <span className="text-[10px] font-mono text-[#64748b]">
                                            {format(new Date(decision.created_at), 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                    <h4 className="text-base font-semibold text-white">{decision.title}</h4>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-[#64748b] hover:text-red-400"
                                        onClick={() => handleDelete(decision.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            <p className="text-sm text-[#94a3b8] mt-2 leading-relaxed whitespace-pre-wrap">
                                {decision.context}
                            </p>

                            {/* Action Bar for Proposed Decisions */}
                            {decision.status === 'proposed' && (
                                <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                                        onClick={() => handleStatusUpdate(decision.id, 'approved')}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                                        Approve
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="h-7 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                        onClick={() => handleStatusUpdate(decision.id, 'rejected')}
                                    >
                                        <XCircle className="w-3.5 h-3.5 mr-1.5" />
                                        Reject
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
