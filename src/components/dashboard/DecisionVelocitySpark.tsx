'use client';

import { Card } from '@/components/ui/card';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface DecisionMetric {
    date: string;
    count: number;
}

export function DecisionVelocitySpark({
    data = [],
    velocity = 0,
    trend = 'up'
}: {
    data: DecisionMetric[];
    velocity: number;
    trend: 'up' | 'down' | 'flat';
}) {
    const max = Math.max(...data.map(d => d.count), 1);

    return (
        <Card className="p-5 bg-[#0b1121] border-white/5 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Decision Velocity</h3>
                        <p className="text-xs text-slate-500">Decisions / Week</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    <span>{velocity}/wk</span>
                </div>
            </div>

            <div className="flex items-end gap-1 h-24 mt-4 px-2">
                {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end group relative">
                        <div
                            className="bg-yellow-500/50 hover:bg-yellow-400 rounded-t-sm transition-all relative"
                            style={{ height: `${(d.count / max) * 100}%` }}
                        >
                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black text-xs text-white px-1 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                                {d.count} ({d.date})
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-2 text-center text-xs text-slate-500 font-mono uppercase tracking-wider">
                Last 7 Days Activity
            </div>
        </Card>
    );
}
