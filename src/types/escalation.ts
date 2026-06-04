import { BaseEntity } from './base';

export type EscalationRelatedType = 'nd' | 'project';
export type EscalationLevel = 'risk' | 'escalation';

export interface EscalationFlag extends BaseEntity {
    related_type: EscalationRelatedType;
    related_id: string;
    level: EscalationLevel;
    reason: string;
    generated_at: string; // ISO
    resolved: boolean;
}
