'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Brain, Send, Loader2, AlertTriangle, CheckCircle2,
    Sparkles, X, FileText, ShieldAlert, Zap,
    ChevronRight, Search, MessageSquare, Archive,
    TrendingUp, Target, GitBranch, Clock, ArrowRight
} from 'lucide-react';
import { AiResponse } from '@/types/ai';
import Link from 'next/link';

interface QueryResult extends AiResponse {
    query_log_id: string;
}

interface LogEntry {
    id: string;
    query_text: string;
    model_id: string;
    detected_intent: string;
    response_summary: string;
    confidence: number;
    response_time_ms: number;
    created_at: string;
}

// Quick action suggestions
const QUICK_ACTIONS = [
    { label: 'Risk Assessment', icon: ShieldAlert, query: 'Analyze all current risks and escalation levels' },
    { label: 'Status Report', icon: TrendingUp, query: 'Give me a comprehensive status overview' },
    { label: 'ND Analysis', icon: FileText, query: 'Analyze all active ND records and their blockers' },
];

// Feature cards for empty state
const FEATURE_CARDS = [
    {
        icon: ShieldAlert,
        title: 'Risk Scanner',
        description: 'Identify escalation risks and stalled NDs across your portfolio.',
        badge: 'Analyze Risk',
        badgeColor: 'text-red-400 bg-red-500/10 border-red-500/20',
        query: 'What are the current risk levels across all NDs?',
    },
    {
        icon: GitBranch,
        title: 'ND Deep Dive',
        description: 'Trace dependencies, blockers, and status chains for any ND.',
        badge: 'Trace ND',
        badgeColor: 'text-caneris-blue bg-caneris-blue/10 border-caneris-blue/20',
        query: 'Analyze the dependency chain and blockers for active NDs',
    },
    {
        icon: Target,
        title: 'Decision Helper',
        description: 'Get AI-powered recommendations for pending decisions.',
        badge: 'Get Insight',
        badgeColor: 'text-caneris-purple bg-caneris-purple/10 border-caneris-purple/20',
        query: 'What pending decisions need attention and what do you recommend?',
    },
];

