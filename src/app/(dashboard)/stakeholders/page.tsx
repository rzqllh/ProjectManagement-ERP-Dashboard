'use client';

import { useState, useEffect, useCallback } from 'react';
import { Stakeholder, StakeholderCategory } from '@/types/stakeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
    Loader2, Plus, Users, Search, ShieldAlert, Clock, AlertTriangle,
    Building2, User, Mail, Phone, TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { StakeholderForm } from '@/components/stakeholder/StakeholderForm';

// --- Badges ---
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

function RiskScoreBadge({ score }: { score: number }) {
    let className = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let label = 'Low Risk';
    if (score >= 60) {
        className = 'text-red-400 bg-red-500/10 border-red-500/20';
        label = 'High Risk';
    } else if (score >= 30) {
        className = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        label = 'Medium Risk';
    }
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${className}`}>
            {score} — {label}
        </span>
    );
}

// --- Page ---
export default function StakeholdersPage() {
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const fetchStakeholders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterCategory && filterCategory !== 'all') {
                params.set('category', filterCategory);
            }
            const res = await fetch(`/api/stakeholders?${params.toString()}`);
            if (res.ok) {
                const json = await res.json();
                setStakeholders(json.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filterCategory]);

    useEffect(() => {
        fetchStakeholders();
    }, [fetchStakeholders]);

    const handleCreate = async (data: any) => {
        try {
            const res = await fetch('/api/stakeholders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                setIsCreateOpen(false);
                fetchStakeholders();
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Client-side search
    const filtered = stakeholders.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Summary stats
    const totalStakeholders = stakeholders.length;
    const avgRisk = stakeholders.length > 0
        ? Math.round(stakeholders.reduce((sum, s) => sum + s.risk_score, 0) / stakeholders.length)
        : 0;
    const highRiskCount = stakeholders.filter(s => s.risk_score >= 60).length;
    const avgResponseTime = stakeholders.length > 0
        ? (stakeholders.reduce((sum, s) => sum + s.average_response_time_days, 0) / stakeholders.length).toFixed(1)
        : '0';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center border border-white/10">
                            <Users className="w-5 h-5 text-caneris-cyan" />
                        </div>
                        Stakeholder Intelligence
                    </h1>
                    <p className="text-sm text-[#94a3b8] mt-1">
                        Track, score, and predict stakeholder behavior for escalation prevention.
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Stakeholder
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#1e293b] border-white/10 text-white max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Register Stakeholder</DialogTitle>
                            <DialogDescription>Add a new stakeholder to the intelligence system.</DialogDescription>
                        </DialogHeader>
                        <StakeholderForm onSubmit={handleCreate} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-[#64748b] text-xs font-mono mb-1">
                        <Users className="w-3.5 h-3.5" /> Total
                    </div>
                    <div className="text-2xl font-bold text-white">{totalStakeholders}</div>
                </div>
                <div className="glass-card p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-[#64748b] text-xs font-mono mb-1">
                        <Clock className="w-3.5 h-3.5" /> Avg Response
                    </div>
                    <div className="text-2xl font-bold text-white">{avgResponseTime}d</div>
                </div>
                <div className="glass-card p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-[#64748b] text-xs font-mono mb-1">
                        <TrendingUp className="w-3.5 h-3.5" /> Avg Risk
                    </div>
                    <div className="text-2xl font-bold text-white">{avgRisk}</div>
                </div>
                <div className="glass-card p-4 rounded-xl border border-white/5">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-mono mb-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> High Risk
                    </div>
                    <div className="text-2xl font-bold text-red-400">{highRiskCount}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#64748b]" />
                    <Input
                        placeholder="Search stakeholders..."
                        className="pl-10 bg-white/5 border-white/10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[160px] bg-white/5 border-white/10">
                        <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="internal">Internal</SelectItem>
                        <SelectItem value="external">External</SelectItem>
                        <SelectItem value="regulator">Regulator</SelectItem>
                        <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stakeholder Table */}
            {loading ? (
                <div className="p-12 text-center text-[#64748b]">
                    <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                    Loading stakeholders...
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-xl text-center text-[#64748b]">
                    No stakeholders found. Add one to get started.
                </div>
            ) : (
                <div className="glass-card rounded-xl border border-white/5 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 text-[10px] font-mono uppercase text-[#64748b]">
                                <th className="text-left p-4">Stakeholder</th>
                                <th className="text-left p-4 hidden md:table-cell">Category</th>
                                <th className="text-center p-4 hidden lg:table-cell">NDs</th>
                                <th className="text-center p-4 hidden lg:table-cell">Response</th>
                                <th className="text-center p-4 hidden md:table-cell">Escalations</th>
                                <th className="text-center p-4">Risk Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4">
                                        <Link href={`/stakeholders/${s.id}`} className="group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-caneris-cyan/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                                                    <span className="text-xs font-bold text-caneris-cyan">
                                                        {s.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white group-hover:text-caneris-cyan transition-colors">
                                                        {s.name}
                                                    </div>
                                                    <div className="text-[11px] text-[#64748b] flex items-center gap-1.5">
                                                        <Building2 className="w-3 h-3" />
                                                        {s.organization} — {s.role}
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <CategoryBadge category={s.category} />
                                    </td>
                                    <td className="p-4 text-center hidden lg:table-cell">
                                        <span className="text-sm font-mono text-white">{s.total_nd_count}</span>
                                    </td>
                                    <td className="p-4 text-center hidden lg:table-cell">
                                        <span className={`text-sm font-mono ${s.average_response_time_days > 5 ? 'text-amber-400' : 'text-white'}`}>
                                            {s.average_response_time_days > 0 ? `${s.average_response_time_days}d` : '—'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center hidden md:table-cell">
                                        <span className={`text-sm font-mono ${s.total_escalations > 0 ? 'text-red-400' : 'text-white'}`}>
                                            {s.total_escalations}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <RiskScoreBadge score={s.risk_score} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
