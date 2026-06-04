import { BaseEntity } from './base';

export type NdCategory = 'business' | 'technical' | 'guidance' | 'order' | 'access' | 'other';
export type NdStatus = 'waiting_external' | 'waiting_internal' | 'drafting' | 'issued' | 'clear' | 'escalated';

// Escalation: Option B — Cached + Deterministic
// Read-only from cron. Never updated manually. Always has evaluation timestamp.
export type EscalationLevel = 'none' | 'risk' | 'escalated';

export interface NdeRecord extends BaseEntity {
    nd_number: string;
    title: string;

    // Stakeholder linking (IDs for relationships, strings for backward compat display)
    sender: string;           // Display name (snapshot)
    sender_id?: string;       // FK → stakeholders collection
    receiver: string;         // Display name (snapshot)
    receiver_id?: string;     // FK → stakeholders collection

    category: NdCategory;
    related_project_id: string | null;
    parent_nd_id: string | null;
    status: NdStatus;
    next_action: string;
    pic: string;
    deadline: string | null; // ISO Date
    blocker_description: string | null;
    attachment_links: string[];
    tags: string[];

    // Escalation: Option B — Cached + Deterministic
    // Managed exclusively by /api/cron/escalation. Never set manually.
    escalation_level?: EscalationLevel;
    escalation_last_evaluated_at?: string; // ISO — when cron last ran on this record
}

// Semantic Edge Taxonomy — AI-ready for Phase 4 reasoning
export type EdgeRelationshipType =
    | 'parent_of' | 'belongs_to'              // Structural (hierarchy)
    | 'triggers' | 'blocks' | 'escalates_to'  // Causal (cause-effect)
    | 'references' | 'decides_on'             // Reference (context)
    | 'assigned_to' | 'sent_by';              // Stakeholder (role-based)

export type NodeType = 'nd' | 'project' | 'decision' | 'stakeholder';
export type EdgeOrigin = 'system' | 'manual';

export interface NdEdge extends BaseEntity {
    from_type: NodeType;
    from_id: string;
    to_type: NodeType;
    to_id: string;
    relationship_type: EdgeRelationshipType;
    origin: EdgeOrigin;
    metadata?: Record<string, any>; // For AI context enrichment
}

// DTOs
export type CreateNdeRecordInput = Omit<NdeRecord, keyof BaseEntity | 'escalation_level' | 'escalation_last_evaluated_at'>;
export type UpdateNdeRecordInput = Partial<Omit<NdeRecord, keyof BaseEntity | 'escalation_level' | 'escalation_last_evaluated_at'>>;
