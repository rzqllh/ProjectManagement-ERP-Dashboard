'use client';

import { useEffect, useState } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ProjectHealthCard() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                // Fetching recent projects - limiting to 5 for the card
                const res = await fetch('/api/projects?limit=5');
                const json = await res.json();
                if (json.success) {
                    setProjects(json.data.slice(0, 5));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    return (
        <div className="glass-card rounded-xl p-5 animate-fade-in-up h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#64748b]">
                    Project Health
                </p>
                <button
                    onClick={() => router.push('/projects')}
                    className="text-[10px] text-caneris-cyan hover:underline flex items-center gap-1"
                >
                    View All <ArrowRight className="w-3 h-3" />
                </button>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-slate-600 animate-spin" />
                </div>
            ) : projects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs">
                    No active projects.
                </div>
            ) : (
                <div className="space-y-4">
                    {projects.map((p) => (
                        <div key={p.id} className="space-y-1.5 cursor-pointer hover:bg-white/5 p-2 rounded-lg -mx-2 transition-colors" onClick={() => router.push(`/projects/${p.id}`)}>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-white font-medium truncate max-w-[120px]">{p.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${p.status === 'completed' ? 'text-emerald-400 bg-emerald-500/10' :
                                        p.status === 'delayed' ? 'text-red-400 bg-red-500/10' :
                                            p.status === 'on_track' ? 'text-caneris-cyan bg-cyan-500/10' :
                                                'text-amber-400 bg-amber-500/10'
                                    }`}>
                                    {p.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${p.progress >= 100 ? 'bg-emerald-500' :
                                            p.status === 'delayed' ? 'bg-red-500' :
                                                'bg-caneris-blue'
                                        }`}
                                    style={{ width: `${p.progress}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
