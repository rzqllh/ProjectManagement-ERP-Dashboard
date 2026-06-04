'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="h-full w-full flex items-center justify-center p-6 animate-fade-in-up">
            <Card className="max-w-md w-full p-8 bg-[#0b1121] border-red-900/30 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 ring-1 ring-red-500/20">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <h2 className="text-xl font-bold text-white mb-2">
                    Dashboard Malfunction
                </h2>

                <p className="text-slate-400 mb-6 text-sm">
                    The command center encountered a critical error while loading system metrics.
                    {error.message && <span className="block mt-2 font-mono text-xs text-red-400 p-2 bg-red-950/30 rounded">{error.message}</span>}
                </p>

                <div className="flex gap-4">
                    <Button
                        onClick={() => reset()}
                        className="bg-caneris-cyan hover:bg-caneris-cyan/80 text-black font-bold"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reinitialize System
                    </Button>
                </div>
            </Card>
        </div>
    );
}
