'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export function ActivityFeed() {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch('/api/timeline/recent');
                if (res.ok) {
                    const json = await res.json();
                    setEvents(json.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    return (
        <div className="glass-card rounded-xl p-5 animate-fade-in-up h-full bg-[#0b1121] border-white/5" style={{ animationDelay: '450ms' }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">Mission Log</h3>
                    <p className="text-xs text-slate-500">Live operation feed</p>
                </div>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 animate-pulse">
                            <div className="w-2 h-2 rounded-full bg-slate-800 mt-2" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-slate-800 rounded w-3/4" />
                                <div className="h-3 bg-slate-800 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 opacity-50">
                    <p className="text-sm text-slate-500">No recent activity detected.</p>
                </div>
            ) : (
                <div className="space-y-0">
                    {events.map((event) => (
                        <div key={event.id} className="flex gap-4 relative group hover:bg-white/[0.02] p-2 rounded-lg transition-colors -mx-2">
                            {/* Connector Line */}
                            <div className="absolute left-[11px] top-6 bottom-[-16px] w-[1px] bg-white/5 last:hidden group-hover:bg-white/10 transition-colors"></div>

                            <div className="mt-2 w-2 h-2 rounded-full bg-caneris-cyan shrink-0 z-10 shadow-[0_0_10px_rgba(6,214,160,0.3)]" />
                            <div>
                                <p className="text-sm text-slate-200 leading-snug font-medium">{event.description}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] text-slate-500 font-mono bg-black/30 px-1.5 rounded">
                                        {new Date(event.event_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-px rounded bg-white/5 text-slate-400 uppercase tracking-wider font-bold">
                                        {event.event_type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
