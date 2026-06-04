'use client';

import { Card } from '@/components/ui/card';
import { PenTool, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

interface ApprovalItem {
    id: string;
    title: string;
    requester: string;
    date: string;
}

export function ApprovalQueue({ items = [] }: { items: ApprovalItem[] }) {
    return (
        <Card className="border-emerald-900/30 bg-gradient-to-br from-[#051a10] to-[#0f172a] p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <PenTool className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">My Approvals</h3>
                        <p className="text-xs text-emerald-300/70 font-mono uppercase tracking-wider">
                            {items.length} PENDING DECISIONS
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-0">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 py-4">
                        <CheckCircle2 className="w-8 h-8 opacity-20 mb-2" />
                        <p className="text-sm">You're all caught up</p>
                    </div>
                ) : (
                    items.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/10 border border-emerald-900/20 hover:bg-emerald-900/20 transition-all"
                        >
                            <div>
                                <p className="text-sm text-slate-200 font-medium truncate w-40">{item.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-500">Req: {item.requester}</span>
                                    <span className="text-[10px] text-slate-600 font-mono">{item.date}</span>
                                </div>
                            </div>

                            <div className="flex gap-1">
                                <Link
                                    href={`/decisions/${item.id}`}
                                    className="p-1.5 rounded-md hover:bg-emerald-500/20 text-emerald-500/50 hover:text-emerald-400 transition-colors"
                                    title="Approve"
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                </Link>
                                <Link
                                    href={`/decisions/${item.id}`}
                                    className="p-1.5 rounded-md hover:bg-red-500/20 text-red-500/50 hover:text-red-400 transition-colors"
                                    title="Reject"
                                >
                                    <XCircle className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Card>
    );
}
