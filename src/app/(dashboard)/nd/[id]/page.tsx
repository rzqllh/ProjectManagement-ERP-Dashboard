'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { NdStatusBadge } from '@/components/nd/NdStatusBadge';
import { NdCategoryBadge } from '@/components/nd/NdCategoryBadge';
import { DecisionPanel } from '@/components/nd/detail/DecisionPanel';
import { TimelinePanel } from '@/components/nd/detail/TimelinePanel';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { NdeRecord } from '@/types/nd';
import { TimelineEvent } from '@/types/timeline';
import { ArrowLeft, Clock, Calendar, User, Send, Target, RefreshCw, CheckCircle2, AlertTriangle, Network } from 'lucide-react';
import { getAge, getEscalationStatus } from '@/lib/nd-utils';

// Use this interface to unwrap params
interface PageProps {
    params: Promise<{ id: string }>;
}

export default function NdDetailPage({ params }: PageProps) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const router = useRouter();

    const [nd, setNd] = useState<NdeRecord | null>(null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [sheetOpen, setSheetOpen] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [ndRes, timelineRes] = await Promise.all([
                fetch(`/api/nd/${id}`),
                fetch(`/api/nd/${id}/timeline`)
            ]);

            if (ndRes.ok) {
                const ndJson = await ndRes.json();
                setNd(ndJson.data);
            }

            if (timelineRes.ok) {
                const timelineJson = await timelineRes.json();
                setTimeline(timelineJson.data);
            }

        } catch (error) {
            console.error('Failed to fetch ND details:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleUpdate = async (data: any) => {
        try {
            const payload = {
                ...data,
                deadline: data.deadline || null,
            };

            const res = await fetch(`/api/nd/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('Failed to update ND');

            setSheetOpen(false);
            fetchData(); // Refresh data
        } catch (error) {
            console.error(error);
            alert('Failed to update ND');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this record? This action cannot be undone.')) return;

        try {
            const res = await fetch(`/api/nd/${id}`, { method: 'DELETE' });
            if (res.ok) {
                router.push('/nd');
            } else {
                throw new Error('Failed to delete');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to delete ND');
        }
    };

    if (loading && !nd) {
        return <div className="p-8 text-center text-[#94a3b8]">Loading details...</div>;
    }

    if (!nd) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-[#94a3b8]">
                <p>Record not found or access denied.</p>
                <Link href="/nd" className="mt-4">
                    <Button variant="outline">Back to List</Button>
                </Link>
            </div>
        );
    }

    const age = getAge(nd.created_at);
    const risk = getEscalationStatus(nd);

    return (
        <div className="max-w-9xl mx-auto space-y-6 animate-fade-in-up">
            {/* Risk Banner */}
            {risk.level !== 'none' && (
                <div className={`rounded-xl p-4 border flex items-start gap-4 ${risk.level === 'escalated' ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                    }`}>
                    <AlertTriangle className={`w-5 h-5 shrink-0 ${risk.level === 'escalated' ? 'animate-pulse' : ''}`} />
                    <div>
                        <h3 className="font-bold text-sm tracking-wide uppercase">{risk.label}</h3>
                        <p className="text-xs opacity-90 mt-1">
                            {risk.level === 'escalated'
                                ? 'This ND has been stuck for too long. Immediate attention required.'
                                : 'This ND is progressing slowly. Please check with external parties.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/nd">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94a3b8] hover:text-white hover:bg-white/10">
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                                {nd.nd_number}
                            </h1>
                            <NdStatusBadge status={nd.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
                            <span>Created {new Date(nd.created_at).toLocaleString()}</span>
                            <span>&middot;</span>
                            <span className="flex items-center gap-1 font-mono text-[#cbd5e1]">
                                <Clock className="w-3 h-3" />
                                {age.label} old
                            </span>
                        </div>
                    </div>
                </div>

                {/* Edit/Delete buttons moved to Actions Card */}
                <div className="flex items-center gap-2">
                    <Link href={`/graph?root_id=${id}&root_type=nd`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-[#1e293b] border-white/10 text-white hover:bg-white/10">
                            <Network className="w-3.5 h-3.5 mr-1.5 text-caneris-cyan" />
                            View in Graph
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Left: Main Info & Timeline */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Main Info */}
                    <div className="glass-card p-6 rounded-xl space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-lg font-semibold text-white leading-snug">
                                {nd.title}
                            </h2>
                            <NdCategoryBadge category={nd.category} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 pt-4 border-t border-white/5">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider text-[#64748b]">
                                        <User className="w-3.5 h-3.5" />
                                        Sender
                                    </div>
                                    <div className="text-sm text-[#cbd5e1] pl-6">
                                        {nd.sender}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider text-[#64748b]">
                                        <Send className="w-3.5 h-3.5" />
                                        Receiver
                                    </div>
                                    <div className="text-sm text-[#cbd5e1] pl-6">
                                        <ul className="list-disc pl-4 space-y-1">
                                            {nd.receiver.split(/\n|;/).map((r, i) => r.trim() && <li key={i}>{r.trim()}</li>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider text-[#64748b]">
                                        <Target className="w-3.5 h-3.5" />
                                        PIC
                                    </div>
                                    <div className="text-sm text-[#cbd5e1] pl-6">
                                        <ul className="list-disc pl-4 space-y-1">
                                            {nd.pic.split(/\n|;/).map((p, i) => p.trim() && <li key={i}>{p.trim()}</li>)}
                                        </ul>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider text-[#64748b]">
                                        <Calendar className="w-3.5 h-3.5" />
                                        Deadline
                                    </div>
                                    <div className="text-sm text-[#cbd5e1] pl-6">
                                        {nd.deadline ? new Date(nd.deadline).toLocaleDateString() : 'No deadline'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider text-[#64748b] mb-2">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Next Action
                            </div>
                            <div className="space-y-2">
                                {nd.next_action.split(/\n/).map((action, i) => {
                                    if (!action.trim()) return null;

                                    // Check if line starts with [x] or [ ]
                                    const isChecked = action.trim().startsWith('[x] ');
                                    const cleanText = action.trim().replace(/^\[[ x]\] /, '');

                                    // Use local handler to toggle
                                    const handleToggle = async () => {
                                        const lines = nd.next_action.split(/\n/);
                                        // Update line
                                        const newPrefix = isChecked ? '[ ] ' : '[x] ';
                                        lines[i] = newPrefix + cleanText; // Naive index matching relying on split

                                        // If split by \n|; previously, ensure we reconstruct correctly. 
                                        // User input is primarily from Textarea which uses \n.
                                        // Let's stick to joined by \n
                                        const newActionStr = lines.join('\n');

                                        // Optimistic update
                                        setNd(prev => prev ? { ...prev, next_action: newActionStr } : null);

                                        // API Save
                                        try {
                                            await fetch(`/api/nd/${id}`, {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ next_action: newActionStr }),
                                            });
                                        } catch (e) {
                                            console.error("Failed to save checkbox state", e);
                                            // Revert on error? For now, keep simple.
                                        }
                                    };

                                    return (
                                        <div
                                            key={i}
                                            onClick={handleToggle}
                                            className={`p-3 rounded-lg text-sm flex items-start gap-3 group transition-colors cursor-pointer ${isChecked ? 'bg-caneris-cyan/10 text-[#cbd5e1]' : 'bg-white/5 text-[#e2e8f0] hover:bg-white/10'}`}
                                        >
                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-caneris-cyan border-caneris-cyan text-black' : 'border-white/20 group-hover:border-caneris-cyan/50'}`}>
                                                {isChecked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 4L3.5 6.5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                                            </div>
                                            <span className={isChecked ? 'line-through opacity-70' : ''}>{cleanText}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {nd.blocker_description && (
                            <div className="pt-4 border-t border-white/5">
                                <div className="text-[10px] uppercase font-mono tracking-wider text-red-400 mb-2">Blocker / Issue</div>
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-200">
                                    {nd.blocker_description}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Decision Log Panel */}
                    <DecisionPanel ndId={nd.id} />
                </div>

                {/* Timeline Panel */}
                <TimelinePanel events={timeline} onRefresh={fetchData} isLoading={loading} />
            </div>
        </div>
    );
}
