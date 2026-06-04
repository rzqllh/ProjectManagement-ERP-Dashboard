'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Stakeholder, StakeholderInteraction, StakeholderCategory } from '@/types/stakeholder';
import { NdeRecord } from '@/types/nd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Loader2, ArrowLeft, ShieldAlert, Clock, AlertTriangle, Users, Building2, Mail, Phone,
    Activity, TrendingUp, FileText, Plus, RefreshCw, Trash2, Edit
} from 'lucide-react';
import Link from 'next/link';
import { StakeholderForm } from '@/components/stakeholder/StakeholderForm';

// --- Helpers ---
function formatDate(iso?: string) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function CategoryBadge({ category }: { category: StakeholderCategory }) {
    const config: Record<StakeholderCategory, { label: string; className: string }> = {
        internal: { label: 'Internal', className: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
        external: { label: 'External', className: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
        regulator: { label: 'Regulator', className: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
        vendor: { label: 'Vendor', className: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
    };
    const c = config[category];
    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono border ${c.className}`}>
            {c.label}
        </span>
    );
}

function RiskGauge({ score }: { score: number }) {
    let color = 'text-emerald-400';
    let bgColor = 'bg-emerald-500';
    let label = 'Low Risk';
    if (score >= 60) { color = 'text-red-400'; bgColor = 'bg-red-500'; label = 'High Risk'; }
    else if (score >= 30) { color = 'text-amber-400'; bgColor = 'bg-amber-500'; label = 'Medium Risk'; }

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-20 h-20">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"
                    />
                    <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="currentColor" strokeWidth="3"
                        strokeDasharray={`${score}, 100`}
                        className={color}
                    />
                </svg>
                <div className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${color}`}>
                    {score}
                </div>
            </div>
            <span className={`text-[10px] font-mono ${color}`}>{label}</span>
        </div>
    );
}

// --- Page ---
export default function StakeholderProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [profile, setProfile] = useState<{
        stakeholder: Stakeholder;
        recent_nds: NdeRecord[];
        interactions: StakeholderInteraction[];
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLogOpen, setIsLogOpen] = useState(false);
    const [recomputing, setRecomputing] = useState(false);

    // Interaction form
    const [interactionType, setInteractionType] = useState<string>('email');
    const [interactionNote, setInteractionNote] = useState('');
    const [interactionNdId, setInteractionNdId] = useState('');

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/stakeholders/${id}`);
            if (res.ok) {
                const json = await res.json();
                setProfile(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleUpdate = async (data: any) => {
        try {
            const res = await fetch(`/api/stakeholders/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                setIsEditOpen(false);
                fetchProfile();
            }
        } catch (e) { console.error(e); }
    };

    const handleRecompute = async () => {
        setRecomputing(true);
        try {
            await fetch(`/api/stakeholders/${id}/recompute`, { method: 'POST' });
            fetchProfile();
        } catch (e) { console.error(e); }
        finally { setRecomputing(false); }
    };

    const handleDelete = async () => {
        if (!confirm('Archive this stakeholder?')) return;
        try {
            await fetch(`/api/stakeholders/${id}`, { method: 'DELETE' });
            router.push('/stakeholders');
        } catch (e) { console.error(e); }
    };

    const handleLogInteraction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch(`/api/stakeholders/${id}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: interactionType,
                    note: interactionNote,
                    nd_id: interactionNdId || undefined,
                }),
            });
            setIsLogOpen(false);
            setInteractionNote('');
            setInteractionNdId('');
            fetchProfile();
        } catch (e) { console.error(e); }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-[#64748b]">
                <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                Loading profile...
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="p-12 text-center text-[#64748b]">Stakeholder not found.</div>
        );
    }

    const { stakeholder, recent_nds, interactions } = profile;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/stakeholders" className="text-[#64748b] hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-caneris-cyan/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                        <span className="text-lg font-bold text-caneris-cyan">{stakeholder.name.charAt(0)}</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white flex items-center gap-3">
                            {stakeholder.name}
                            <CategoryBadge category={stakeholder.category} />
                        </h1>
                        <p className="text-sm text-[#94a3b8] flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {stakeholder.organization}</span>
                            <span>·</span>
                            <span>{stakeholder.role}</span>
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={handleRecompute} disabled={recomputing}
                        className="text-[#64748b] hover:text-white text-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1 ${recomputing ? 'animate-spin' : ''}`} />
                        Recompute
                    </Button>
                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-[#64748b] hover:text-white text-xs">
                                <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#1e293b] border-white/10 text-white max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Edit Stakeholder</DialogTitle>
                                <DialogDescription>Update stakeholder information.</DialogDescription>
                            </DialogHeader>
                            <StakeholderForm
                                initialData={{
                                    name: stakeholder.name,
                                    organization: stakeholder.organization,
                                    role: stakeholder.role,
                                    email: stakeholder.email,
                                    phone: stakeholder.phone,
                                    category: stakeholder.category,
                                    influence_level: stakeholder.influence_level,
                                    notes: stakeholder.notes,
                                }}
                                onSubmit={handleUpdate}
                                isEditing
                            />
                        </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="sm" onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Archive
                    </Button>
                </div>
            </div>

            {/* Contact Info + Risk Score */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact */}
                <div className="glass-card p-5 rounded-xl border border-white/5 space-y-3">
                    <h3 className="text-xs font-mono text-[#64748b] uppercase">Contact</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-[#94a3b8]">
                            <Mail className="w-3.5 h-3.5 text-caneris-cyan" />
                            <span>{stakeholder.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#94a3b8]">
                            <Phone className="w-3.5 h-3.5 text-caneris-cyan" />
                            <span>{stakeholder.phone}</span>
                        </div>
                        {stakeholder.influence_level && (
                            <div className="flex items-center gap-2 text-[#94a3b8]">
                                <TrendingUp className="w-3.5 h-3.5 text-caneris-cyan" />
                                <span>Influence: <span className="text-white capitalize">{stakeholder.influence_level}</span></span>
                            </div>
                        )}
                    </div>
                    {stakeholder.notes && (
                        <p className="text-xs text-[#64748b] mt-3 p-2 bg-white/5 rounded-lg">{stakeholder.notes}</p>
                    )}
                </div>

                {/* Intelligence Metrics */}
                <div className="glass-card p-5 rounded-xl border border-white/5">
                    <h3 className="text-xs font-mono text-[#64748b] uppercase mb-4">Intelligence Metrics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-[10px] font-mono text-[#64748b]">Avg Response</div>
                            <div className={`text-lg font-bold ${stakeholder.average_response_time_days > 5 ? 'text-amber-400' : 'text-white'}`}>
                                {stakeholder.average_response_time_days > 0 ? `${stakeholder.average_response_time_days}d` : '—'}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-[#64748b]">Total NDs</div>
                            <div className="text-lg font-bold text-white">{stakeholder.total_nd_count}</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-[#64748b]">Escalations</div>
                            <div className={`text-lg font-bold ${stakeholder.total_escalations > 0 ? 'text-red-400' : 'text-white'}`}>
                                {stakeholder.total_escalations}
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] font-mono text-[#64748b]">Interactions</div>
                            <div className="text-lg font-bold text-white">{stakeholder.interaction_count}</div>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 text-[10px] font-mono space-y-1 text-[#64748b]">
                        <div>Last interaction: {formatDate(stakeholder.last_interaction_at)}</div>
                        <div>Last escalation: {formatDate(stakeholder.last_escalation_at)}</div>
                        <div>Last response: {formatDate(stakeholder.last_response_at)}</div>
                    </div>
                </div>

                {/* Risk Score Gauge */}
                <div className="glass-card p-5 rounded-xl border border-white/5 flex flex-col items-center justify-center">
                    <h3 className="text-xs font-mono text-[#64748b] uppercase mb-4">Risk Score</h3>
                    <RiskGauge score={stakeholder.risk_score} />
                    <p className="text-[10px] text-[#4b5563] mt-3 text-center">
                        Composite of response time, escalations, and interaction frequency
                    </p>
                </div>
            </div>

            {/* Related NDs + Interactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Related NDs */}
                <div className="glass-card rounded-xl border border-white/5">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <h3 className="text-xs font-mono text-[#64748b] uppercase flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5" /> Related NDs ({recent_nds.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                        {recent_nds.length === 0 ? (
                            <div className="p-6 text-center text-[#4b5563] text-xs">No linked NDs yet.</div>
                        ) : (
                            recent_nds.map(nd => (
                                <Link key={nd.id} href={`/nd/${nd.id}`}
                                    className="flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
                                >
                                    <div>
                                        <div className="text-sm font-mono text-white">{nd.nd_number}</div>
                                        <div className="text-[11px] text-[#64748b] truncate max-w-[200px]">{nd.title}</div>
                                    </div>
                                    <span className="text-[10px] font-mono text-[#94a3b8] px-2 py-0.5 rounded bg-white/5">
                                        {nd.status}
                                    </span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Interaction Log */}
                <div className="glass-card rounded-xl border border-white/5">
                    <div className="flex items-center justify-between p-4 border-b border-white/5">
                        <h3 className="text-xs font-mono text-[#64748b] uppercase flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" /> Interaction Log ({interactions.length})
                        </h3>
                        <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-caneris-cyan text-xs h-7">
                                    <Plus className="w-3 h-3 mr-1" /> Log
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1e293b] border-white/10 text-white max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Log Interaction</DialogTitle>
                                    <DialogDescription>Record a stakeholder interaction.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleLogInteraction} className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-[#94a3b8]">Type</label>
                                        <Select value={interactionType} onValueChange={setInteractionType}>
                                            <SelectTrigger className="bg-black/20 border-white/10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                                                <SelectItem value="email">Email</SelectItem>
                                                <SelectItem value="meeting">Meeting</SelectItem>
                                                <SelectItem value="call">Call</SelectItem>
                                                <SelectItem value="escalation">Escalation</SelectItem>
                                                <SelectItem value="decision">Decision</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-[#94a3b8]">Note</label>
                                        <Textarea
                                            value={interactionNote}
                                            onChange={e => setInteractionNote(e.target.value)}
                                            placeholder="Describe the interaction..."
                                            className="bg-black/20 border-white/10 min-h-[80px]"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-mono text-[#94a3b8]">Related ND ID (Optional)</label>
                                        <Input
                                            value={interactionNdId}
                                            onChange={e => setInteractionNdId(e.target.value)}
                                            placeholder="e.g. ND-001"
                                            className="bg-black/20 border-white/10"
                                        />
                                    </div>
                                    <Button type="submit" className="w-full bg-caneris-cyan text-black hover:bg-caneris-cyan/90">
                                        Log Interaction
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
                        {interactions.length === 0 ? (
                            <div className="p-6 text-center text-[#4b5563] text-xs">No interactions logged yet.</div>
                        ) : (
                            interactions.map(ix => (
                                <div key={ix.id} className="p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-[#94a3b8]">
                                            {ix.type}
                                        </span>
                                        <span className="text-[10px] text-[#4b5563]">
                                            {formatDate(ix.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#94a3b8] mt-1">{ix.note}</p>
                                    {ix.nd_id && (
                                        <Link href={`/nd/${ix.nd_id}`}
                                            className="text-[10px] text-caneris-cyan hover:underline mt-1 inline-block"
                                        >
                                            → Related ND
                                        </Link>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
