'use client';

import { Card } from '@/components/ui/card';
import { AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface HighRiskItem {
    id: string;
    nd_number: string;
    title: string;
    risk_score: number;
}

export function EscalationRadar({ items = [] }: { items: HighRiskItem[] }) {
    const hasRisks = items.length > 0;

    return (
        <Card className="relative overflow-hidden border-red-900/40 bg-gradient-to-br from-[#1a0505] to-[#0f172a] p-0 group">
            {/* Radar Scan Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(transparent_0deg,rgba(239,68,68,0.05)_60deg,transparent_120deg)] animate-spin-slow opacity-50" />
            </div>

            <div className="p-5 relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${hasRisks ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-slate-800/50 text-slate-500'}`}>
                            <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">Escalation Radar</h3>
                            <p className="text-xs text-red-300/70 font-mono uppercase tracking-wider">
                                {hasRisks ? `${items.length} THREATS DETECTED` : 'SECTOR CLEAR'}
                            </p>
                        </div>
                    </div>
                    {hasRisks && (
                        <span className="flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 py-4">
                            <ShieldAlert className="w-8 h-8 opacity-20 mb-2" />
                            <p className="text-sm">No active escalations</p>
                        </div>
                    ) : (
                        items.map((item) => (
                            <Link
                                key={item.id}
                                href={`/nd/${item.id}`}
                                className="flex items-center justify-between p-3 rounded-lg bg-red-950/20 border border-red-900/30 hover:bg-red-900/30 transition-all group/item"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-red-400">{item.nd_number}</span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 font-bold border border-red-500/20">
                                            RISK: {item.risk_score}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-300 truncate w-48 font-medium mt-0.5 group-hover/item:text-white transition-colors">
                                        {item.title}
                                    </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-red-500/50 group-hover/item:text-red-400 transform group-hover/item:translate-x-1 transition-all" />
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </Card>
    );
}
