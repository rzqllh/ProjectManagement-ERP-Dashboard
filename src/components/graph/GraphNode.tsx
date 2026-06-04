'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { FileText, GitBranch, Users, Briefcase, AlertTriangle, ShieldAlert } from 'lucide-react';

// ─── Node Data Types ───

export type NdNodeData = {
    label: string;
    status: string;
    risk_level?: string;
    nodeType: 'nd' | 'decision' | 'stakeholder' | 'project';
};

// ─── Color Maps ───

const STATUS_COLORS: Record<string, string> = {
    // ND statuses
    'waiting_external': '#f59e0b',
    'waiting_internal': '#3b82f6',
    'drafting': '#8b5cf6',
    'issued': '#10b981',
    'clear': '#22d3ee',
    'escalated': '#ef4444',
    // Decision statuses
    'proposed': '#3b82f6',
    'approved': '#10b981',
    'rejected': '#ef4444',
    'pending': '#f59e0b',
    // Project statuses
    'active': '#10b981',
    'hold': '#f59e0b',
    'completed': '#22d3ee',
    // Stakeholder categories
    'internal': '#3b82f6',
    'external': '#f59e0b',
    'regulator': '#ef4444',
    'vendor': '#8b5cf6',
};

const NODE_ICONS: Record<string, React.ElementType> = {
    'nd': FileText,
    'decision': GitBranch,
    'stakeholder': Users,
    'project': Briefcase,
};

const NODE_BORDER_COLORS: Record<string, string> = {
    'nd': '#22d3ee',
    'decision': '#a78bfa',
    'stakeholder': '#f59e0b',
    'project': '#10b981',
};

const RISK_GLOW: Record<string, string> = {
    'none': '',
    'risk': '0 0 12px rgba(245, 158, 11, 0.4)',
    'escalated': '0 0 16px rgba(239, 68, 68, 0.5)',
    'high': '0 0 16px rgba(239, 68, 68, 0.5)',
    'medium': '0 0 12px rgba(245, 158, 11, 0.3)',
    'low': '',
};

// ─── Custom Graph Node ───

function GraphNodeComponent({ data, selected }: NodeProps) {
    const nodeData = data as unknown as NdNodeData;
    const Icon = NODE_ICONS[nodeData.nodeType] || FileText;
    const borderColor = NODE_BORDER_COLORS[nodeData.nodeType] || '#64748b';
    const statusColor = STATUS_COLORS[nodeData.status] || '#64748b';
    const glow = RISK_GLOW[nodeData.risk_level || 'none'] || '';

    const isEscalated = nodeData.risk_level === 'escalated' || nodeData.risk_level === 'high';

    return (
        <div
            className="relative"
            style={{
                boxShadow: selected
                    ? `0 0 0 2px ${borderColor}, ${glow}`
                    : glow || 'none',
            }}
        >
            <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-[#1e293b] !border-2" style={{ borderColor }} />

            <div
                className="rounded-lg border bg-[#0f172a]/95 backdrop-blur-sm min-w-[180px] max-w-[220px] overflow-hidden"
                style={{ borderColor: selected ? borderColor : 'rgba(255,255,255,0.1)' }}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-2 px-3 py-2 border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.05)', backgroundColor: `${borderColor}08` }}
                >
                    <div
                        className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${borderColor}20` }}
                    >
                        <Icon className="w-3 h-3" style={{ color: borderColor }} />
                    </div>
                    <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: borderColor }}>
                        {nodeData.nodeType}
                    </span>
                    {isEscalated && (
                        <ShieldAlert className="w-3 h-3 text-red-400 ml-auto animate-pulse" />
                    )}
                </div>

                {/* Body */}
                <div className="px-3 py-2.5">
                    <div className="text-xs text-white font-medium truncate leading-tight">
                        {nodeData.label}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center gap-2 px-3 py-1.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                    <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: statusColor }}
                    />
                    <span className="text-[9px] text-[#64748b] font-mono truncate">
                        {nodeData.status}
                    </span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-[#1e293b] !border-2" style={{ borderColor }} />
        </div>
    );
}

export const GraphNode = memo(GraphNodeComponent);
