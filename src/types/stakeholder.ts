import { BaseEntity } from './base';

export type StakeholderCategory = 'internal' | 'external' | 'regulator' | 'vendor';
export type InfluenceLevel = 'low' | 'medium' | 'high' | 'executive';
export type InteractionType = 'email' | 'meeting' | 'call' | 'escalation' | 'decision';

export interface Stakeholder extends BaseEntity {
    name: string;
    organization: string;
    role: string;
    email: string;
    phone: string;
    category: StakeholderCategory;

    // Intelligence Metrics (Event-driven computed)
    average_response_time_days: number;
    total_nd_count: number;
    total_escalations: number;
    interaction_count: number;
    risk_score: number; // Composite 0-100: f(response_time, escalations, interactions)
    last_interaction_at: string; // ISO
    last_escalation_at?: string; // ISO
    last_response_at?: string; // ISO

    // Enrichment
    influence_level?: InfluenceLevel;
    notes?: string;
    deleted_at?: string; // Audit trail for soft delete
}

// --- Stakeholder Interactions Collection ---
export interface StakeholderInteraction extends BaseEntity {
    stakeholder_id: string;
    nd_id?: string;
    type: InteractionType;
    note: string;
    created_by: string;
}

// --- DTOs ---
// Computed fields excluded from manual input
const COMPUTED_FIELDS = [
    'average_response_time_days',
    'total_nd_count',
    'total_escalations',
    'interaction_count',
    'risk_score',
    'last_interaction_at',
    'last_escalation_at',
    'last_response_at',
    'deleted_at',
] as const;

export type CreateStakeholderInput = Omit<
    Stakeholder,
    keyof BaseEntity | (typeof COMPUTED_FIELDS)[number]
>;
export type UpdateStakeholderInput = Partial<CreateStakeholderInput>;

export type CreateInteractionInput = Omit<StakeholderInteraction, keyof BaseEntity>;
