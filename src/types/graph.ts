import { BaseEntity } from './base';
import { EdgeRelationshipType, EdgeOrigin, NodeType, NdEdge } from './nd';

// ─── Lightweight Projections (never full documents) ───

export interface GraphNode {
    id: string;
    type: NodeType;
    title: string;
    status: string;
    risk_level?: string; // escalation_level for ND, risk_score bucket for stakeholder
}

export interface GraphEdge {
    id: string;
    from_id: string;
    to_id: string;
    from_type: NodeType;
    to_type: NodeType;
    relationship_type: EdgeRelationshipType;
    origin: EdgeOrigin;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

// ─── Risk Analysis Results ───

export interface ImpactRadius {
    root: GraphNode;
    affected: GraphNode[];
    chains: {
        path: GraphNode[];
        edge_types: EdgeRelationshipType[];
    }[];
}

export interface BlockChain {
    blocked_node: GraphNode;
    blocker_chain: {
        node: GraphNode;
        relationship_type: EdgeRelationshipType;
    }[];
    depth: number;
}

// ─── DTOs ───

export type CreateEdgeInput = {
    from_type: NodeType;
    from_id: string;
    to_type: NodeType;
    to_id: string;
    relationship_type: EdgeRelationshipType;
    origin: EdgeOrigin;
    metadata?: Record<string, any>;
};