export function AiBrainPanel() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<QueryResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [configured, setConfigured] = useState<boolean | null>(null);
    const [history, setHistory] = useState<LogEntry[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);


    // Loading State
    const [loadingStep, setLoadingStep] = useState(0);
    const loadingSteps = [
        "Initializing neural uplink...",
        "Parsing natural language intent...",
        "Querying knowledge base...",
        "Analyzing graph dependencies...",
        "Synthesizing strategic response...",
        "Compiling mission report...",
    ];

    const abortControllerRef = useRef<AbortController | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ═══ Init ═══
    useEffect(() => {
        checkHealth();
        loadHistory();
    }, []);

    // Loading step animation
    useEffect(() => {
        if (!loading) { setLoadingStep(0); return; }
        const interval = setInterval(() => {
            setLoadingStep(prev => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
        }, 1800);
        return () => clearInterval(interval);
    }, [loading]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px';
        }
    }, [query]);

    const checkHealth = async () => {
        try {
            const res = await fetch('/api/ai/health');
            const json = await res.json();
            setConfigured(json.data.configured);
        } catch { setConfigured(false); }
    };

    const loadHistory = async () => {
        setHistoryLoading(true);
        try {
            const res = await fetch('/api/ai/logs?limit=30');
            const json = await res.json();
            setHistory(json.data || []);
        } catch { setHistory([]); }
        finally { setHistoryLoading(false); }
    };

    // ═══ Actions ═══
    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (loading) {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
            setLoading(false);
            setError("Query cancelled.");
            return;
        }

        if (!query.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            const { fetchAiResponseSafely } = await import('@/lib/ai-api');
            const response = await fetchAiResponseSafely(
                { query: query.trim() },
                controller.signal
            );

            if (response) {
                setResult(response as QueryResult);
                loadHistory();
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                if (controller.signal.aborted) {
                    setError("Query cancelled.");
                }
                return;
            }
            if (err.message?.includes('429') || err.message?.includes('Quota')) {
                setError("Rate limit reached. Please wait a moment before trying again.");
            } else {
                setError(err instanceof Error ? err.message : 'Failed to query AI');
            }
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    };

    const submitQuery = (q: string) => {
        setQuery(q);
        setResult(null);
        setError(null);
        // Small delay to let state update, then submit
        setTimeout(() => {
            setLoading(true);
            setError(null);
            setResult(null);

            const controller = new AbortController();
            abortControllerRef.current = controller;

            import('@/lib/ai-api').then(({ fetchAiResponseSafely }) => {
                fetchAiResponseSafely({ query: q }, controller.signal)
                    .then(response => {
                        if (response) {
                            setResult(response as QueryResult);
                            loadHistory();
                        }
                    })
                    .catch((err: any) => {
                        if (err.name !== 'AbortError') {
                            if (err.message?.includes('429') || err.message?.includes('Quota')) {
                                setError("Rate limit reached. Please wait a moment before trying again.");
                            } else {
                                setError(err instanceof Error ? err.message : 'Failed to query AI');
                            }
                        }
                    }).finally(() => {
                        setLoading(false);
                        abortControllerRef.current = null;
                    });
            });
        }, 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const loadFromHistory = (log: LogEntry) => {
        setQuery(log.query_text);
    };

    // ═══ Render Helpers ═══
    const confidenceColor = (c: number) => {
        if (c >= 0.7) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
        if (c >= 0.4) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-red-400 bg-red-500/10 border-red-500/20';
    };

    const intentIcon = (intent: string) => {
        switch (intent) {
            case 'risk': return <ShieldAlert className="w-3 h-3" />;
            case 'nd': return <FileText className="w-3 h-3" />;
            case 'decision': return <Target className="w-3 h-3" />;
            default: return <MessageSquare className="w-3 h-3" />;
        }
    };

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    if (configured === false) return <NotConfiguredState />;
    if (configured === null) return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="animate-spin text-slate-500 w-8 h-8" />
        </div>
    );

    // ═══ Main Render ═══
    return (
        <div className="flex h-full overflow-hidden relative">

            {/* ─── SIDEBAR ─── */}
            <div
                style={{ width: showSidebar ? '18rem' : '0px' }}
                className={`flex-shrink-0 bg-caneris-darker/60 backdrop-blur-lg border-r border-white/5 flex flex-col overflow-hidden transition-all duration-300 ${showSidebar ? 'opacity-100' : 'opacity-0'}`}
            >

                {/* Sidebar Header */}
                <div className="p-4 border-b border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-caneris-cyan/20 to-caneris-purple/20 flex items-center justify-center border border-white/10">
                                <Brain className="w-4 h-4 text-caneris-cyan" />
                            </div>
                            <span className="font-semibold text-sm text-white">Caneris AI</span>
                        </div>
                        <button
                            onClick={() => setShowSidebar(false)}
                            className="p-1 rounded-md hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* New Chat Button */}
                    <button
                        onClick={() => { setQuery(''); setResult(null); setError(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-sm text-white transition-colors"
                    >
                        <Sparkles className="w-4 h-4 text-caneris-cyan" />
                        New Query
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        Recent Activity
                    </h3>
                </div>

                {/* History List */}
                <div className="flex-1 overflow-y-auto p-2 thin-scrollbar">
                    {historyLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                                <MessageSquare className="w-5 h-5 text-slate-600" />
                            </div>
                            <p className="text-xs text-slate-600">No queries yet.</p>
                            <p className="text-[10px] text-slate-700 mt-1">Start by asking a question below.</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5">
                            {history.map(log => (
                                <button
                                    key={log.id}
                                    onClick={() => loadFromHistory(log)}
                                    disabled={loading}
                                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all group disabled:opacity-40"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-1.5">
                                            {intentIcon(log.detected_intent)}
                                            <span className="text-[10px] text-slate-500">{formatTime(log.created_at)}</span>
                                        </div>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${log.confidence >= 0.7
                                            ? 'text-emerald-400 bg-emerald-500/10'
                                            : 'text-amber-400 bg-amber-500/10'
                                            }`}>
                                            {Math.round(log.confidence * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 truncate group-hover:text-white transition-colors leading-relaxed">
                                        {log.query_text}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar Footer */}
                <div className="p-3 border-t border-white/5">
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white/3 text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full bg-caneris-cyan animate-pulse" />
                        <span className="text-slate-500">Gemini 2.5 Flash · Online</span>
                    </div>
                </div>
            </div>

            {/* ─── MAIN AREA ─── */}
            <div className="flex-1 flex flex-col bg-caneris-dark relative overflow-hidden">

                {/* Background gradient */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-caneris-purple/8 via-caneris-cyan/5 to-transparent rounded-full blur-3xl" />
                </div>

                {/* Toggle sidebar button */}
                {!showSidebar && (
                    <button
                        onClick={() => setShowSidebar(true)}
                        className="absolute top-4 left-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors z-20 border border-white/5"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto thin-scrollbar relative z-10">

                    {/* ═══ EMPTY STATE ═══ */}
                    {!result && !loading && !error && (
                        <div className="flex flex-col items-center justify-center min-h-full px-6 py-12">

                            {/* Brain Orb */}
                            <div className="relative mb-8">
                                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-caneris-cyan/20 via-caneris-purple/15 to-caneris-blue/20 flex items-center justify-center border border-white/10 shadow-[0_0_60px_rgba(6,214,160,0.1)]">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-caneris-cyan/30 to-caneris-purple/20 flex items-center justify-center border border-white/10">
                                        <Brain className="w-7 h-7 text-caneris-cyan" />
                                    </div>
                                </div>
                                <div className="absolute -inset-2 rounded-full bg-caneris-cyan/5 animate-ping opacity-30" />
                            </div>

                            {/* Heading */}
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight text-center">
                                Ready to Analyze?
                            </h2>
                            <p className="text-sm text-slate-500 mb-8 text-center max-w-md">
                                Ask anything about your NDs, risks, decisions, or project status.
                            </p>

                            {/* Quick Action Pills */}
                            <div className="flex flex-wrap justify-center gap-2 mb-12">
                                {QUICK_ACTIONS.map(action => (
                                    <button
                                        key={action.label}
                                        onClick={() => submitQuery(action.query)}
                                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/8 text-sm text-slate-300 hover:bg-white/10 hover:border-white/15 hover:text-white transition-all group"
                                    >
                                        <action.icon className="w-3.5 h-3.5 text-caneris-cyan group-hover:scale-110 transition-transform" />
                                        {action.label}
                                    </button>
                                ))}
                            </div>

                            {/* Feature Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                                {FEATURE_CARDS.map(card => (
                                    <button
                                        key={card.title}
                                        onClick={() => submitQuery(card.query)}
                                        className="group text-left p-5 rounded-xl glass-card glass-card-hover border border-white/5"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-caneris-cyan/20 transition-colors">
                                                <card.icon className="w-4.5 h-4.5 text-slate-400 group-hover:text-caneris-cyan transition-colors" />
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${card.badgeColor}`}>
                                                {card.badge}
                                            </span>
                                        </div>
                                        <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-caneris-cyan transition-colors">{card.title}</h3>
                                        <p className="text-xs text-slate-500 leading-relaxed">{card.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ═══ LOADING STATE ═══ */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center min-h-full px-6">
                            {/* Animated Brain */}
                            <div className="relative mb-10">
                                <div className="w-28 h-28 rounded-full border border-caneris-cyan/20 animate-[spin_8s_linear_infinite] flex items-center justify-center">
                                    <div className="w-20 h-20 rounded-full border border-caneris-purple/30 animate-[spin_6s_linear_infinite_reverse] flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-caneris-cyan/20 to-caneris-purple/20 animate-pulse flex items-center justify-center shadow-[0_0_40px_rgba(6,214,160,0.15)]">
                                            <Brain className="w-6 h-6 text-caneris-cyan" />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 rounded-full animate-ping opacity-10 border border-caneris-cyan" />
                            </div>

                            {/* Progress Steps */}
                            <div className="w-full max-w-xs space-y-2.5">
                                {loadingSteps.map((step, i) => (
                                    <div
                                        key={step}
                                        className={`flex items-center gap-3 transition-all duration-500 ${i === loadingStep ? 'text-caneris-cyan opacity-100' :
                                            i < loadingStep ? 'text-emerald-500/50 opacity-50' :
                                                'text-slate-700 opacity-20'
                                            }`}
                                    >
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === loadingStep ? 'bg-caneris-cyan animate-pulse' :
                                            i < loadingStep ? 'bg-emerald-500' : 'bg-slate-800'
                                            }`}
                                        />
                                        <span className="text-xs font-mono">{step}</span>
                                        {i === loadingStep && <span className="animate-pulse text-caneris-cyan">_</span>}
                                    </div>
                                ))}
                            </div>

                            {/* Cancel hint */}
                            <p className="text-[10px] text-slate-600 mt-8">Press the stop button to cancel</p>
                        </div>
                    )}

                    {/* ═══ ERROR STATE ═══ */}
                    {error && !loading && (
                        <div className="flex items-center justify-center min-h-full px-6">
                            <div className="max-w-md w-full rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center animate-fade-in-up">
                                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                    <AlertTriangle className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-red-300 font-semibold text-lg mb-2">Analysis Failed</h3>
                                <p className="text-red-300/70 text-sm leading-relaxed">{error}</p>
                                <button
                                    onClick={() => setError(null)}
                                    className="mt-4 px-4 py-2 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/15 rounded-lg border border-red-500/20 transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ═══ RESULT STATE ═══ */}
                    {result && !loading && (
                        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6 animate-fade-in-up">

                            {/* Mission Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-caneris-cyan/10 flex items-center justify-center border border-caneris-cyan/20">
                                        <FileText className="w-4 h-4 text-caneris-cyan" />
                                    </div>
                                    <div>
                                        <h2 className="text-white font-semibold text-base">Analysis Report</h2>
                                        <p className="text-[10px] text-slate-500 font-mono">ID: {result.query_log_id?.slice(0, 8).toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 text-xs font-semibold ${confidenceColor(result.confidence_level)}`}>
                                    <Zap className="w-3 h-3 fill-current" />
                                    {Math.round(result.confidence_level * 100)}%
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="glass-card rounded-xl p-6 border border-white/5">
                                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Executive Summary</h3>
                                <p className="text-slate-300 leading-relaxed text-sm">{result.summary}</p>
                            </div>

                            {/* Risks & Actions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Risks */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <ShieldAlert className="w-3.5 h-3.5" />
                                        Identified Risks
                                    </h3>
                                    {result.risk_identified.length > 0 ? (
                                        <div className="space-y-2">
                                            {result.risk_identified.map((risk, i) => (
                                                <div key={i} className="glass-card rounded-lg p-3 text-sm text-red-200/80 flex gap-3 border border-red-500/10">
                                                    <span className="text-red-500/60 font-mono text-xs mt-0.5 flex-shrink-0">0{i + 1}</span>
                                                    <span className="leading-relaxed">{risk}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-lg border border-dashed border-white/5 text-slate-600 text-xs text-center">
                                            No critical risks detected.
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Recommended Actions
                                    </h3>
                                    {result.recommended_action.length > 0 ? (
                                        <div className="space-y-2">
                                            {result.recommended_action.map((action, i) => (
                                                <div key={i} className="glass-card rounded-lg p-3 text-sm text-emerald-200/80 flex gap-3 border border-emerald-500/10">
                                                    <div className="w-4 h-4 rounded-full border border-emerald-500/30 flex-shrink-0 mt-0.5 flex items-center justify-center">
                                                        <ArrowRight className="w-2.5 h-2.5 text-emerald-500/50" />
                                                    </div>
                                                    <span className="leading-relaxed">{action}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-4 rounded-lg border border-dashed border-white/5 text-slate-600 text-xs text-center">
                                            No actions recommended.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reasoning Footer */}
                            <div className="pt-4 border-t border-white/5">
                                <h4 className="text-[10px] uppercase text-slate-600 font-bold tracking-widest mb-2">Analysis Logic</h4>
                                <p className="text-xs text-slate-500 font-mono leading-relaxed glass-card rounded-lg p-4 border border-white/5">
                                    {result.reasoning}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══ INPUT AREA ═══ */}
                <div className="relative z-10 p-4 bg-caneris-dark border-t border-white/5">
                    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                        {/* Main Input */}
                        <div className="relative group">
                            {/* Glow border */}
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-caneris-cyan/20 via-caneris-purple/10 to-caneris-blue/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

                            <div className="relative bg-caneris-surface/80 border border-white/8 rounded-xl overflow-hidden group-focus-within:border-white/15 transition-colors">
                                <textarea
                                    ref={textareaRef}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={loading ? "Generating analysis..." : "Ask anything..."}
                                    disabled={loading}
                                    rows={1}
                                    className="w-full bg-transparent text-white placeholder-slate-600 px-4 pt-3.5 pb-12 resize-none outline-none text-sm disabled:opacity-40 min-h-[52px] max-h-[160px]"
                                />

                                {/* Bottom Toolbar */}
                                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[10px] text-slate-600 px-2 py-1 rounded bg-white/3">
                                            Shift+Enter for new line
                                        </span>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!loading && !query.trim()}
                                        size="sm"
                                        className={`h-8 w-8 rounded-lg p-0 transition-all ${loading
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                                            : 'bg-caneris-cyan text-caneris-dark hover:bg-caneris-cyan/80 shadow-[0_0_20px_rgba(6,214,160,0.2)]'
                                            }`}
                                    >
                                        {loading ? <X className="w-4 h-4" /> : <Send className="w-3.5 h-3.5" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function NotConfiguredState() {
    return (
        <div className="h-[60vh] flex flex-col items-center justify-center space-y-6 text-center animate-fade-in-up px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-caneris-cyan/10 to-caneris-purple/10 flex items-center justify-center border border-white/5">
                <Brain className="w-8 h-8 text-slate-600" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">AI Module Offline</h1>
                <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                    The cognitive engine requires configuration. Please set your Gemini API key in the settings console.
                </p>
            </div>
            <Link href="/settings">
                <Button variant="outline" className="border-caneris-cyan/30 text-caneris-cyan hover:bg-caneris-cyan/10">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Configure Access
                </Button>
            </Link>
        </div>
    );
}
