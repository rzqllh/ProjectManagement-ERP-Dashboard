'use client';

import { useEffect, useState } from 'react';
import { Loader2, ArrowRight, Gavel } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function DecisionVelocityCard() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            // Mocking decision stats for now as we don't have a dedicated stats endpoint for strictly velocity yet
            // In a real scenario, this would fetch from /api/decisions/stats
            try {
                // Simulate fetch delay
                await new Promise(r => setTimeout(r, 500));
                setStats({
                    velocity: 4.2, // Decisions per week
                    pending: 3,
                    approved_this_week: 5,
                    trend: '+12%'
                });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="glass-card rounded-xl p-5 animate-fade-in-up h-full flex flex-col relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute -right-4 -top-4 text-white/5 rotate-12">
                <Gavel className="w-24 h-24" />
            </div>

            <div className="flex items-center justify-between mb-2 relative z-10">
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#64748b]">
                    Decision Velocity
                </p>
                <button
                    onClick={() => router.push('/decisions')}
                    className="text-[10px] text-caneris-cyan hover:underline flex items-center gap-1"
                >
                    All Decisions <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                </div>
            ) : (
                <div className="flex-1 flex flex-col justify-end relative z-10">
                    <div className="flex items-end gap-2 mb-1">
                        <span className="text-4xl font-bold text-white">{stats.velocity}</span>
                        <span className="text-xs text-emerald-400 font-mono mb-1.5">{stats.trend}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">Decisions / Week</p>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                            <p className="text-[10px] text-slate-400 uppercase">Pending</p>
                            <p className="text-lg font-bold text-amber-400">{stats.pending}</p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                            <p className="text-[10px] text-slate-400 uppercase">Approved</p>
                            <p className="text-lg font-bold text-emerald-400">{stats.approved_this_week}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
