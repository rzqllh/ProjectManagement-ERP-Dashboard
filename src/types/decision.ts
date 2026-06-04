import { BaseEntity } from './base';

export type DecisionStatus = 'draft' | 'proposed' | 'approved' | 'rejected' | 'implemented';
export type DecisionPriority = 'critical' | 'high' | 'medium' | 'low';

export type DecisionType = 'technical' | 'commercial' | 'governance' | 'risk' | 'strategic';

export interface Decision extends BaseEntity {
    decision_number: string; // e.g., DEC-2024-001
    title: string;
    decision_type: DecisionType;
    context: string; // Background/Problem statement
    proposed_solution?: string;
    decision_outcome?: string; // Final decision
    status: DecisionStatus;
    priority: DecisionPriority;

    pic: string; // Person in Charge
    approver?: string;
    approval_date?: string; // ISO string

    // Relationships
    related_project_id?: string;
    related_nd_id?: string;

    tags: string[];
    attachment_links: string[];
}

export interface CreateDecisionInput {
    title: string;
    decision_type?: DecisionType;
    context: string;
    proposed_solution?: string;
    status?: DecisionStatus;
    priority?: DecisionPriority;
    pic: string;
    related_project_id?: string;
    related_nd_id?: string;
    tags?: string[];
    attachment_links?: string[];
}

export interface UpdateDecisionInput {
    title?: string;
    decision_type?: DecisionType;
    context?: string;
    proposed_solution?: string;
    decision_outcome?: string;
    status?: DecisionStatus;
    priority?: DecisionPriority;
    pic?: string;
    approver?: string;
    approval_date?: string;
    related_project_id?: string;
    related_nd_id?: string;
    tags?: string[];
    attachment_links?: string[];
}
