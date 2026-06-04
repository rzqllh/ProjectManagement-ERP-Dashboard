'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Network,
    AlertTriangle,
    Link2Off,
    ChevronRight,
    FileText,
    GitBranch,
    Users,
    Briefcase,
    Loader2,
    X,
    Zap,
    ShieldAlert,
    Search,
} from 'lucide-react';
import { AddEdgeDialog } from '@/components/graph/AddEdgeDialog';
import type { GraphData } from '@/types/graph';
import type { NodeType, EdgeRelationshipType } from '@/types/nd';

// Lazy load the graph canvas — not in main dashboard bundle
const GraphCanvas = dynamic(
    () => import('@/components/graph/GraphCanvas').then(mod => ({ default: mod.GraphCanvas })),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-[#0a0e1a]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-caneris-cyan/30 border-t-caneris-cyan rounded-full animate-spin" />
                    <span className="text-xs text-[#64748b] font-mono">Loading graph engine...</span>
                </div>
            </div>
        ),
    }
);

// ─── Icon map ───
const TYPE_ICONS: Record<string, React.ElementType> = {
    nd: FileText,
    decision: GitBranch,
    stakeholder: Users,
    project: Briefcase,
};

// ─── Page ───
export default function GraphPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [rootId, setRootId] = useState(searchParams.get('root_id') || '');
    const [rootType, setRootType] = useState<NodeType>((searchParams.get('root_type') as NodeType) || 'nd');
    const [depth, setDepth] = useState(parseInt(searchParams.get('depth') || '2', 10));

    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sidebar
    const [selectedNode, setSelectedNode] = useState<any>(null);
    const [selectedEdge, setSelectedEdge] = useState<any>(null);
    const [impactData, setImpactData] = useState<any>(null);
    const [blockChain, setBlockChain] = useState<any>(null);
    const [analysisLoading, setAnalysisLoading] = useState(false);

    // ─── Fetch graph data ───
    const fetchGraph = useCallback(async () => {
        if (!rootId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/graph?root_id=${rootId}&root_type=${rootType}&depth=${depth}`);
            const json = await res.json();
            if (!json.success) throw new Error(json.error?.message || 'Failed to load graph');
            setGraphData(json.data);
        } catch (err: any) {
            setError(err.message);
            setGraphData(null);
        } finally {
            setLoading(false);
        }
    }, [rootId, rootType, depth]);

    // Auto-fetch on mount if params present
    useEffect(() => {
        if (rootId) fetchGraph();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Node click → sidebar ───
    const handleNodeClick = useCallback((nodeId: string, nodeType: string) => {
        const node = graphData?.nodes.find(n => n.id === nodeId);
        setSelectedNode(node || { id: nodeId, type: nodeType });
        setSelectedEdge(null);
        setImpactData(null);
        setBlockChain(null);
    }, [graphData]);

    // ─── Edge click → sidebar ───
    const handleEdgeClick = useCallback((edgeId: string, edgeData: any) => {
        const edge = graphData?.edges.find(e => e.id === edgeId);
        setSelectedEdge({ ...edge, ...edgeData });
        setSelectedNode(null);
    }, [graphData]);

    // ─── Impact analysis ───
    const fetchImpact = useCallback(async (nodeId: string, nodeType: string) => {
        setAnalysisLoading(true);
        try {
            const res = await fetch(`/api/graph/impact?node_id=${nodeId}&node_type=${nodeType}`);
            const json = await res.json();
            if (json.success) setImpactData(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setAnalysisLoading(false);
        }
    }, []);

    // ─── Block chain analysis ───
    const fetchBlockChain = useCallback(async (nodeId: string, nodeType: string) => {
        setAnalysisLoading(true);
        try {
            const res = await fetch(`/api/graph/blockers?node_id=${nodeId}&node_type=${nodeType}`);
            const json = await res.json();
            if (json.success) setBlockChain(json.data);
        } catch (err) {
            console.error(err);
        } finally {
            setAnalysisLoading(false);
        }
    }, []);

    // ─── Add edge handler ───
    const handleAddEdge = useCallback(async (data: any) => {
        const res = await fetch('/api/graph/edges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Failed');
        // Refresh graph
        await fetchGraph();
    }, [fetchGraph]);

    // ─── Delete edge handler ───
    const handleDeleteEdge = useCallback(async (edgeId: string) => {
        const res = await fetch(`/api/graph/edges?id=${edgeId}`, { method: 'DELETE' });
        const json = await res.json();
        if (!json.success) throw new Error(json.error?.message || 'Failed');
        setSelectedEdge(null);
        await fetchGraph();
    }, [fetchGraph]);

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            {/* Toolbar */}
            <div className="shrink-0 bg-[#0f172a] border-b border-white/5 px-4 py-2.5 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-white">
                    <Network className="w-4 h-4 text-caneris-cyan" />
                    <span className="text-sm font-semibold">Graph Engine</span>
                </div>

                <div className="w-px h-5 bg-white/10" />

                {/* Root ID input */}
                <div className="flex items-center gap-1.5">
                    <Search className="w-3 h-3 text-[#64748b]" />
                    <Input
                        value={rootId}
                        onChange={(e) => setRootId(e.target.value)}
                        placeholder="Root entity ID..."
                        className="w-48 h-7 text-xs bg-[#0f172a]/50 border-white/10 font-mono"
                    />
                </div>

                <Select value={rootType} onValueChange={(v) => setRootType(v as NodeType)}>
                    <SelectTrigger className="w-28 h-7 text-xs bg-[#0f172a]/50 border-white/10">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                        <SelectItem value="nd" className="text-xs text-white">ND</SelectItem>
                        <SelectItem value="decision" className="text-xs text-white">Decision</SelectItem>
                        <SelectItem value="stakeholder" className="text-xs text-white">Stakeholder</SelectItem>
                        <SelectItem value="project" className="text-xs text-white">Project</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={String(depth)} onValueChange={(v) => setDepth(parseInt(v))}>
                    <SelectTrigger className="w-24 h-7 text-xs bg-[#0f172a]/50 border-white/10">
                        <SelectValue placeholder="Depth" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10">
                        {[1, 2, 3, 4, 5].map(d => (
                            <SelectItem key={d} value={String(d)} className="text-xs text-white">
                                Depth {d}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Button
                    onClick={fetchGraph}
                    size="sm"
                    className="h-7 text-xs bg-caneris-cyan text-black hover:bg-caneris-cyan/90"
                    disabled={!rootId || loading}
                >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Load Graph'}
                </Button>

                <div className="w-px h-5 bg-white/10" />

                <AddEdgeDialog onAddEdge={handleAddEdge} />

                {/* Stats */}
                {graphData && (
                    <div className="ml-auto flex items-center gap-3 text-[10px] font-mono text-[#64748b]">
                        <span>{graphData.nodes.length} nodes</span>
                        <span>{graphData.edges.length} edges</span>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Graph Canvas */}
                <div className="flex-1 relative">
                    {error && (
                        <div className="absolute inset-x-0 top-0 z-10 m-4">
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                <span className="text-xs text-red-300">{error}</span>
                                <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    )}
                    <GraphCanvas
                        graphData={graphData}
                        loading={loading}
                        onNodeClick={handleNodeClick}
                        onEdgeClick={handleEdgeClick}
                    />
                </div>

                {/* Sidebar */}
                {(selectedNode || selectedEdge) && (
                    <div className="w-72 bg-[#0f172a] border-l border-white/5 overflow-y-auto shrink-0">
                        <div className="p-4 space-y-4">
                            {/* Close button */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-mono text-[#64748b] uppercase tracking-wider">
                                    {selectedNode ? 'Node Detail' : 'Edge Detail'}
                                </span>
                                <button
                                    onClick={() => { setSelectedNode(null); setSelectedEdge(null); setImpactData(null); setBlockChain(null); }}
                                    className="text-[#64748b] hover:text-white"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Node Detail */}
                            {selectedNode && (
                                <>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            {TYPE_ICONS[selectedNode.type] && (() => {
                                                const Icon = TYPE_ICONS[selectedNode.type];
                                                return <Icon className="w-4 h-4 text-caneris-cyan" />;
                                            })()}
                                            <span className="text-xs font-mono uppercase text-[#94a3b8]">{selectedNode.type}</span>
                                        </div>
                                        <h3 className="text-sm text-white font-medium leading-tight">{selectedNode.title || selectedNode.id}</h3>

                                        <div className="flex items-center gap-2 text-[10px]">
                                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-[#94a3b8] font-mono">
                                                {selectedNode.status}
                                            </span>
                                            {selectedNode.risk_level && selectedNode.risk_level !== 'none' && (
                                                <span className={`px-1.5 py-0.5 rounded font-mono ${selectedNode.risk_level === 'escalated' || selectedNode.risk_level === 'high'
                                                        ? 'bg-red-500/10 text-red-400'
                                                        : selectedNode.risk_level === 'risk' || selectedNode.risk_level === 'medium'
                                                            ? 'bg-yellow-500/10 text-yellow-400'
                                                            : 'bg-green-500/10 text-green-400'
                                                    }`}>
                                                    {selectedNode.risk_level}
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-[10px] font-mono text-[#4b5563] break-all">
                                            ID: {selectedNode.id}
                                        </div>
                                    </div>

                                    {/* Analysis Buttons */}
                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                        <span className="text-[9px] font-mono text-[#4b5563] uppercase tracking-wider">Risk Analysis</span>
                                        <div className="flex flex-col gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-[10px] justify-start bg-[#1e293b] border-white/10 text-white hover:bg-white/10"
                                                onClick={() => fetchImpact(selectedNode.id, selectedNode.type)}
                                                disabled={analysisLoading}
                                            >
                                                <Zap className="w-3 h-3 mr-1.5 text-yellow-400" />
                                                Impact Radius
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 text-[10px] justify-start bg-[#1e293b] border-white/10 text-white hover:bg-white/10"
                                                onClick={() => fetchBlockChain(selectedNode.id, selectedNode.type)}
                                                disabled={analysisLoading}
                                            >
                                                <ShieldAlert className="w-3 h-3 mr-1.5 text-red-400" />
                                                Blocker Chain
                                            </Button>
                                        </div>

                                        {analysisLoading && (
                                            <div className="flex items-center gap-2 py-2">
                                                <Loader2 className="w-3 h-3 animate-spin text-caneris-cyan" />
                                                <span className="text-[10px] text-[#64748b]">Analyzing...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Impact Results */}
                                    {impactData && (
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <span className="text-[9px] font-mono text-yellow-400/80 uppercase tracking-wider">
                                                ⚡ Impact Radius ({impactData.affected?.length || 0} affected)
                                            </span>
                                            {impactData.affected?.length > 0 ? (
                                                <div className="space-y-1">
                                                    {impactData.affected.map((node: any) => (
                                                        <div
                                                            key={node.id}
                                                            className="flex items-center gap-2 p-1.5 rounded bg-yellow-500/5 border border-yellow-500/10"
                                                        >
                                                            <ChevronRight className="w-2.5 h-2.5 text-yellow-400" />
                                                            <span className="text-[10px] text-white truncate">{node.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-[#4b5563]">No downstream entities affected.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Block Chain Results */}
                                    {blockChain && (
                                        <div className="space-y-2 pt-2 border-t border-white/5">
                                            <span className="text-[9px] font-mono text-red-400/80 uppercase tracking-wider">
                                                🔗 Blocker Chain (depth {blockChain.depth})
                                            </span>
                                            {blockChain.blocker_chain?.length > 0 ? (
                                                <div className="space-y-1">
                                                    {blockChain.blocker_chain.map((item: any, i: number) => (
                                                        <div
                                                            key={item.node.id}
                                                            className="flex items-center gap-2 p-1.5 rounded bg-red-500/5 border border-red-500/10"
                                                        >
                                                            <span className="text-[9px] font-mono text-red-400 w-4">{i + 1}.</span>
                                                            <span className="text-[10px] text-white truncate">{item.node.title}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-[#4b5563]">No blocking chain found.</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Quick actions */}
                                    <div className="pt-2 border-t border-white/5">
                                        {selectedNode.type === 'nd' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-full text-[10px] justify-start bg-[#1e293b] border-white/10 text-caneris-cyan hover:bg-white/10"
                                                onClick={() => router.push(`/nd/${selectedNode.id}`)}
                                            >
                                                <FileText className="w-3 h-3 mr-1.5" />
                                                Open ND Detail
                                            </Button>
                                        )}
                                        {selectedNode.type === 'stakeholder' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-full text-[10px] justify-start bg-[#1e293b] border-white/10 text-caneris-cyan hover:bg-white/10"
                                                onClick={() => router.push(`/stakeholders/${selectedNode.id}`)}
                                            >
                                                <Users className="w-3 h-3 mr-1.5" />
                                                Open Stakeholder Profile
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Edge Detail */}
                            {selectedEdge && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-mono text-[#94a3b8]">{selectedEdge.relationship_type}</span>
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${selectedEdge.origin === 'system'
                                                ? 'bg-blue-500/10 text-blue-400'
                                                : 'bg-green-500/10 text-green-400'
                                            }`}>
                                            {selectedEdge.origin}
                                        </span>
                                    </div>

                                    <div className="text-[10px] space-y-1.5 text-[#64748b]">
                                        <div>From: <span className="text-white font-mono">{selectedEdge.from_type}:{selectedEdge.from_id?.slice(0, 12)}...</span></div>
                                        <div>To: <span className="text-white font-mono">{selectedEdge.to_type}:{selectedEdge.to_id?.slice(0, 12)}...</span></div>
                                    </div>

                                    {selectedEdge.origin === 'manual' && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-[10px] text-red-400 border-red-400/20 hover:bg-red-500/10 w-full"
                                            onClick={() => handleDeleteEdge(selectedEdge.id)}
                                        >
                                            <Link2Off className="w-3 h-3 mr-1.5" />
                                            Remove Edge
                                        </Button>
                                    )}
                                    {selectedEdge.origin === 'system' && (
                                        <p className="text-[9px] text-[#4b5563] italic">
                                            System-managed edge. Remove the FK link to delete.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
