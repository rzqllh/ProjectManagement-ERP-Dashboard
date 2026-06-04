'use client';

import { useEffect, useState } from 'react';
import { EscalationRadar } from '@/components/dashboard/EscalationRadar';
import { BottleneckBreaker } from '@/components/dashboard/BottleneckBreaker';
import { ApprovalQueue } from '@/components/dashboard/ApprovalQueue';
import { ProjectHealthHeatmap } from '@/components/dashboard/ProjectHealthHeatmap';
import { DecisionVelocitySpark } from '@/components/dashboard/DecisionVelocitySpark';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { SystemStatusBar } from '@/components/dashboard/SystemStatusBar';
import { useAuth } from '@/components/providers/auth-provider';
import DashboardLoading from '../loading';
import DashboardError from '../error';

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/dashboard/stats');
                if (!res.ok) throw new Error('Failed to load mission data');
                const json = await res.json();
                setData(json.data);
            } catch (err) {
                setError(err instanceof Error ? err : new Error('Unknown error'));
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <DashboardLoading />;
    if (error) return <DashboardError error={error} reset={() => window.location.reload()} />;
    if (!data) return null;

    return (
        <div className="space-y-8 pb-12 animate-fade-in-up">
            {/* 1. Header & System Status */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-caneris-cyan animate-pulse"></span>
                        <p className="text-xs font-mono text-caneris-cyan uppercase tracking-widest">System Online</p>
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
                        Good Morning, {user?.displayName?.split(' ')[0] || 'Commander'}
                    </h1>
                    <p className="text-slate-400 font-medium text-lg">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div className="w-full md:w-auto h-12">
                    <SystemStatusBar />
                </div>
            </div>

            {/* 2. THE RED ZONE (Priority Stack) */}
            <h2 className="text-xs font-bold text-red-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <span className="w-4 h-[1px] bg-red-500"></span>
                Red Zone • Immediate Action
                <span className="flex-1 h-[1px] bg-red-500/20"></span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[280px]">
                {/* Escalation Radar - Most Critical */}
                <div className="lg:col-span-4 h-full">
                    <EscalationRadar items={data.escalations} />
                </div>

                {/* Bottleneck Breaker */}
                <div className="lg:col-span-4 h-full">
                    <BottleneckBreaker items={data.bottlenecks} />
                </div>

                {/* Approval Queue - User Action */}
                <div className="lg:col-span-4 h-full">
                    <ApprovalQueue
                        items={data.approvals.map((d: any) => ({
                            id: d.id,
                            title: d.title,
                            requester: 'System',
                            date: new Date(d.created_at).toLocaleDateString()
                        }))}
                    />
                </div>
            </div>

            {/* 3. THE PERFORMANCE ZONE */}
            <div className="mt-12">
                <h2 className="text-xs font-bold text-caneris-blue uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-caneris-blue"></span>
                    Performance Zone • Trends
                    <span className="flex-1 h-[1px] bg-caneris-blue/20"></span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[280px]">
                    {/* Project Heatmap */}
                    <div className="lg:col-span-8 h-full">
                        <ProjectHealthHeatmap projects={data.projects} />
                    </div>

                    {/* Decision Velocity */}
                    <div className="lg:col-span-4 h-full">
                        <DecisionVelocitySpark
                            data={data.velocity}
                            velocity={data.velocity.reduce((acc: number, curr: any) => acc + curr.count, 0)}
                            trend="flat"
                        />
                    </div>
                </div>
            </div>

            {/* 4. THE LOG ZONE */}
            <div className="mt-12">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <span className="w-4 h-[1px] bg-slate-500"></span>
                    Mission Log • Activity
                    <span className="flex-1 h-[1px] bg-slate-500/20"></span>
                </h2>
                <div className="grid grid-cols-1 gap-6">
                    <ActivityFeed />
                </div>
            </div>
        </div>
    );
}
