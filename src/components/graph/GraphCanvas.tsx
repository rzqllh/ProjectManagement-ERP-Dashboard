'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    Panel,
    useNodesState,
    useEdgesState,
    type Node,
    type Edge,
    type OnConnect,
    MarkerType,
    ConnectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GraphNode, type NdNodeData } from './GraphNode';
import type { GraphData, GraphEdge } from '@/types/graph';
import type { EdgeRelationshipType } from '@/types/nd';

// ─── Edge Style Map ───

const EDGE_STYLES: Record<string, { stroke: string; strokeDasharray?: string; animated?: boolean }> = {
    // Structural
    'parent_of': { stroke: '#64748b' },
    'belongs_to': { stroke: '#64748b', strokeDasharray: '6 3' },
    // Causal
    'triggers': { stroke: '#f59e0b', animated: true },
    'blocks': { stroke: '#ef4444', animated: true },
    'escalates_to': { stroke: '#ef4444' },
    // Reference
    'references': { stroke: '#94a3b8', strokeDasharray: '4 4' },
    'decides_on': { stroke: '#a78bfa', strokeDasharray: '4 4' },
    // Stakeholder
    'assigned_to': { stroke: '#22d3ee', strokeDasharray: '3 3' },
    'sent_by': { stroke: '#22d3ee', strokeDasharray: '3 3' },
};

const EDGE_LABELS: Record<string, string> = {
    'parent_of': 'parent',
    'belongs_to': 'belongs to',
    'triggers': 'triggers',
    'blocks': 'BLOCKS',
    'escalates_to': 'escalates',
    'references': 'ref',
    'decides_on': 'decides',
    'assigned_to': 'assigned',
    'sent_by': 'sent by',
};

// ─── Layout Helper (simple force-directed-like placement) ───

function layoutNodes(graphData: GraphData): Node[] {
    const nodeCount = graphData.nodes.length;
    if (nodeCount === 0) return [];

    // Simple circular/grid layout
    const cols = Math.ceil(Math.sqrt(nodeCount));
    const spacingX = 280;
    const spacingY = 180;

    return graphData.nodes.map((node, i) => ({
        id: node.id,
        type: 'graphNode',
        position: {
            x: (i % cols) * spacingX,
            y: Math.floor(i / cols) * spacingY,
        },
        data: {
            label: node.title,
            status: node.status,
            risk_level: node.risk_level,
            nodeType: node.type,
        } satisfies NdNodeData,
    }));
}

function layoutEdges(graphEdges: GraphEdge[]): Edge[] {
    return graphEdges.map((edge) => {
        const style = EDGE_STYLES[edge.relationship_type] || { stroke: '#64748b' };
        return {
            id: edge.id,
            source: edge.from_id,
            target: edge.to_id,
            label: EDGE_LABELS[edge.relationship_type] || edge.relationship_type,
            labelStyle: { fontSize: 9, fill: '#64748b', fontFamily: 'monospace' },
            labelBgStyle: { fill: '#0f172a', fillOpacity: 0.9 },
            labelBgPadding: [4, 2] as [number, number],
            style: {
                stroke: style.stroke,
                strokeWidth: edge.relationship_type === 'blocks' ? 2.5 : 1.5,
                strokeDasharray: style.strokeDasharray,
            },
            animated: style.animated || false,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: style.stroke,
                width: 14,
                height: 14,
            },
            data: {
                relationship_type: edge.relationship_type,
                origin: edge.origin,
            },
        };
    });
}

// ─── Props ───

interface GraphCanvasProps {
    graphData: GraphData | null;
    loading: boolean;
    onNodeClick?: (nodeId: string, nodeType: string) => void;
    onEdgeClick?: (edgeId: string, edgeData: any) => void;
}

// ─── Custom node types registry ───

const nodeTypes = {
    graphNode: GraphNode,
};

// ─── Component ───

export function GraphCanvas({ graphData, loading, onNodeClick, onEdgeClick }: GraphCanvasProps) {
    const initialNodes = useMemo(() => graphData ? layoutNodes(graphData) : [], [graphData]);
    const initialEdges = useMemo(() => graphData ? layoutEdges(graphData.edges) : [], [graphData]);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    // Sync when data changes
    useEffect(() => {
        setNodes(graphData ? layoutNodes(graphData) : []);
        setEdges(graphData ? layoutEdges(graphData.edges) : []);
    }, [graphData, setNodes, setEdges]);

    const handleNodeClick = useCallback((_: any, node: Node) => {
        const data = node.data as unknown as NdNodeData;
        onNodeClick?.(node.id, data.nodeType);
    }, [onNodeClick]);

    const handleEdgeClick = useCallback((_: any, edge: Edge) => {
        onEdgeClick?.(edge.id, edge.data);
    }, [onEdgeClick]);

    if (loading) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#0a0e1a]">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-caneris-cyan/30 border-t-caneris-cyan rounded-full animate-spin" />
                    <span className="text-xs text-[#64748b] font-mono">Loading graph...</span>
                </div>
            </div>
        );
    }

    if (!graphData || graphData.nodes.length === 0) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#0a0e1a]">
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                        <svg className="w-6 h-6 text-[#4b5563]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                    </div>
                    <p className="text-sm text-[#64748b]">No graph data found.</p>
                    <p className="text-xs text-[#4b5563]">Select an ND to view its dependency graph.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full" style={{ backgroundColor: '#0a0e1a' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.3}
                maxZoom={2}
                defaultEdgeOptions={{
                    type: 'smoothstep',
                }}
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#1e293b" gap={24} size={1} />
                <Controls
                    showInteractive={false}
                    className="!bg-[#1e293b] !border-white/10 !rounded-lg !shadow-xl [&>button]:!bg-[#1e293b] [&>button]:!border-white/10 [&>button]:!text-white [&>button:hover]:!bg-white/10"
                />
                <MiniMap
                    nodeColor={(node) => {
                        const data = node.data as unknown as NdNodeData;
                        const colors: Record<string, string> = {
                            'nd': '#22d3ee',
                            'decision': '#a78bfa',
                            'stakeholder': '#f59e0b',
                            'project': '#10b981',
                        };
                        return colors[data.nodeType] || '#64748b';
                    }}
                    maskColor="rgba(10, 14, 26, 0.8)"
                    className="!bg-[#0f172a] !border-white/10 !rounded-lg"
                />

                {/* Legend Panel */}
                <Panel position="top-right" className="!m-3">
                    <div className="bg-[#0f172a]/95 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-[9px] space-y-1.5">
                        <div className="text-[#64748b] font-mono uppercase tracking-wider mb-2">Edge Legend</div>
                        {Object.entries(EDGE_LABELS).map(([type, label]) => {
                            const style = EDGE_STYLES[type];
                            return (
                                <div key={type} className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-0 border-t-[2px]"
                                        style={{
                                            borderColor: style?.stroke || '#64748b',
                                            borderStyle: style?.strokeDasharray ? 'dashed' : 'solid',
                                        }}
                                    />
                                    <span className="text-[#94a3b8]">{label}</span>
                                </div>
                            );
                        })}
                    </div>
                </Panel>
            </ReactFlow>
        </div>
    );
}
