'use client';

import { Card } from '@/components/ui/card';
import { Hourglass, ArrowRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';

interface StuckItem {
    id: string;
    type: 'ND' | 'PROJECT';
    identifier: string;
    status: string;
    days_stuck: number;
}

export function BottleneckBreaker({ items = [] }: { items: StuckItem[] }) {
    return (
        <Card className="border-amber-900/30 bg-gradient-to-br from-[#1a1205] to-[#0f172a] p-5 flex flex-col h-full group">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                        <Hourglass className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Bottleneck Breaker</h3>
                        <p className="text-xs text-amber-300/70 font-mono uppercase tracking-wider">
                            {items.length} STAGNANT ITEMS
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 py-4">
                        <Hourglass className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-sm">Velocity is optimal</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-amber-950/10 border border-amber-900/20 hover:bg-amber-900/20 transition-all group/item"
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold border ${item.type === 'ND' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                                        {item.type}
                                    </span>
                                    <span className="text-xs font-mono text-amber-400">{item.identifier}</span>
                                </div>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className="text-sm text-slate-300 font-medium">Stuck in {item.status}</span>
                                    <span className="text-xs text-red-400 font-mono">+{item.days_stuck}d</span>
                                </div>
                            </div>

                            <Link
                                href={item.type === 'ND' ? `/nd/${item.id}` : `/projects/${item.id}`}
                                className="p-2 rounded-full hover:bg-amber-500/20 text-amber-500/50 hover:text-amber-400 transition-all"
                                title="Action Required"
                            >
                                <PlayCircle className="w-4 h-4" />
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
