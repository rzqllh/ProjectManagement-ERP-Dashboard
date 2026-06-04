'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Decision, DecisionStatus, DecisionPriority } from '@/types/decision';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Edit, Trash2, Calendar, User, FileText, Link as LinkIcon, Hash, Tag, Gavel } from 'lucide-react';
import { format } from 'date-fns';
import { DecisionStatusBadge } from '@/components/decisions/DecisionStatusBadge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DecisionForm } from '@/components/decisions/DecisionForm';
import { Separator } from '@/components/ui/separator';

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

export default function DecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        params.then(p => setId(p.id));
    }, [params]);

    const router = useRouter();
    const [decision, setDecision] = useState<Decision | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchDecision = useCallback(async () => {
        if (!id) return;
        try {
            setLoading(true);
            const res = await fetch(`/api/decisions/${id}`);
            if (res.ok) {
                const json = await res.json();
                setDecision(json.data);
            } else {
                // Handle 404
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) fetchDecision();
    }, [id, fetchDecision]);

    const handleUpdate = async (data: any) => {
        try {
            const res = await fetch(`/api/decisions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                setIsEditOpen(false);
                fetchDecision();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this decision log?')) return;
        try {
            await fetch(`/api/decisions/${id}`, { method: 'DELETE' });
            router.push('/decisions');
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-caneris-cyan" />
            </div>
        );
    }

    if (!decision) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-[#64748b]">
                <h2 className="text-xl font-bold text-white mb-2">Decision Not Found</h2>
                <Button variant="ghost" onClick={() => router.push('/decisions')}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to List
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in-up max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 text-sm text-[#94a3b8]">
                        <Link href="/decisions" className="hover:text-caneris-cyan transition-colors">
                            Decisions
                        </Link>
                        <span>/</span>
                        <span className="text-white font-mono">{decision.decision_number}</span>
                    </div>

                    <h1 className="text-3xl font-bold text-white leading-tight mb-3">
                        {decision.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3">
                        <DecisionStatusBadge status={decision.status} className="text-sm px-3 py-1" />
                        <DecisionPriorityBadge priority={decision.priority} />
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-purple-500/20 text-purple-400 capitalize bg-purple-500/5">
                            {decision.decision_type}
                        </span>
                        <span className="text-xs text-[#64748b] flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(decision.created_at), 'MMMM d, yyyy')}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="border-white/10 hover:bg-white/5">
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1e293b] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DecisionForm
                                initialData={decision}
                                onSubmit={handleUpdate}
                                onCancel={() => setIsEditOpen(false)}
                            />
                        </DialogContent>
                    </Dialog>

                    <Button variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20" onClick={handleDelete}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <Separator className="bg-white/10" />

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Context */}
                    <section>
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-caneris-cyan" />
                            Context & Problem Statement
                        </h3>
                        <div className="glass-card p-5 rounded-xl border border-white/5 text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                            {decision.context}
                        </div>
                    </section>

                    {/* Proposed Solution */}
                    {decision.proposed_solution && (
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-blue-400" />
                                Proposed Solution
                            </h3>
                            <div className="glass-card p-5 rounded-xl border border-white/5 text-[#94a3b8] leading-relaxed whitespace-pre-wrap">
                                {decision.proposed_solution}
                            </div>
                        </section>
                    )}

                    {/* Outcome */}
                    {(decision.decision_outcome || decision.status === 'approved' || decision.status === 'rejected') && (
                        <section>
                            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                                <Gavel className="w-5 h-5 text-emerald-400" />
                                Decision Outcome
                            </h3>
                            <div className={`glass-card p-5 rounded-xl border ${decision.status === 'rejected' ? 'border-red-500/20 bg-red-500/5' :
                                decision.status === 'approved' ? 'border-emerald-500/20 bg-emerald-500/5' :
                                    'border-white/5'
                                } text-white leading-relaxed whitespace-pre-wrap`}>
                                {decision.decision_outcome || (decision.status === 'approved' ? 'Approved' : 'Rejected')}
                                {decision.approval_date && (
                                    <div className="mt-4 pt-3 border-t border-white/10 text-xs text-[#94a3b8] flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        Approved on {format(new Date(decision.approval_date), 'MMMM d, yyyy')}
                                        {decision.approver && ` by ${decision.approver}`}
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column: Metadata */}
                <div className="space-y-6">
                    <div className="glass-card p-5 rounded-xl border border-white/5 space-y-4">
                        <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">Metadata</h4>

                        <div className="space-y-1">
                            <label className="text-xs text-[#64748b] font-mono">PIC</label>
                            <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                                <User className="w-4 h-4" />
                                {decision.pic}
                            </div>
                        </div>

                        {decision.related_project_id && (
                            <div className="space-y-1">
                                <label className="text-xs text-[#64748b] font-mono">Related Project</label>
                                <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                                    <Hash className="w-4 h-4" />
                                    <Link href={`/projects/${decision.related_project_id}`} className="hover:text-caneris-cyan underline decoration-white/20 hover:decoration-caneris-cyan underline-offset-4">
                                        View Project
                                    </Link>
                                </div>
                            </div>
                        )}

                        {decision.related_nd_id && (
                            <div className="space-y-1">
                                <label className="text-xs text-[#64748b] font-mono">Related ND</label>
                                <div className="flex items-center gap-2 text-sm text-[#94a3b8]">
                                    <FileText className="w-4 h-4" />
                                    <Link href={`/nd/${decision.related_nd_id}`} className="hover:text-caneris-cyan underline decoration-white/20 hover:decoration-caneris-cyan underline-offset-4">
                                        View ND Record
                                    </Link>
                                </div>
                            </div>
                        )}

                        {decision.tags && decision.tags.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <label className="text-xs text-[#64748b] font-mono">Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {decision.tags.map(tag => (
                                        <span key={tag} className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#94a3b8]">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper icons
import { CheckCircle2 } from 'lucide-react';
