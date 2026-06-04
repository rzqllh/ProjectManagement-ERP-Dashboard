import { BaseEntity } from './base';

export type TimelineRelatedType = 'nd' | 'project' | 'decision' | 'stakeholder';
export type TimelineActorType = 'user' | 'system' | 'automation';
export type TimelineSeverity = 'info' | 'warning' | 'critical';

export type TimelineEventType =
    | 'created'
    | 'status_changed'
    | 'updated'
    | 'deleted'
    | 'pic_changed'
    | 'next_action_updated'
    | 'deadline_changed'
    | 'escalation_flagged'
    | 'linked_to_project'
    | 'decision_made'
    | 'decision_updated'
    | 'decision_status_changed'
    | 'stakeholder_linked';

export interface TimelineEvent extends BaseEntity {
    // Legacy mapping (to be deprecated in favor of entity_)
    related_type: TimelineRelatedType;
    related_id: string;

    // New Intelligence Fields
    entity_type: TimelineRelatedType;
    entity_id: string;
    actor_id?: string;
    actor_type: TimelineActorType;
    severity: TimelineSeverity;

    event_type: TimelineEventType;
    description: string;
    event_date: string; // ISO
    metadata?: Record<string, any>; // For storing old/new values
}
