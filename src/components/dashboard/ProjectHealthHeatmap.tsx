'use client';

import { Card } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface ProjectStatus {
    id: string;
    code: string;
    name: string;
    phases: {
        business: 'done' | 'wip' | 'blocked' | 'pending';
        technical: 'done' | 'wip' | 'blocked' | 'pending';
        order: 'done' | 'wip' | 'blocked' | 'pending';
        sarpen: 'done' | 'wip' | 'blocked' | 'pending';
        integration: 'done' | 'wip' | 'blocked' | 'pending';
        migration: 'done' | 'wip' | 'blocked' | 'pending';
        handover: 'done' | 'wip' | 'blocked' | 'pending';
    };
}

const statusColors = {
    done: 'bg-emerald-500',
    wip: 'bg-blue-500 animate-pulse',
    blocked: 'bg-red-500',
    pending: 'bg-slate-800'
};

const phases = ['Bus', 'Tec', 'Ord', 'Sar', 'Int', 'Mig', 'Hov'];

export function ProjectHealthHeatmap({ projects = [] }: { projects: ProjectStatus[] }) {
    return (
        <Card className="p-5 bg-[#0b1121] border-white/5 h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">Project Lifecycle Heatmap</h3>
                    <p className="text-xs text-slate-500">Live phase tracking</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr>
                            <th className="p-2 text-xs font-mono text-slate-500 w-24">PROJECT</th>
                            {phases.map(p => (
                                <th key={p} className="p-2 text-center text-[10px] font-mono text-slate-500">{p}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="space-y-1">
                        {projects.map(project => (
                            <tr key={project.id} className="group border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                                <td className="p-2">
                                    <div className="font-bold text-sm text-slate-200">{project.code}</div>
                                    <div className="text-[10px] text-slate-500 truncate max-w-[100px]">{project.name}</div>
                                </td>
                                {Object.values(project.phases).map((status, i) => (
                                    <td key={i} className="p-1">
                                        <div
                                            className={`h-6 w-full rounded-md ${statusColors[status]} opacity-80 group-hover:opacity-100 transition-opacity`}
                                            title={`${Object.keys(project.phases)[i]}: ${status}`}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
