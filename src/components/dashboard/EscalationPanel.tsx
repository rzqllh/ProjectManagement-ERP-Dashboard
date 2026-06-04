'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NdeRecord } from '@/types/nd';
import { AlertTriangle, ArrowRight, Loader2, ShieldAlert } from 'lucide-react';
import { getAge } from '@/lib/nd-utils';

export function EscalationPanel() {
    const [risks, setRisks] = useState<NdeRecord[]>([]);
    const [escalated, setEscalated] = useState<NdeRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchEscalations() {
            try {
                // Fetch both risk and escalated items
                const [resRisk, resEsc] = await Promise.all([
                    fetch('/api/nd?escalation_status=risk'),
                    fetch('/api/nd?escalation_status=escalated')
                ]);

                if (resRisk.ok) {
                    const json = await resRisk.json();
                    setRisks(json.data || []);
                }
                if (resEsc.ok) {
                    const json = await resEsc.json();
                    setEscalated(json.data || []);
                }
            } catch (e) {
                console.error("Failed to fetch escalation data", e);
            } finally {
                setLoading(false);
            }
        }
        fetchEscalations();
    }, []);

    if (loading) return (
        <div className="glass-card p-6 rounded-xl flex items-center justify-center min-h-[200px]">
            <Loader2 className="w-6 h-6 animate-spin text-caneris-cyan" />
        </div>
    );

    const totalIssues = risks.length + escalated.length;

    if (totalIssues === 0) return null; // Don't show if empty? Or show "All Good"?

    return (
        <div className="glass-card p-6 rounded-xl border border-red-500/20 bg-red-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <ShieldAlert className="w-24 h-24 text-red-500" />
            </div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Escalation Watch</h3>
                        <p className="text-sm text-red-200/70">
                            {escalated.length} Critical, {risks.length} At Risk
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    {/* Critical Items First */}
                    {escalated.map(nd => (
                        <Link key={nd.id} href={`/nd/${nd.id}`} className="block">
                            <div className="p-3 rounded-lg bg-[#0f172a]/80 border border-red-500/30 hover:border-red-500/60 transition-colors flex items-center justify-between group">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-red-400 font-bold">ESCALATED</span>
                                        <span className="text-[10px] text-[#64748b] bg-white/5 px-1.5 py-0.5 rounded">{nd.nd_number}</span>
                                    </div>
                                    <h4 className="text-sm text-white font-medium line-clamp-1 group-hover:text-red-300 transition-colors">{nd.title}</h4>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-red-400 font-bold">{getAge(nd.created_at).label}</div>
                                    <div className="text-[10px] text-[#64748b]">old</div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {/* Risk Items */}
                    {risks.slice(0, 3).map(nd => (
                        <Link key={nd.id} href={`/nd/${nd.id}`} className="block">
                            <div className="p-3 rounded-lg bg-[#0f172a]/60 border border-amber-500/20 hover:border-amber-500/50 transition-colors flex items-center justify-between group">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-mono text-amber-400">RISK</span>
                                        <span className="text-[10px] text-[#64748b] bg-white/5 px-1.5 py-0.5 rounded">{nd.nd_number}</span>
                                    </div>
                                    <h4 className="text-sm text-white font-medium line-clamp-1 group-hover:text-amber-300 transition-colors">{nd.title}</h4>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-amber-400">{getAge(nd.created_at).label}</div>
                                    <div className="text-[10px] text-[#64748b]">old</div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {risks.length > 3 && (
                        <div className="text-center pt-2">
                            <span className="text-xs text-[#64748b] hover:text-white cursor-pointer">+ {risks.length - 3} more at risk</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
