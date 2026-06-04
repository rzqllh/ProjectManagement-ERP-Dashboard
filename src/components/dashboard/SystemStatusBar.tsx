'use client';

import { useEffect, useState, useCallback } from 'react';

interface ServiceStatus {
    status: 'online' | 'error' | 'not_connected' | 'checking';
    latency?: number;
}

interface SystemStatusData {
    firestore: ServiceStatus;
    auth: ServiceStatus;
    ai_brain: ServiceStatus;
    telegram: ServiceStatus;
    escalation: ServiceStatus;
}

export function SystemStatusBar() {
    const [status, setStatus] = useState<SystemStatusData>({
        firestore: { status: 'checking' },
        auth: { status: 'checking' },
        ai_brain: { status: 'checking' },
        telegram: { status: 'checking' },
        escalation: { status: 'checking' },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [lastChecked, setLastChecked] = useState<Date | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/system-status');
            if (res.ok) {
                const json = await res.json();
                const services = json.data.services;
                setStatus(services);
                setLastChecked(new Date());
            } else {
                setStatus({
                    firestore: { status: 'error' },
                    auth: { status: 'error' },
                    ai_brain: { status: 'not_connected' },
                    telegram: { status: 'not_connected' },
                    escalation: { status: 'not_connected' },
                });
                setLastChecked(new Date());
            }
        } catch {
            setStatus({
                firestore: { status: 'error' },
                auth: { status: 'error' },
                ai_brain: { status: 'not_connected' },
                telegram: { status: 'not_connected' },
                escalation: { status: 'not_connected' },
            });
            setLastChecked(new Date());
        }
    }, []);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30_000);
        return () => clearInterval(interval);
    }, [fetchStatus]);

    const serviceLabels: Record<string, string> = {
        firestore: 'Firestore',
        auth: 'Auth',
        ai_brain: 'AI Brain',
        telegram: 'Telegram',
        escalation: 'Escalation',
    };

    const getStatusConfig = (s: ServiceStatus) => {
        switch (s.status) {
            case 'online':
                return { dotClass: 'bg-caneris-cyan', textClass: 'text-caneris-cyan', label: 'ONLINE', animate: true };
            case 'error':
                return { dotClass: 'bg-red-500', textClass: 'text-red-400', label: 'ERROR', animate: false };
            case 'not_connected':
                return { dotClass: 'bg-[#4b5563]', textClass: 'text-[#4b5563]', label: 'OFFLINE', animate: false };
            case 'checking':
            default:
                return { dotClass: 'bg-caneris-yellow', textClass: 'text-caneris-yellow', label: 'CHECKING', animate: true };
        }
    };

    return (
        <div className="glass-card rounded-xl p-3 animate-fade-in-up h-full flex flex-col justify-center bg-white/[0.02] border border-white/5" style={{ animationDelay: '350ms' }}>
            <div className="flex flex-wrap gap-3 items-center justify-end">
                {Object.entries(status).map(([key, svc]) => {
                    const config = getStatusConfig(svc);
                    return (
                        <div key={key} className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded-full border border-white/5">
                            <div className={`w-1.5 h-1.5 rounded-full ${config.dotClass} ${config.animate ? 'animate-pulse' : ''}`} />
                            <span className="text-[10px] font-mono text-slate-400 hidden lg:inline">{serviceLabels[key]}</span>
                            <span className={`text-[9px] font-mono uppercase tracking-wider ${config.textClass}`}>
                                {config.label}
                            </span>
                        </div>
                    );
                })}
                <button
                    onClick={fetchStatus}
                    className="text-[10px] text-slate-500 hover:text-white transition-colors"
                    title="Refresh status"
                >
                    ↻
                </button>
            </div>
        </div>
    );
}
